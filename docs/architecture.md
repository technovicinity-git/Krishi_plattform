# Architecture

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | **Next.js 16.3** (App Router, Turbopack), React 19.2, TypeScript 5 |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`), small in-house UI kit in `src/components/ui` |
| i18n | `next-intl` 4. Locales `bn` (default) and `en`, `localePrefix: "as-needed"`, browser detection off |
| Database | **Supabase Postgres** |
| File storage | Supabase Storage buckets: `kyc-documents` (private), `deposit-proofs` (private), `plan-images` |
| Auth | **Custom**: phone/email + bcrypt password, 6-digit OTP, HS256 JWT in an httpOnly cookie (`jose`) |
| Validation | `zod` v4 in every API route |
| Migrations | Plain SQL files run by a custom Node runner (`web/scripts/migrate.mjs`, uses `postgres`) |

> **Note:** `web/AGENTS.md` warns that this Next.js version has breaking changes from earlier versions. For example, middleware is now `src/proxy.ts`. Check `node_modules/next/dist/docs/` before relying on older Next.js conventions.

## Folder structure (`web/`)

```
web/
├── scripts/
│   ├── migrate.mjs          # Applies supabase/migrations/*.sql, tracks them in _migrations with checksums
│   └── seed-admin.mjs       # Creates/updates an admin user
├── supabase/migrations/     # Timestamped SQL migrations (source of truth for schema)
├── public/images/           # Marketing and plan imagery
└── src/
    ├── proxy.ts             # Next 16 "middleware": next-intl routing + Supabase cookie refresh
    ├── i18n/                # routing.ts, request.ts, navigation.ts
    ├── messages/            # bn.json, en.json (~1,640 keys each)
    ├── app/
    │   ├── [locale]/        # All localized UI
    │   │   ├── (public)/    # Marketing site: home, plans, stewards, about, how-it-works, faq
    │   │   ├── (auth)/      # Login, register, OTP, password reset, steward signup, farmer activation, admin login
    │   │   ├── (interest)/  # Express-interest flow and status pages
    │   │   ├── (onboarding)/# Investor onboarding wizard (phone, KYC, withdrawal, deposit)
    │   │   ├── (portal)/    # Investor portal
    │   │   ├── steward/     # Steward dashboard
    │   │   └── farmer/      # Farmer dashboard
    │   ├── krishi-console/  # Admin console (NOT localized, excluded from proxy)
    │   └── api/             # Route handlers (JSON APIs)
    ├── components/          # Feature folders: home, plans, plan-detail, stewards, auth, onboarding,
    │                        # investment, steward, farmer, admin, portal, layout, ui, icons …
    └── lib/
        ├── auth/            # jwt, session, current-user, otp, password, phone, schemas, menu-items
        ├── admin/           # current-admin guard, audit log, storage signed URLs, plan helpers, image upload
        ├── supabase/        # admin (service role), server, client
        ├── public/          # Read models for public pages: plans, stewards, interests
        ├── investments/     # Investment detail aggregation (fund requests, updates, expenses)
        └── images/          # Client-side image compression
```

## Request flow

```
Browser
  │
  ├─ Page request ──► proxy.ts (next-intl locale routing + supabase.auth.getUser())
  │                      │   matcher excludes /api, /_next, /krishi-console, static files
  │                      ▼
  │                  Server Component layout ──► getCurrentUser() ──► role guard / redirect
  │                      ▼
  │                  Server Component page ──► createAdminClient() queries Supabase directly
  │
  └─ fetch('/api/...') ──► Route handler (runtime = "nodejs")
                              ├─ zod schema parse
                              ├─ getCurrentUser() / getCurrentAdmin() role check
                              ├─ createAdminClient() (service role) reads/writes
                              └─ logAdminAction() for admin mutations
```

Most data access runs on the server with the **Supabase service-role client** (`lib/supabase/admin.ts`). That client **bypasses Row Level Security**. RLS is enabled on every table but has almost no policies for app tables. Authorization is enforced **in application code**: layout guards plus explicit role and ownership checks in each route handler.

## Authentication and sessions

Krishi does **not** use Supabase Auth for users. Early migrations wired `public.users` to `auth.users`, but `20261009000001/2_custom_auth*.sql` removed that link.

| Piece | Implementation |
|-------|----------------|
| Identity | `public.users` row with `role`, `phone` (E.164, unique), `email` (unique), `password_hash` (bcrypt), `status` |
| Passwords | `lib/auth/password.ts` (bcryptjs). Users: min 8 chars with a letter and a digit. Admins: min 12 chars (seed script). |
| OTP | `lib/auth/otp.ts`: 6 digits from `crypto.getRandomValues`, bcrypt-hashed (cost 8), 5-minute TTL, max 5 attempts. Stored in `otp_codes` with purpose `signup`, `login` or `reset`. |
| SMS | **Not implemented** (`TODO`). In development, `DEV_SHOW_OTP=true` writes plaintext OTPs to `dev_otps`, which the OTP screen reads via `/api/dev/latest-otp`. |
| Session | `lib/auth/jwt.ts` signs `{ sub: userId, role }` with HS256 and `KRISHI_SESSION_SECRET` (32+ chars), 7-day expiry. `lib/auth/session.ts` stores it in the `krishi_session` cookie (httpOnly, `sameSite=lax`, `secure` in prod). |
| Current user | `getCurrentUser()` verifies the cookie, loads the `users` row and joins `kyc_profiles.status`. |
| Admin | `requireAdmin()` (redirects to `/krishi-console/login`) for pages; `getCurrentAdmin()` (returns null → 401) for APIs. Admin login has rate limiting: 5 failures per email in 15 minutes, tracked in `admin_login_attempts`. |
| Audit | `logAdminAction()` writes to `admin_audit_log` (action, target, metadata, IP, user agent). It never throws. |

`proxy.ts` still calls `supabase.auth.getUser()` on every page request. This is leftover from the Supabase Auth setup and does nothing for the custom session.

## Internationalization

- `src/i18n/routing.ts`: `locales: ["bn","en"]`, `defaultLocale: "bn"`, `localePrefix: "as-needed"`. Bangla URLs have no prefix (`/plans`); English uses `/en/plans`.
- Messages live in `src/messages/{bn,en}.json`. Pages use `getTranslations` / `useTranslations`.
- Reference data (categories, divisions, districts, thanas, breeds, plans) stores both `name_en` and `name_bn` columns.
- The admin console and dashboard menus (`lib/auth/menu-items.ts`) are English-only.

## Storage

| Bucket | Used for | Access |
|--------|----------|--------|
| `kyc-documents` | NID front/back and profile photos (`/api/kyc/submit`). JPG/PNG/PDF, 5 MB max | Private; admins view via signed URLs (`lib/admin/storage.ts`) |
| `deposit-proofs` (private) | Deposit proofs, expense receipts, update and sale photos, remittance proofs | Uploaded only by the server (`web/src/lib/storage/private-files.ts`); shown through 1-hour signed URLs |
| `plan-images` | Plan hero images uploaded in the admin plan form | Served through `next/image` (`next.config.ts` allows the Supabase storage host) |

Images are compressed on the client (`lib/images/compress.ts`) before upload.
