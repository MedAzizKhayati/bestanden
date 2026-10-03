"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { useLocale } from "./client";
import { localizeHref } from "./config";

type LinkProps = ComponentProps<typeof NextLink>;

/**
 * Drop-in replacement for next/link that prefixes internal paths with the current locale:
 * `<Link href="/grammatik">` → `/de/grammatik`. External URLs, anchors and API routes are left alone.
 */
export default function Link({ href, ...props }: LinkProps) {
  const locale = useLocale();
  const localized =
    typeof href === "string"
      ? localizeHref(locale, href)
      : { ...href, pathname: href.pathname ? localizeHref(locale, href.pathname) : href.pathname };
  return <NextLink href={localized} {...props} />;
}
