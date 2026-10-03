import type { MetadataRoute } from "next";
import { LOCALES, localizeHref } from "@/i18n/config";
import { getGrammarTopics, getReferenceLists, getSetSummaries, getVocabThemes } from "@/lib/content/load";
import { EXAMS, partHref, setHref } from "@/lib/exams";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/einstufung", "/grammatik", "/wortschatz", "/redemittel", "/listen"];
  for (const exam of EXAMS) {
    paths.push(`/${exam.slug}`, `/${exam.slug}/modelltest`, `/${exam.slug}/strategien`);
    for (const section of exam.sections) {
      paths.push(`/${exam.slug}/${section.id}`);
      for (const part of section.parts) {
        paths.push(partHref(exam, part));
        for (const s of getSetSummaries(exam.id, part.id)) paths.push(setHref(exam, part, s.number));
      }
    }
  }
  for (const t of getGrammarTopics()) paths.push(`/grammatik/${t.id}`);
  for (const t of getVocabThemes()) paths.push(`/wortschatz/${t.id}`);
  for (const l of getReferenceLists()) paths.push(`/listen/${l.id}`);

  // One entry per language version, each listing all versions (hreflang); x-default picks by browser language.
  return [...new Set(paths)].flatMap((path) => {
    const languages = Object.fromEntries([
      ...LOCALES.map((l) => [l, `${site.url}${localizeHref(l, path)}`]),
      ["x-default", `${site.url}${path}`],
    ]);
    return LOCALES.map((locale) => ({ url: `${site.url}${localizeHref(locale, path)}`, alternates: { languages } }));
  });
}
