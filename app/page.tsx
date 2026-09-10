import Trending from "@/components/Trending";

export default function Home() {
  const explore = ["AI", "Robotics", "Medicine", "Physics", "Databases"];
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold">Emergent</h1>
        <p className="text-zinc-600">Good evening. Explore the world&apos;s research.</p>
      </section>

      <form action="/search" className="flex gap-2">
        <input
          name="q"
          placeholder="Search papers, researchers, topics… Try: AI agents"
          className="w-full rounded border px-3 py-2"
        />
        <button className="rounded bg-black px-4 py-2 text-white">Search</button>
      </form>

      <section>
        <h2 className="mb-2 font-semibold">🔥 Trending research</h2>
        <Trending />
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Explore research</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          {explore.map((t) => (
            <a
              key={t}
              href={`/search?q=${encodeURIComponent(t)}`}
              className="rounded-full border bg-white px-3 py-1"
            >
              {t}
            </a>
          ))}
        </div>
      </section>

      <p className="text-xs text-zinc-500">Data via OpenAlex. Phase 1 MVP.</p>
    </div>
  );
}
