# quick-landing-page

A Turborepo monorepo for spinning up multiple Astro static landing pages with shared UI components and configuration, backed by a Hono API for email sign-ups.

## Project Structure

```
quick-landing-page/
├── apps/
│   ├── api/               # Hono API service (sign-ups → Postgres)
│   ├── landing-a/          # Astro static site
│   └── landing-b/          # Astro static site
├── packages/
│   ├── ui/                 # Shared Astro components (@quick-landing-page/ui)
│   └── shared-config/      # Shared site config (@quick-landing-page/shared-config)
├── turbo.json              # Turborepo task config
├── pnpm-workspace.yaml     # pnpm workspace definition
└── package.json
```

### Apps

- **api** — Hono API service that receives sign-up form submissions and stores them in Postgres. Differentiates sign-ups by `campaign` column. Includes an interactive CLI for querying signup data.
- **landing-a** — Landing page A with sign-up form (`campaign="landing-a"`)
- **landing-b** — Landing page B with sign-up form (`campaign="landing-b"`)

### Shared Packages

These are "Just-in-Time" packages with no build step — Astro/Vite resolves the TypeScript source directly.

- **@quick-landing-page/ui** — Shared Astro components (`Button`, `SignupForm`)
- **@quick-landing-page/shared-config** — Shared site configuration defaults (title, description, lang)

## Sign-Up Architecture

```
landing-a (static) ──POST /signups──┐
landing-b (static) ──POST /signups──┤
                                     ├── api (Hono on Node.js)
Postgres ◄───────── DATABASE_URL ────┘
```

Each landing page includes a `SignupForm` component that POSTs `{ email, campaign, name? }` to the API. The API validates the payload, inserts into Postgres, and returns the result. Duplicate email+campaign combinations return a 409.

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/signups` | List all signups (optional `?campaign=` filter) |
| `POST` | `/signups` | Create a signup (`{ email, campaign, name? }`) |

### CLI

The API package includes an interactive CLI for querying signup data:

```bash
# Requires DATABASE_URL in environment
pnpm --filter api cli
```

Options: view all signups, filter by campaign, search by email, campaign stats.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (v9+)
- [PostgreSQL](https://www.postgresql.org/) (for the API service)

### Install

```bash
pnpm install
```

### Development

```bash
# Run all apps in dev mode (landing pages + API)
pnpm dev

# Run a specific app
pnpm turbo dev --filter=landing-a
pnpm turbo dev --filter=api
```

The API requires a `DATABASE_URL` environment variable. Copy `.env.example` files and fill in your local Postgres connection string:

```bash
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env with your local DATABASE_URL
```

For the landing pages, set `PUBLIC_API_URL` to point at your local API (e.g., `http://localhost:3001`).

### Build

```bash
# Build all apps
pnpm build

# Build a specific app
pnpm turbo build --filter=landing-b
```

### Preview

```bash
pnpm turbo preview --filter=landing-a
```

## Adding a New Landing Page

1. Copy an existing app:
   ```bash
   cp -r apps/landing-a apps/landing-c
   ```

2. Update `apps/landing-c/package.json`:
   - Change `name` to `landing-c`

3. Update `apps/landing-c/turbo.json`:
   - Change env var prefix to `LANDING_C_*`

4. Update the page content in `apps/landing-c/src/pages/index.astro`
   - Change the `campaign` prop on `SignupForm` to `"landing-c"`

5. Install dependencies:
   ```bash
   pnpm install
   ```

6. Verify it builds:
   ```bash
   pnpm turbo build --filter=landing-c
   ```

## Environment Variables

Each app supports per-site env vars via its `turbo.json`. The naming convention is `LANDING_<APP>_*`:

| App | Env prefix | Example |
|-----|-----------|---------|
| landing-a | `LANDING_A_*` | `LANDING_A_TITLE` |
| landing-b | `LANDING_B_*` | `LANDING_B_TITLE` |

Global env vars prefixed with `PUBLIC_*` or `LANDING_*` are declared in the root `turbo.json`.

### API-specific Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Postgres connection string |
| `PORT` | API server port (default: 3001) |

### Landing Page Variables

| Variable | Description |
|----------|-------------|
| `PUBLIC_API_URL` | Base URL of the API service (e.g., `https://api.example.com`) |

See `.env.example` files in the root and each app for available variables.

## Deployment (Railway)

This project is deployed on [Railway](https://railway.com/) as a single project with services for each app plus a Postgres database.

**Project URL:** https://railway.com/project/70505cae-8460-4945-8101-931fbae766c6

### Architecture

Since this is a **shared monorepo** (apps import from `packages/`), Railway is configured with custom build commands rather than per-service root directories. This ensures shared packages are available during the build.

| Service | Build Command | Runtime |
|---------|--------------|---------|
| api | `pnpm turbo build --filter=api` | `pnpm --filter api start` |
| landing-a | `pnpm turbo build --filter=landing-a` | Static (Caddy) |
| landing-b | `pnpm turbo build --filter=landing-b` | Static (Caddy) |

- Landing page services have `RAILPACK_SPA_OUTPUT_DIR` set to `apps/<name>/dist`
- The API service has `DATABASE_URL` wired to the Postgres add-on via `${{Postgres.DATABASE_PUBLIC_URL}}`
- Landing pages have `PUBLIC_API_URL` set to the API service's generated domain
- Each service has `watchPatterns` scoped to its own app directory + `packages/`

### Deploying Updates

From the project root, link the service you want to deploy and push:

```bash
railway service api
railway up
```

### Adding a New Service for a New Landing Page

After creating the app locally (see "Adding a New Landing Page" above):

1. Create the service:
   ```bash
   railway add --service landing-c
   ```

2. Configure it (via Railway dashboard or API):
   - **Build Command:** `pnpm turbo build --filter=landing-c`
   - **RAILPACK_SPA_OUTPUT_DIR:** `apps/landing-c/dist`
   - **PUBLIC_API_URL:** URL of the api service
   - **Watch Patterns:** `/apps/landing-c/**`, `/packages/**`

3. Deploy:
   ```bash
   railway service landing-c
   railway up
   ```

4. Generate a domain:
   ```bash
   railway domain --service landing-c
   ```
