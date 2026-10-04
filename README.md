# Emergent

Discovering emerging trends — search papers, researchers, institutions and topics via OpenAlex.

Live: https://emergent-kohl.vercel.app

## Setup

```bash
cp .env.example .env.local   # fill in Supabase + OpenAlex keys
npm install
npx prisma migrate dev
npm run dev                  # http://localhost:3000
```

## Scripts

| Command                 | Purpose                         |
| ----------------------- | ------------------------------- |
| `npm run dev`           | Local dev server                |
| `npm run build`         | `prisma generate && next build` |
| `npm test`              | Vitest unit tests               |
| `npm run test:coverage` | Tests with v8 coverage gates    |
| `npm run lint`          | Next.js ESLint                  |
| `npm run format`        | Prettier write                  |

## Checks

- Pre-commit (Husky): env-file guard → secret scan → lint-staged → `tsc` → tests + coverage → `prisma validate`
- Pre-push: full secret scan
- CI (`.github/workflows/ci.yml`): format, types, lint, tests, build

## Docs

- `docs/openapi.yaml` — API spec
- `prisma/schema.prisma` — ORM models (source of truth; `supabase/schema.sql` mirrors RLS)
