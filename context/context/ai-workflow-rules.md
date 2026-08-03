# AI Workflow Rules

## Approach

Build AnswerOS incrementally using a spec-driven workflow. Context files define what to build, how to build it, and the current state of progress. Always implement against these specs — do not infer or invent behavior from scratch. When the spec is silent on a behavior, add it as an open question in `progress-tracker.md` before implementing.

## Scoping Rules

- Work on one feature unit at a time — do not mix auth work with dashboard work in a single session
- Prefer small, verifiable increments over large speculative changes
- Do not combine unrelated system boundaries in a single implementation step (e.g., don't change the AI provider abstraction and the dashboard UI simultaneously)
- Each unit of work should be completable and verifiable within a single session

## When to Split Work

Split an implementation step if it combines:

- UI changes and background job changes — these have different verification paths
- Multiple unrelated API routes — each route has its own validation and error handling
- Behavior not clearly defined in the context files — resolve the ambiguity first
- Database migrations and business logic changes — migrate first, then implement logic

If a change cannot be verified end to end quickly, the scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context files
- If a requirement is ambiguous, resolve it in the relevant context file before implementing
- If a requirement is missing, add it as an open question in `progress-tracker.md` before continuing
- When the spec says "weighted multi-factor" but doesn't specify exact weights, refer to `lib/scoring/weights.ts` — and if that doesn't exist yet, create it with the documented weights from `answeros-spec.md`

## Protected Files

Do not modify the following unless explicitly instructed:

- `components/ui/*` — generated shadcn/ui library components (use the CLI to add new ones)
- Any third-party library internals in `node_modules/`
- `prisma/migrations/*` — auto-generated migration files (let Prisma manage these)
- Environment variable files (`.env`, `.env.local`, `.env.production`) — only add variables when integrating a new service, following the documented env var patterns

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:

- **`architecture.md`:** System boundaries, invariants, storage model decisions
- **`code-standards.md`:** New conventions or standards discovered during implementation
- **`progress-tracker.md`:** Completed work, current phase, architecture decisions
- **`ui-context.md`:** New layout patterns, component additions, design tokens
- **`answeros-spec.md`:** Feature scope changes, success criteria updates

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope
2. No invariant defined in `architecture.md` was violated
3. `progress-tracker.md` reflects the completed work with the date and a brief note
4. `npm run build` passes with no type errors or warnings
5. All new code follows the conventions in `code-standards.md`
6. Any new environment variables are documented (but values are never committed)

## Provider Integration Checklist

When adding a new AI provider to `lib/providers/`:

1. Implement the `AIProvider` interface from `lib/providers/types.ts`
2. Add the provider name to the `AIProviderName` union type
3. Add the provider to the Prisma `AIProvider` enum
4. Add the provider's API key to Vercel environment variables
5. Add the provider to the scan job's provider rotation logic
6. Ensure errors from the provider are caught and surfaced as `FAILED` scan results, not unhandled exceptions

## Database Migration Checklist

When modifying `prisma/schema.prisma`:

1. Make the schema change
2. Run `npx prisma migrate dev --name <descriptive_name>`
3. Verify the migration SQL in `prisma/migrations/`
4. Update any seed scripts if they reference changed models
5. Run `npm run build` to verify the Prisma client regenerates correctly
