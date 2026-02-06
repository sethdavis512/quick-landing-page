# Copilot Instructions

## Project Overview

This is a Turborepo monorepo (`pnpm` workspaces) with two Astro static landing pages and a Hono API service, all deployed to Railway.

## Tech Stack

- **Monorepo:** Turborepo + pnpm workspaces
- **Landing pages:** Astro (static output)
- **API:** Hono on Node.js, run via `tsx` (no build step)
- **Database:** PostgreSQL via `postgres` (postgres.js) — tagged template literals, no ORM
- **CLI:** `@inquirer/prompts` for interactive signup data queries
- **Deployment:** Railway (Railpack builder)

## Project Structure

```
apps/
  api/           → Hono API (sign-ups + health check + CLI)
  landing-a/     → Astro static site
  landing-b/     → Astro static site
packages/
  ui/            → Shared Astro components (Button, SignupForm)
  shared-config/ → Shared site configuration
```

## Key Patterns

### Shared packages are JIT (no build step)

Packages in `packages/` export raw TypeScript source. Astro/Vite resolves them directly. The API also uses `tsx` to run TypeScript directly — there is no compile/build step for the API.

### Database access

Use the `postgres` library with tagged template literals. This prevents SQL injection by design:

```ts
const rows = await sql`SELECT * FROM signups WHERE campaign = ${campaign}`;
```

Never use string interpolation for SQL queries.

### API structure

- `apps/api/src/index.ts` — Hono app with routes and server startup
- `apps/api/src/db.ts` — Postgres connection, schema migration (`initDb`), connection retry logic
- `apps/api/src/cli.ts` — Interactive CLI for querying signup data

The API auto-migrates the database schema on startup via `initDb()`.

### SignupForm component

`packages/ui/src/components/SignupForm.astro` accepts `campaign` and `apiUrl` props. It uses an inline `<script>` (not a framework) to handle form submission via `fetch`.

### Landing page pattern

Landing pages read `PUBLIC_API_URL` from `import.meta.env` (Astro inlines `PUBLIC_*` vars at build time for static sites) and pass it to the `SignupForm` component.

## Environment Variables

### API (`apps/api/`)
- `DATABASE_URL` — Postgres connection string (required)
- `PORT` — Server port (default: 3001)

### Landing pages
- `PUBLIC_API_URL` — Base URL of the API service

### Turbo
- `globalEnv` in root `turbo.json` includes: `LANDING_*`, `PUBLIC_*`, `DATABASE_URL`, `PORT`

## Railway Deployment Notes

- This is a **shared monorepo** — do NOT set `rootDirectory` per service. Use custom build/start commands filtered by package name.
- The API uses `${{Postgres.DATABASE_PUBLIC_URL}}` (public TCP proxy) for database connectivity, not the private internal URL.
- Landing pages are static sites served by Caddy via `RAILPACK_SPA_OUTPUT_DIR`.
- Each service has `watchPatterns` to avoid unnecessary rebuilds.

## Adding New Landing Pages

1. Copy an existing app directory
2. Update `package.json` name and `turbo.json` env prefix
3. Update the `campaign` prop on `SignupForm` in `index.astro`
4. Add a Railway service with the matching build command and `RAILPACK_SPA_OUTPUT_DIR`

## Code Style

- Prefer classic `function` declarations over arrow functions
- Use `async function` for route handlers
- No build step for the API — `tsx` runs TypeScript directly in dev and production
