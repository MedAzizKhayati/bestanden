"""
Local neural text-to-speech for scripts/audio/render.ts (Apple Silicon, via mlx-audio). Free and offline.

    python scripts/audio/local_tts.py --design --engine qwen      # create the cast's reference clips once
    python scripts/audio/local_tts.py --engine qwen < jobs.jsonl  # render: one JSON job per line

Jobs: {"key", "text", "voice", "out"} → writes an MP3 to "out" and prints {"key", "ok", "seconds", "tries"}.
Voices come from scripts/audio/cast.json; their reference clips live in scripts/audio/voices/<engine>/.
Every clip is checked for a plausible length (models sometimes stop early or ramble) and retried.
Setup: see README → "Pre-rendered voices".
"""
import argparse, json, re, subprocess, sys, tempfile, threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
import soundfile as sf
import mlx.core as mx
from mlx_audio.tts.utils import load_model

HERE = Path(__file__).parent
CAST = json.loads((HERE / "cast.json").read_text())
MODELS = {
    "qwen": {"design": "mlx-community/Qwen3-TTS-12Hz-1.7B-VoiceDesign-8bit", "speak": "mlx-community/Qwen3-TTS-12Hz-1.7B-Base-8bit"},
    "voxcpm": {"design": "mlx-community/VoxCPM2-8bit", "speak": "mlx-community/VoxCPM2-8bit"},
}


def log(*a):
    print(*a, file=sys.stderr, flush=True)


def as_array(results):
    chunks = [np.array(r.audio, dtype=np.float32) for r in results]
    return np.concatenate(chunks) if len(chunks) > 1 else chunks[0]


PAUSE_ALLOWANCE = 1.5  # seconds of silence and comma pauses on top of the speech itself


def plausible(text, audio, sr):
    """German speech runs at roughly 11–17 characters per second; far outside means cut off or rambling.
    Short texts („gehen, ging, gegangen“) get a fixed allowance for pauses and the silence at both ends."""
    seconds = len(audio) / sr
    return len(text) / 21 <= seconds <= len(text) / 8 + PAUSE_ALLOWANCE


def token_cap(texts):
    """Qwen3 speaks 12.5 codec frames per second. A take longer than the plausibility limit is rejected
    anyway, so stop about 3 seconds after it instead of letting a runaway take run to 4096 frames."""
    return int((max(len(t) for t in texts) / 8 + PAUSE_ALLOWANCE) * 12.5) + 40


def sentences(text):
    return [s for s in re.split(r"(?<=[.!?…])\s+", text.strip()) if s]


class Engine:
    def __init__(self, name):
        self.name = name
        self.refs = HERE / "voices" / name
        self.model = None
        self.sr = 24000

    def ref_path(self, voice):
        return self.refs / f"{voice}.flac"

    def load(self, which):
        self.model = load_model(MODELS[self.name][which])
        self.sr = self.model.sample_rate

    def design(self, voice, description):
        text = CAST["referenceText"]
        instruct = f"{description} {CAST['accent']}"
        if self.name == "qwen":
            return as_array(self.model.generate_voice_design(text=text, language="german", instruct=instruct))
        return as_array(self.model.generate(text=text, instruct=instruct))

    def speak(self, text, voice):
        ref = str(self.ref_path(voice))
        if self.name == "qwen":
            from mlx_audio.utils import load_audio
            audio = load_audio(ref, sample_rate=self.sr)
            return as_array(self.model.generate(text=text, ref_audio=audio, ref_text=CAST["referenceText"], lang_code="german", max_tokens=token_cap([text])))
        return as_array(self.model.generate(text=text, ref_audio=ref, ref_text=CAST["referenceText"]))

    def speak_batch(self, texts, voice):
        """Several lines of one voice in a single forward pass (Qwen3 only; shared reference clip)."""
        from mlx_audio.utils import load_audio
        ref = load_audio(str(self.ref_path(voice)), sample_rate=self.sr)
        out = [None] * len(texts)
        for r in self.model.batch_generate(texts=texts, ref_audio=ref, ref_text=CAST["referenceText"], lang_code="german", max_tokens=token_cap(texts)):
            out[r.sequence_idx] = np.array(r.audio, dtype=np.float32)
        mx.clear_cache()
        return out

    def render(self, text, voice, tries=3):
        """Whole line first; if it keeps failing, sentence by sentence with short pauses."""
        try:
            return self._render(text, voice, tries)
        finally:
            mx.clear_cache()

    def _render(self, text, voice, tries):
        for attempt in range(tries):
            mx.random.seed(1000 + attempt)
            audio = self.speak(text, voice)
            if plausible(text, audio, self.sr):
                return audio, attempt + 1
        parts = []
        for sentence in sentences(text):
            for attempt in range(tries):
                mx.random.seed(2000 + attempt)
                audio = self.speak(sentence, voice)
                if plausible(sentence, audio, self.sr):
                    break
            else:
                return None, tries * 2
            parts += [audio, np.zeros(int(self.sr * 0.18), dtype=np.float32)]
        return np.concatenate(parts[:-1]), tries + 1


