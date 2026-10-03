/* eslint-disable @next/next/no-html-link-for-pages -- this page renders outside the app; a full page load into /de or /en is intended. */
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Logo } from "@/components/app/logo";
import { site } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = { title: `404 · ${site.name}` };

/** Applies the saved theme (next-themes) – this page renders outside the app's layout. */
const themeScript = `try{var t=localStorage.getItem("theme");var d=t==="dark"||((!t||t==="system")&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}`;

/** Unmatched URLs outside /de and /en. The locale is unknown here, so the page is bilingual. */
export default function GlobalNotFound() {
  return (
    <html lang="de" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <main className="grid min-h-svh place-items-center bg-background px-4 text-foreground">
          <div className="max-w-md text-center">
            <Logo className="justify-center" />
            <p className="mt-10 text-6xl font-bold tracking-tight text-primary tabular">404</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">Seite nicht gefunden</h1>
            <p className="mt-1 text-muted-foreground" lang="en">
              Page not found
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <a href="/de" className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Zur Startseite
              </a>
              <a href="/en" lang="en" className="inline-flex h-9 items-center rounded-lg border px-4 text-sm font-medium hover:bg-muted">
                Go to the start page
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
