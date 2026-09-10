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

alter table saved_papers enable row level security;

drop policy if exists "own_saved" on saved_papers;
create policy "own_saved" on saved_papers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