def encode(audio, sr, out):
    """Loudness-normalised mono MP3 (40 kbit/s is plenty for speech)."""
    out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(suffix=".wav") as wav:
        sf.write(wav.name, audio, sr)
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", wav.name, "-af", "loudnorm=I=-18:TP=-1.5:LRA=11", "-ac", "1", "-ar", "24000", "-b:a", "40k", str(out)],
            check=True,
        )


# A reference clip with a bad ending makes the clone model stop early, so every candidate voice must
# speak these lines plausibly before it is kept.
TEST_LINES = [
    "Sehr geehrte Fahrgäste, der Regionalexpress nach Würzburg, planmäßige Abfahrt vierzehn Uhr zweiunddreißig, fährt heute ausnahmsweise von Gleis sieben statt von Gleis drei.",
    "Der Zug fährt um achtzehn Uhr dreißig von Gleis sieben. Die Nummer ist null sechs neun – vier vier zwei eins sieben, und das Ticket kostet zwölf Euro fünfzig.",
    "Na ja, also ehrlich gesagt – ich hab früher auch gedacht, dass das total unnötig ist.",
]


def design_cast(engine, candidates=3):
    engine.refs.mkdir(parents=True, exist_ok=True)
    missing = {v: d for v, d in CAST["voices"].items() if not engine.ref_path(v).exists()}
    if not missing:
        return log("all reference clips exist")
    engine.load("design")
    drafts = {}
    for voice, description in missing.items():
        drafts[voice] = []
        for n in range(candidates):
            mx.random.seed(500 + n)
            drafts[voice].append(engine.design(voice, description))
        log(f"designed {candidates} candidates for {voice}")
    if MODELS[engine.name]["design"] != MODELS[engine.name]["speak"]:
        engine.model = None
        mx.clear_cache()
        engine.load("speak")
    for voice, takes in drafts.items():
        for n, audio in enumerate(takes):
            sf.write(engine.ref_path(voice), audio, engine.sr)
            failed = 0
            for line in TEST_LINES:
                ok = False
                for attempt in range(2):
                    mx.random.seed(3000 + attempt)
                    ok = plausible(line, engine.speak(line, voice), engine.sr)
                    if ok:
                        break
                failed += not ok
            if not failed:
                log(f"✓ {voice}: candidate {n + 1} passes")
                break
            log(f"✗ {voice}: candidate {n + 1} failed {failed} test line(s)")
        else:
            log(f"! {voice}: no candidate passed all test lines – keeping the last one, listen before rendering")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--engine", choices=list(MODELS), default="qwen")
    ap.add_argument("--design", action="store_true", help="create missing reference clips for the cast")
    ap.add_argument("--batch", type=int, default=8, help="lines per forward pass (Qwen3; 1 = one by one)")
    args = ap.parse_args()
    # MLX keeps freed buffers for reuse; over thousands of takes of different lengths that cache grows until
    # the Mac swaps and rendering slows to a crawl. Keep it small (the model itself stays loaded).
    mx.set_cache_limit(1 << 30)
    engine = Engine(args.engine)

    if args.design:
        design_cast(engine)
        return

    engine.load("speak")
    jobs = [json.loads(raw) for raw in sys.stdin if raw.strip()]
    lock = threading.Lock()
    encoder = ThreadPoolExecutor(max_workers=4)

    def report(result):
        with lock:
            print(json.dumps(result), flush=True)

    def finish(job, audio, tries):
        try:
            encode(audio, engine.sr, Path(job["out"]))
            report({"key": job["key"], "ok": True, "seconds": round(len(audio) / engine.sr, 2), "tries": tries})
        except Exception as e:
            report({"key": job["key"], "ok": False, "error": str(e)[:300]})

    def single(job):
        try:
            audio, tries = engine.render(job["text"], job["voice"])
            if audio is None:
                raise RuntimeError("no plausible take")
            encoder.submit(finish, job, audio, tries)
        except Exception as e:  # report and continue with the next line
            report({"key": job["key"], "ok": False, "error": str(e)[:300]})

    if engine.name == "qwen" and args.batch > 1:
        # Group by voice (one reference clip per batch) and by length (less padding).
        by_voice = {}
        for job in jobs:
            by_voice.setdefault(job["voice"], []).append(job)
        for voice, group in by_voice.items():
            group.sort(key=lambda j: len(j["text"]))
            for i in range(0, len(group), args.batch):
                chunk = group[i : i + args.batch]
                mx.random.seed(4000 + i)
                try:
                    takes = engine.speak_batch([j["text"] for j in chunk], voice)
                except Exception as e:
                    log(f"batch failed ({e}); rendering these lines one by one")
                    takes = [None] * len(chunk)
                for job, audio in zip(chunk, takes):
                    if audio is not None and plausible(job["text"], audio, engine.sr):
                        encoder.submit(finish, job, audio, 1)
                    else:
                        single(job)
    else:
        for job in jobs:
            single(job)
    encoder.shutdown(wait=True)


if __name__ == "__main__":
    main()
