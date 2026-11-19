# Development Guide

## Prerequisites

- Node.js 20+ (scripts use `node --env-file`)
- A Supabase project (hosted). The local Supabase CLI flow exists but is currently bypassed; see below.
- Storage buckets created in Supabase: `kyc-documents` (private), `deposit-proofs` (private), `plan-images`

## Environment variables

Create **`web/.env.local`**. The npm scripts load this file. Never commit it; `.env*` is gitignored except `.env.example`.

| Variable | Scope | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase project URL. Also whitelisted for `next/image`. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Publishable (anon) key. Not used by the app any more (all access is server-side); safe to leave unset |
| `SUPABASE_SECRET_KEY` | **Server only** | Service-role key used by `createAdminClient()`. Bypasses RLS. |
| `DATABASE_URL` | **Scripts only** | Postgres session-pooler URL for `migrate.mjs` / `seed-admin.mjs`. URL-encode special characters in the password. |
| `KRISHI_SESSION_SECRET` | **Server only** | HMAC key for session JWTs, **32+ characters**. The app throws in development if it is missing. |
| `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD` | **Server only** | SSLCommerz merchant credentials. Leave empty to hide the "Pay online" option. Sandbox accounts: https://developer.sslcommerz.com/registration/ |
| `SSLCOMMERZ_SANDBOX` | Server only | `false` for live payments; anything else uses the sandbox. |
| `APP_URL` | Server only | Public base URL for SSLCommerz callbacks (e.g. `https://krishi.com.bd`). Without it the request's host is used; the IPN can't reach `localhost`. |
| `DEV_SHOW_OTP` | Dev / staging | `true` shows OTPs on screen via `dev_otps`. Ignored in production builds unless `KRISHI_STAGING=true`. |
| `FIXED_OTP` | Dev / staging | Every one-time code is this value (development defaults to `123456`). Ignored in production builds unless `KRISHI_STAGING=true`. |
| `KRISHI_STAGING` | Staging only | `true` allows `FIXED_OTP` / `DEV_SHOW_OTP` in a production build. **Never set on the live site.** |

Generate a session secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

## Commands

Run from `web/`:

| Command | What it does |
|---------|--------------|
| `npm run dev` | Next.js dev server (Turbopack) at http://localhost:3000 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint (`eslint-config-next`) |
| `npm run db:migrate` | Apply pending SQL migrations |
| `npm run db:status` | List applied and pending migrations without applying anything |
| `yarn test` | Run the automated tests (Vitest). Database tests build a throwaway in-process Postgres (PGlite) from the migrations; the real database is never touched. |
| `npm run seed:admin -- <email> <password> [name]` | Create or update an admin (password 12+ chars) |

Root `package.json` has Supabase CLI wrappers (`db:start`, `db:push`, `db:types`, …). The team runs migrations with the custom script instead because the CLI hit a scoped-token permission bug (see `web/scripts/README.md`). Note that root `supabase/config.toml` and `web/supabase/migrations/` sit in different folders.

## Migrations

- Location: `web/supabase/migrations/YYYYMMDDHHMMSS_description.sql`
- `migrate.mjs` applies files in filename order. Each file runs in its own transaction, under a Postgres advisory lock, over TLS.
- Applied files are recorded in `_migrations` with a SHA-256 checksum. **Never edit an applied migration**: the runner will refuse to continue. Add a new file instead.
- The checksum is taken with LF line endings, so Windows (CRLF) and Unix checkouts of the same file match. Older rows recorded from a CRLF checkout are recognised and upgraded automatically.
- The scripts read `web/.env` and then `web/.env.local` (either may be missing; `.env.local` wins).
- To add one: create the file, write plain SQL, run `npm run db:migrate`.

## Conventions

- **Server-side data access** uses `createAdminClient()` (service role). Every route handler must do its own authorization: check the role through `getCurrentUser()` / `getCurrentAdmin()`, then check ownership (e.g. `offering.steward_id === user.id`).
- **Validate input** with a `zod` schema at the top of each handler and return `{ error }` with a 400 on failure.
- **Audit** admin mutations with `logAdminAction()`.
- **Bilingual content:** add keys to both `messages/bn.json` and `messages/en.json`. Reference-data tables carry `name_en` / `name_bn`.
- **Phones** are stored as E.164 via `toE164()`. Validate with `isValidBDPhone()`.
- **Next.js 16:** middleware lives in `src/proxy.ts`. Read `node_modules/next/dist/docs/` before using APIs you remember from older versions (see `web/AGENTS.md`).

## Testing locally with OTP

Set `DEV_SHOW_OTP=true`. Signup, reset and farmer-activation OTPs then appear on the OTP screen and in the server console. There is no SMS provider integration yet.
