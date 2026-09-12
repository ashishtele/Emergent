import "./globals.css";
import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import Link from "next/link";
import Providers from "./providers";
import ThemeToggle from "@/components/ThemeToggle";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Emergent — Explore the world's research",
  description: "Discover papers, researchers, institutions and trends via OpenAlex.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${display.variable} ${sans.variable} min-h-screen bg-paper font-sans text-ink antialiased dark:bg-coal dark:text-paper`}
      >
        <Providers>
          <header className="sticky top-0 z-10 border-b border-ink/10 bg-paper/85 backdrop-blur dark:border-white/10 dark:bg-coal/85">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
              <Link href="/" className="font-display text-xl font-black tracking-tight">
                Emergent<span className="text-accent">.</span>
              </Link>
              <nav className="flex items-center gap-1 text-sm">
                <Link
                  href="/search"
                  className="rounded-full px-3 py-1.5 hover:bg-ink/5 dark:hover:bg-white/10"
                >
                  Search
                </Link>
                <Link
                  href="/topics"
                  className="rounded-full px-3 py-1.5 hover:bg-ink/5 dark:hover:bg-white/10"
                >
                  Topics
                </Link>
                <Link
                  href="/institutions"
                  className="rounded-full px-3 py-1.5 hover:bg-ink/5 dark:hover:bg-white/10"
                >
                  Globe
                </Link>
                <Link
                  href="/library"
                  className="rounded-full bg-ink px-4 py-1.5 text-paper hover:bg-accent dark:bg-paper dark:text-ink dark:hover:bg-accent dark:hover:text-white"
                >
                  Library
                </Link>
                <span className="ml-1">
                  <ThemeToggle />
                </span>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
          <footer className="border-t border-ink/10 dark:border-white/10">
            <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-ink/50 dark:text-paper/50">
              <span className="font-display text-sm font-bold text-ink dark:text-paper">
                Emergent<span className="text-accent">.</span>
              </span>
              <span>Research data via OpenAlex. Reading paths via open models.</span>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
