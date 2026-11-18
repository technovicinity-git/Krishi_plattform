# Known Gaps and Review Notes

Found while reading the codebase on 2026-11-17. Ordered by priority.

## 🔴 Security

1. **Real credentials in `web/.env.example`.** The example file, which is meant to be committed, contains what look like a live Supabase **secret (service-role) key** and the **database password** in `DATABASE_URL`. Rotate both in the Supabase dashboard and replace them with placeholders. `web/scripts/README.md` describes the password reset steps.
2. **RLS is enabled but authorization lives only in app code.** Every query uses the service-role client, so one missing role or ownership check in a route handler exposes data. New routes need careful review.
3. **`GET /api/interests/[reference]` is public.** References are sequential (`KR-INT-000001`, `…002`), so anyone can enumerate them. Check what `getInterestByReference` returns (guest name, phone or email would be a data leak).
4. **No rate limiting on user OTP or login endpoints.** Admin login is rate-limited, but `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password` and `/api/interests` are not. OTP attempts are capped per code, but new codes can be requested without limit.
5. **`DEV_SHOW_OTP` stores plaintext OTPs** and exposes them through a public endpoint. Make sure it is never set in production.
6. **`jwt.ts` only throws for a missing or weak secret outside production.** In production it would sign with an `undefined` key. Fail hard in every environment instead.

## 🟠 Schema and data integrity

1. ~~Missing migrations~~ — fixed 2026-11-18: `20261016000001_baseline_untracked_tables.sql` creates the hand-made tables and storage buckets. A database built from all migrations was checked to match the live schema column for column.
2. **Duplicate deposit-approval routes.** `/api/deposits/[id]/approve` and `/api/admin/deposits/[id]/approve` both exist. Only the admin route increments `steward_plan_offerings.units_funded`. Delete the legacy route or make the two the same.
3. **No transactions in multi-step writes.** Deposit approval updates the deposit, the interest, the investment and the offering in separate calls. A failure partway leaves inconsistent state, e.g. a deposit marked approved with no investment. The `units_funded` increment is a read-then-write and can race. Move these into a Postgres function (RPC).
4. **No overselling guard at interest or deposit time.** Interest checks `requested_units ≤ units_offered`, not the remaining `units_offered − units_funded`. The DB CHECK constraint will reject the final increment, but only after the deposit is already approved.
5. **Legacy Supabase Auth leftovers.** The `auth.users` trigger and `is_admin()` / `current_user_role()` RLS helpers are unused. `proxy.ts` still calls `supabase.auth.getUser()` on every page request, which adds latency for no benefit.

## 🟡 Feature gaps

- **SMS delivery** for OTPs is a `TODO` everywhere.
- **Fund disbursement:** the detail code treats `disbursed` as a status, but the steward route only sets `approved`/`rejected`.
- **Admin console:** offerings default to `approved` when the admin creates them, and stewards have no self-serve way to propose offerings (`pending_approval` exists in the schema but is unused).
- **No automated tests** and no CI configuration.
- **`web/README.md`** is the default create-next-app text.
- **Housekeeping:** `all_packages.txt` at the root is a stray dump from another path. `_smoke_test` table and migration can be dropped. Both `package-lock.json` and `yarn.lock` exist in `web/`; pick one package manager. Some route files have inconsistent indentation (`api/kyc/submit`).
