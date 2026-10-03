"use client";

import { Fragment, type ReactNode } from "react";
import { splitGaps } from "@/lib/utils/text";

/** Renders a letter/e-mail text: paragraphs (blank line), line breaks and [[n]] gaps. */
export function GapText({ text, renderGap, className }: { text: string; renderGap: (n: number) => ReactNode; className?: string }) {
  const paragraphs = text.split(/\n{2,}/);
  return (
    <div className={className}>
      {paragraphs.map((para, pi) => (
        <p key={pi}>
          {para.split("\n").map((line, li) => (
            <Fragment key={li}>
              {li > 0 && <br />}
              {splitGaps(line).map((piece, i) =>
                piece.kind === "text" ? <Fragment key={i}>{piece.text}</Fragment> : <Fragment key={i}>{renderGap(piece.n)}</Fragment>,
              )}
            </Fragment>
          ))}
        </p>
      ))}
    </div>
  );
}
