import "./globals.css";
import type { Metadata } from "next";

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
            <a href="/" className="text-lg font-bold">
              Emergent
            </a>
            <nav className="flex gap-4 text-sm text-zinc-600">
              <a href="/search">Search</a>
              <a href="/topics">Topics</a>
              <a href="/library">Library</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
