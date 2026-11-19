# Known Gaps and Review Notes

Found while reading the codebase on 2026-11-17. Ordered by priority.

## 🔴 Security

1. ~~Real credentials in `web/.env.example`~~ — checked 2026-11-18: the file and the whole git history contain no keys, database URLs or session secrets.
2. **Authorization lives in app code.** Every query uses the service-role client, so one missing role or ownership check in a route handler exposes data through that route. New routes need careful review. (The database itself is closed to direct public access since 2026-11-19; see architecture.md.)
3. ~~`GET /api/interests/[reference]` is public~~ — fixed 2026-11-18: it now answers only the investor who owns the interest, and the shared lookup no longer returns guest name, phone or message.
4. ~~No rate limiting on user OTP or login endpoints~~ — fixed 2026-11-18: `hit_rate_limit()` + `web/src/lib/security/rate-limit.ts` limit login, sign-up, forgot/reset password, code verification, farmer activation, steward sign-up and interest submission per IP (and per phone for login/sign-up). Behind a proxy, make sure it sets `X-Forwarded-For`.
5. ~~`DEV_SHOW_OTP` / `FIXED_OTP` could run in production~~ — fixed 2026-11-18: both are ignored in production builds unless `KRISHI_STAGING=true` (`web/src/lib/auth/dev-flags.ts`), with a logged warning.
6. ~~`jwt.ts` signs with an `undefined` key in production~~ — fixed 2026-11-18: signing and verifying refuse to run without a 32+ character `KRISHI_SESSION_SECRET` in every environment.

## 🟠 Schema and data integrity

1. ~~Missing migrations~~ — fixed 2026-11-18: `20261016000001_baseline_untracked_tables.sql` creates the hand-made tables and storage buckets. A database built from all migrations was checked to match the live schema column for column.
2. ~~Duplicate deposit-approval routes~~ — fixed 2026-11-18: the legacy `/api/deposits/[id]/approve` is deleted; admin approval and online payments share `approveDeposit()`. Previously: `/api/deposits/[id]/approve` and `/api/admin/deposits/[id]/approve` both exist. Only the admin route increments `steward_plan_offerings.units_funded`. Delete the legacy route or make the two the same.
3. **Deposit approval is several calls, not one transaction.** `lib/deposits/approve.ts` claims the deposit, reserves units with a compare-and-set on `units_funded` (no race), creates the investment and undoes the earlier steps if a later one fails. A crash between steps could still leave a half-done approval; a single Postgres function would remove that window.
4. ~~No overselling guard at interest or deposit time~~ — fixed 2026-11-19: interests, manual deposits and online payments all check units *left* (`units_offered − units_funded`).
5. ~~Legacy Supabase Auth leftovers~~ — fixed 2026-11-19: `proxy.ts` no longer calls Supabase Auth, the unused browser/cookie Supabase clients and `@supabase/ssr` are gone, and the old RLS policies were dropped. The `is_admin()` / `current_user_role()` helpers remain but nobody can execute them.

## 🟡 Feature gaps

- **SMS delivery** for OTPs is a `TODO` everywhere.
- **Online payment refunds** are manual: if a paid SSLCommerz deposit can't be approved (units sold out), an admin must refund it from the SSLCommerz merchant panel and reject the deposit.
- **Fund disbursement:** the detail code treats `disbursed` as a status, but the steward route only sets `approved`/`rejected`.
- **Admin console:** offerings default to `approved` when the admin creates them, and stewards have no self-serve way to propose offerings (`pending_approval` exists in the schema but is unused).
- **Automated tests** cover the money rules only (`yarn test`: settlement maths, settlement/wallet/withdrawal SQL functions on a PGlite copy of the migrations, rate limits, session key and OTP safety switches). No route/UI tests and no CI yet.
- **PDF text in Bangla can't be copied or searched.** Statements render Bangla correctly (pdfkit shapes it with the bundled Noto fonts), but text copied out of the PDF comes out scrambled. Printing and reading are unaffected.
- **`web/README.md`** is the default create-next-app text.
- **Housekeeping:** `all_packages.txt` at the root is a stray dump from another path. `_smoke_test` table and migration can be dropped. Some route files have inconsistent indentation (`api/kyc/submit`).
