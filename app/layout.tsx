import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Emergent — Explore the world's research",
  description: "Discover papers, researchers, institutions and trends via OpenAlex.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold">
              Emergent
            </Link>
            <nav className="flex gap-4 text-sm text-zinc-600">
              <Link href="/search">Search</Link>
              <Link href="/topics">Topics</Link>
              <Link href="/library">Library</Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
