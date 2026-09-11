import Trending from "@/components/Trending";
import StatsStrip from "@/components/StatsStrip";
import TermsMarquee from "@/components/TermsMarquee";
import Reveal from "@/components/Reveal";
import Link from "next/link";

const FEATURES = [
  {
    title: "Search everything",
    body: "Papers, researchers, institutions and topics across hundreds of millions of OpenAlex records.",
    href: "/search",
  },
  {
    title: "Follow the trends",
    body: "Year-over-year growth math surfaces what's heating up — from AI agents to multimodal systems.",
    href: "/topics",
  },
  {
    title: "Learn in order",
    body: "One click turns any topic into a 5-paper reading path, foundational first, AI-guided.",
    href: "/library",
  },
];

export default function Home() {
  const explore = ["AI", "Robotics", "Medicine", "Physics", "Databases"];
  return (
    <div className="space-y-14">
      <section className="pt-6 text-center">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-accent">
          The research compass
        </p>
        <h1 className="mx-auto max-w-3xl font-display text-5xl font-black leading-[1.02] tracking-tight md:text-7xl">
          Explore the world&apos;s research.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-ink/60 md:text-lg">
          Millions of papers, distilled into trends, people and reading paths. Start with a question.
        </p>
        <form action="/search" className="mx-auto mt-8 flex max-w-xl gap-2">
          <input name="q" placeholder="Try: AI agents, CRISPR, quantum…" className="field min-w-0 flex-1" />
          <button className="btn-primary shrink-0">Search</button>
        </form>
      </section>

      <Reveal>
        <StatsStrip />
      </Reveal>

      <Reveal>
        <section>
          <h2 className="section-title mb-3">🔥 Trending now</h2>
          <Trending />
        </section>
      </Reveal>

      <TermsMarquee />

      <Reveal>
        <section className="grid gap-3 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 100}>
              <Link href={f.href} className="card block h-full">
                <div className="font-display text-lg font-bold">{f.title}</div>
                <p className="mt-1 text-sm text-ink/60">{f.body}</p>
              </Link>
            </Reveal>
          ))}
        </section>
      </Reveal>

      <Reveal>
        <section>
          <h2 className="section-title mb-3">Wander somewhere new</h2>
          <div className="flex flex-wrap gap-2">
            {explore.map((t) => (
              <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className="chip">
                {t}
              </Link>
            ))}
          </div>
        </section>
      </Reveal>
    </div>
  );
}
