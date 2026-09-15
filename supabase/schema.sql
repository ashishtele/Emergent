-- Emergent Supabase schema — mirrors prisma/schema.prisma + PRD section 15.
-- Run in Supabase SQL editor, or via `npx prisma migrate dev` (same tables).

create table if not exists papers (
  id text primary key,
  openalex_id text unique not null,
  title text not null,
  abstract text,
  publication_date timestamptz,
  doi text,
  citation_count int not null default 0,
  is_open_access boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists institutions (
  id text primary key,
  openalex_id text unique not null,
  name text not null,
  country text,
  type text
);

create table if not exists authors (
  id text primary key,
  openalex_id text unique not null,
  name text not null,
  orcid text,
  institution_id text references institutions(id)
);

create table if not exists topics (
  id text primary key,
  openalex_id text unique not null,
  name text not null,
  field text,
  domain text
);

create table if not exists paper_authors (
  paper_id text references papers(id) on delete cascade,
  author_id text references authors(id) on delete cascade,
  primary key (paper_id, author_id)
);

create table if not exists paper_topics (
  paper_id text references papers(id) on delete cascade,
  topic_id text references topics(id) on delete cascade,
  primary key (paper_id, topic_id)
);

create table if not exists saved_papers (
  user_id uuid references auth.users(id) on delete cascade,
  paper_id text references papers(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, paper_id)
);

alter table papers enable row level security;
alter table institutions enable row level security;
alter table authors enable row level security;
alter table topics enable row level security;
alter table paper_authors enable row level security;
alter table paper_topics enable row level security;
alter table saved_papers enable row level security;

-- Public reference cache (OpenAlex mirror): readable by anyone, writable only
-- via server (Prisma with the direct DB connection bypasses RLS). No write policies
-- => anon/authenticated INSERT/UPDATE/DELETE via PostgREST are denied.
drop policy if exists "public_read" on papers;
create policy "public_read" on papers for select using (true);
drop policy if exists "public_read" on institutions;
create policy "public_read" on institutions for select using (true);
drop policy if exists "public_read" on authors;
create policy "public_read" on authors for select using (true);
drop policy if exists "public_read" on topics;
create policy "public_read" on topics for select using (true);
drop policy if exists "public_read" on paper_authors;
create policy "public_read" on paper_authors for select using (true);
drop policy if exists "public_read" on paper_topics;
create policy "public_read" on paper_topics for select using (true);

drop policy if exists "own_saved" on saved_papers;
create policy "own_saved" on saved_papers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- AI cache: server-only. No policies => denied for anon/authenticated via
-- PostgREST; Prisma with the direct DB connection still works.
create table if not exists ai_cache (
  key text primary key,
  response jsonb not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table ai_cache enable row level security;
