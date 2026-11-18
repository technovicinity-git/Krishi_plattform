# Krishi — Livestock Investment Platform

Krishi connects **investors** with on-the-ground **stewards** and **farmers** in Bangladesh to fund livestock rearing and fattening projects (cattle, goats, sheep, buffalo). Investors buy units in a plan, a steward runs the project, a farmer raises the animals, and every disbursement, expense and update is logged so the investor can follow their money.

The UI is bilingual: Bangla is the default, English is available under `/en`.

## Tech stack

- **Next.js 16** (App Router, Turbopack) with **React 19** and **TypeScript**
- **Tailwind CSS 4**
- **Supabase** (Postgres + Storage), accessed server-side with the service-role key
- Custom session auth (`jose` JWTs, `bcryptjs`), phone + OTP signup
- **next-intl** for Bangla / English
- **zod** for request validation

## Repository layout

```
krishi-platform-main/
├── docs/                    # Project documentation (start here)
└── web/                     # Next.js application
    ├── src/
    │   ├── app/             # Pages ([locale]/, krishi-console/) and API routes (api/)
    │   ├── components/
    │   ├── i18n/            # next-intl config
    │   ├── lib/             # Auth, Supabase clients, helpers
    │   ├── messages/        # bn.json / en.json
    │   └── proxy.ts         # Next.js 16 middleware
    ├── supabase/migrations/ # SQL migrations (applied by scripts/migrate.mjs)
    ├── scripts/             # migrate.mjs, seed-admin.mjs
    └── .env.example         # Template for web/.env.local
```

## Documentation

| Doc | What it covers |
|-----|----------------|
| [docs/README.md](docs/README.md) | Product overview, roles, glossary |
| [docs/architecture.md](docs/architecture.md) | Tech stack, request flow, auth/session model, folder structure |
| [docs/data-model.md](docs/data-model.md) | Database tables, relationships, status enums |
| [docs/workflows.md](docs/workflows.md) | End-to-end business flows (interest → deposit → investment → farming) |
| [docs/api-reference.md](docs/api-reference.md) | Every API route, its method and who may call it |
| [docs/routes.md](docs/routes.md) | Every page route grouped by audience |
| [docs/development.md](docs/development.md) | Local setup, env vars, migrations, seeding an admin |
| [docs/known-gaps.md](docs/known-gaps.md) | Missing pieces, inconsistencies and security notes found during review |

## Prerequisites

- Node.js 20+ (the scripts use `node --env-file`)
- A hosted Supabase project with the storage buckets `kyc-documents` (private), `deposit-proofs` and `plan-images`

## Quick start

```bash
cd web
npm install
cp .env.example .env.local   # then fill in the values
npm run db:migrate
npm run seed:admin -- admin@example.com "a-long-password" "Krishi Admin"
npm run dev
```

Required variables in `web/.env.local`:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |
| `SUPABASE_SECRET_KEY` | Service-role key, **server only** |
| `DATABASE_URL` | Session-pooler Postgres URL, used only by the scripts |
| `KRISHI_SESSION_SECRET` | Session signing key, 32+ characters |
| `DEV_SHOW_OTP` | Optional, dev only: set to `true` to show OTPs on screen (there is no SMS provider yet) |

Generate a session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Open http://localhost:3000 (Bangla) or http://localhost:3000/en (English). The admin console is at http://localhost:3000/krishi-console.

## Commands

Run from `web/`:

| Command | What it does |
|---------|--------------|
| `npm run dev` | Dev server at http://localhost:3000 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Apply pending SQL migrations from `web/supabase/migrations/` |
| `npm run db:status` | Show applied and pending migrations without changing anything |
| `npm run seed:admin -- <email> <password> [name]` | Create or update an admin (password 12+ characters) |

Never edit a migration that has already been applied. Add a new file instead. See [docs/development.md](docs/development.md) for details.
