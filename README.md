# Tomodachi

A Resend challenge for a contact management system.

## Prerequisites

- **Node.js** 24 or newer (`package.json` specifies `engines.node`)
- **[pnpm](https://pnpm.io/)** — the repo pins a version via `packageManager`; install pnpm and use it for installs and scripts.

## Third-party services

This application is built to run against managed cloud services rather than embedding local Postgres or file storage:

- **[Neon](https://neon.tech/)** hosts **PostgreSQL**. The database connection string is used by [Drizzle ORM](https://orm.drizzle.team/) for schema and migrations, and by the serverless Postgres client for queries. Data such as contacts, lists, and import jobs lives here.
- **Neon Auth** (integrated with Neon) backs **authentication**: `NEON_AUTH_BASE_URL` points at your Auth deployment, and `NEON_AUTH_COOKIE_SECRET` is used to sign session cookies. You provision both from your Neon Auth project dashboard.
- **[Vercel Blob](https://vercel.com/docs/storage/vercel-blob)** stores **uploaded CSV files**. Imports upload files directly to Blob via a short-lived token from the app (`BLOB_READ_WRITE_TOKEN`, which must be a token starting with `vercel_blob_rw_`). Background import workflows then read from Blob and write rows into Neon.

Secrets and placeholders are listed in [`.env.example`](./.env.example). Treat that file as a checklist—copy it to `.env` locally and never commit `.env`.

## Setup

1. Clone the repo and install dependencies:

   ```sh
   pnpm install
   ```

2. Copy the environment template and fill in values from Neon and Vercel:

   ```sh
   cp .env.example .env
   ```

   | Variable                          | Purpose                                                                                                                    |
   | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
   | `NEON_DATABASE_CONNECTION_STRING` | Postgres connection URL for Drizzle and the app (`env.ts`).                                                                |
   | `NEON_AUTH_BASE_URL`              | Base URL for your Neon Auth instance.                                                                                      |
   | `NEON_AUTH_COOKIE_SECRET`         | Secret used to sign auth cookies (e.g. 32+ random bytes).                                                                  |
   | `BLOB_READ_WRITE_TOKEN`           | Vercel Blob token with read/write scope for imports.                                                                       |
   | `WORKFLOW_LOCAL_BASE_URL`         | Optional — used when running workflows against your local HTTPS dev server; set host/port to match `pnpm dev` (see below). |

3. Apply database migrations against your Neon database (requires `NEON_DATABASE_CONNECTION_STRING`):

   ```sh
   pnpm db:migrate
   ```

## Development

Start the Next.js dev server with **HTTPS** on port **3003** (see `scripts.dev` in `package.json`):

```sh
pnpm dev
```

Your browser may show a warning for the local TLS certificate until you proceed or trust the dev certificate. If you configure `WORKFLOW_LOCAL_BASE_URL` for local workflows, align it with that URL (including `https` and port `3003`).

Other useful scripts:

| Command            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `pnpm build`       | Production build                                 |
| `pnpm start`       | Run production server (after build)              |
| `pnpm lint`        | ESLint                                           |
| `pnpm db:generate` | Generate new Drizzle migrations from `schema.ts` |

## Architect

For deeper detail on how CSV uploads reach Neon (Blob → API → workflows), see [`architecture.md`](./architecture.md).

Made with ❤️ by @SugarDarius
