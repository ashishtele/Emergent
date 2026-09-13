import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Emergent handles your data — accounts, saved papers and research queries.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.25em] text-accent">Legal</p>
        <h1 className="font-display text-4xl font-black tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-xs text-ink/50 dark:text-paper/50">Last updated September 2026</p>
      </div>
      <section className="space-y-2 text-sm leading-relaxed">
        <h2 className="font-display text-lg font-bold">What Emergent does</h2>
        <p>
          Emergent helps you discover research. It proxies public metadata from OpenAlex, arXiv, Semantic
          Scholar, DOAJ and Unpaywall, and optionally saves papers to your personal library.
        </p>
      </section>
      <section className="space-y-2 text-sm leading-relaxed">
        <h2 className="font-display text-lg font-bold">Accounts</h2>
        <p>
          Signing in (via Supabase) stores your email and authentication tokens so we can keep your saved
          papers and reading paths. We never see your password — magic links and provider-managed auth handle
          credentials.
        </p>
      </section>
      <section className="space-y-2 text-sm leading-relaxed">
        <h2 className="font-display text-lg font-bold">Saved data</h2>
        <p>
          Papers you save, briefs and reading paths you generate are stored against your account so they
          persist across devices. Deleting your account removes this data — contact us via GitHub (link in the
          footer) to request deletion.
        </p>
      </section>
      <section className="space-y-2 text-sm leading-relaxed">
        <h2 className="font-display text-lg font-bold">Cookies & analytics</h2>
        <p>
          We use strictly-necessary cookies for sign-in sessions and your theme preference. We run no
          third-party advertising trackers. If analytics are added later, this page will be updated first.
        </p>
      </section>
      <section className="space-y-2 text-sm leading-relaxed">
        <h2 className="font-display text-lg font-bold">Third parties</h2>
        <p>
          Search queries are forwarded to public research APIs (see above) to fetch results. No account data
          is sent to them. AI briefs and reading paths are generated via the configured AI provider from
          public paper metadata.
        </p>
      </section>
    </div>
  );
}
