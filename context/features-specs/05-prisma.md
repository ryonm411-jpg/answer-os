# Neon PostgreSQL

## Goal

Set up the AnswerOS data layer:

- Connect to Neon PostgreSQL
- Define the Prisma schema for the AnswerOS data model
- Create the cached Prisma client singleton
- Create and apply the first migration

Follow `architecture.md` (Prisma + PostgreSQL (Neon)) and the schema defined in `answeros-spec.md` (Database Schema section). Do not invent models or fields beyond the spec.

---

## Provider

Neon — serverless PostgreSQL with branching.

Environments (from `answeros-spec.md`):

- Development: local Neon dev branch
- Preview: per-PR isolated Neon branch
- Production: Neon production branch

---

## Connection Strings

Neon provides two endpoints per branch:

- Pooled endpoint — host contains `-pooler`. Used by the app at runtime.
- Direct endpoint — no `-pooler`. Used by Prisma Migrate and the CLI.

Format:

```
postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

Env variables:

- `DATABASE_URL` — pooled connection string (app runtime)
- `DIRECT_URL` — direct connection string (migrations)

Add both to `.env` (values are never committed) and to Vercel environment variables.

---

## Dependencies

Install:

- `prisma` (dev dependency)
- `@prisma/client`
- `@prisma/adapter-neon`
- `dotenv` (dev dependency, for `prisma.config.ts`)

---

## Prisma Configuration

`prisma/schema.prisma`:

- generator `client` with `provider = "prisma-client"` and an explicit `output` path (e.g. `../generated/prisma`)
- datasource provider `postgresql` — the URL is configured in `prisma.config.ts`, not the schema

`prisma.config.ts`:

- `import 'dotenv/config'`
- `defineConfig` with schema path, migrations path, `datasource.url = env("DATABASE_URL")`, and `datasource.directUrl = env("DIRECT_URL")`

Add `generated/` to `.gitignore`.

---

## Data Model

Define the models from `answeros-spec.md` (Database Schema):

| Model | Purpose | Key constraints |
| ----- | ------- | --------------- |
| User | Clerk-authenticated user | `clerkId` unique, `email` unique, 1:1 company |
| Company | The user's company and domain | `domain` unique, 1:1 user, owns competitors + scans |
| Scan | One scan run across prompts/providers | `status` enum, company relation, results |
| ScanResult | One prompt × provider outcome | mentioned, position, sentiment, reasoning, rawResponse, `competitorsMentioned` Json |
| Prompt | Curated prompt library entry | text, category, searchVolume |
| Competitor | Manual or auto-discovered competitor | company relation, `isAutoDiscovered` |
| Recommendation | Actionable improvement | priority, `estimatedImpact`, category, completed |

Enums: `ScanStatus` (PENDING, RUNNING, COMPLETED, FAILED), `AIProvider` (OPENAI, ANTHROPIC, GEMINI, PERPLEXITY), `Sentiment` (POSITIVE, NEUTRAL, NEGATIVE).

Rules:

- No extra fields beyond the spec
- Add `@@index` on relation foreign keys used in lookups (`companyId`, `scanId`, `promptId`)
- AI raw responses are stored as `Json` text fields — no blob/file storage in MVP (`code-standards.md`)
- `prisma/seed.ts` (prompt library seeding) is deferred to the prompt library spec — do not implement here

---

## Prisma Client

Create `lib/db/prisma.ts`:

- Singleton instance cached on `global` in development for hot reload
- Instantiate with `@prisma/adapter-neon` using `DATABASE_URL`
- Export a single `prisma` instance

---

## Migration

```bash
npx prisma migrate dev --name init
```

- Applies against `DIRECT_URL`
- Generates the client afterwards
- Run `npx prisma generate` after every schema change (migration checklist in `ai-workflow-rules.md`)

---

## CI

`ci.yml` already provisions a `postgres:16` service with `DATABASE_URL`. Wire it up:

- Run `npx prisma generate` before typecheck/lint/build (the generated client is imported by source code)
- Run `npx prisma migrate deploy` against the service database
- Set `DIRECT_URL` in the workflow (same value as `DATABASE_URL` for the local service)

Production: apply migrations with `prisma migrate deploy` on Vercel production deploy (deployment pipeline in `answeros-spec.md`).

---

## Future

Reserved (do not implement):

- Clerk webhook → User row sync
- Seed script for the prompt library
- Neon branching automation for Vercel preview deployments

---

## Check When Done

- schema defines all 7 models and 3 enums from `answeros-spec.md`, with correct relations and indexes
- `lib/db/prisma.ts` exports one cached Prisma instance using the Neon adapter
- first migration applies successfully against Neon
- `npx prisma generate` regenerates without errors
- `npm run build` passes
