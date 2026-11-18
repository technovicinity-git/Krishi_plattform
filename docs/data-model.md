# Data Model

The schema is defined by the SQL files in `web/supabase/migrations/` (20 migrations, applied in filename order). All tables live in `public`. Every table has RLS **enabled**, and the app accesses them through the service role (see [architecture.md](architecture.md)).

> ⚠️ Several tables the code depends on (`investments`, `deposits`, `fund_requests`, `expenses`, `investment_updates`, `platform_accounts`) **have no migration in this repo**. They were probably created by hand in the Supabase dashboard. Their columns below are **inferred from code**. See [known-gaps.md](known-gaps.md).

## Entity relationships

```
divisions 1─* districts 1─* thanas
livestock_categories 1─* breeds

users (role: investor | steward | farmer | admin)
 ├─1:1─ kyc_profiles
 ├─1:1─ withdrawal_preferences
 ├─1:1─ steward_profiles            (stewards)
 ├─ assigned_steward_id ─► users    (farmer → steward)
 └─ created_by ─► users

investment_plans ─► livestock_categories, divisions, districts
 └─1─* steward_plan_offerings ─► users(steward), thanas
          └─1─* investment_interests ─► users(investor) | guest_* fields
                    ├─1─* agreement_acceptances
                    ├─1─* deposits*          ─► users(investor)
                    └─1─1 investments*       ─► users(investor), users(farmer), offering
                              ├─1─* fund_requests*      ─► users(farmer)
                              ├─1─* expenses*           ─► users(farmer)
                              └─1─* investment_updates* ─► users(author)

platform_accounts*          (Krishi's receiving bank/MFS accounts shown on the deposit step)
otp_codes, dev_otps         (keyed by phone)
admin_audit_log, admin_login_attempts
_migrations, _smoke_test    (tooling)

* = no migration in repo
```

## Tables

### Identity and compliance

**`users`**: one row per person, all roles.

| Column | Notes |
|--------|-------|
| `id` uuid PK | `gen_random_uuid()` (no longer linked to `auth.users`) |
| `role` | `investor` \| `steward` \| `farmer` \| `admin` |
| `full_name`, `phone` (unique, E.164), `email` (unique) | |
| `password_hash` | bcrypt |
| `status` | `pending_activation` \| `active` \| `suspended` \| `deleted` |
| `phone_verified_at` | Set after signup OTP |
| `steward_approval_status` | `pending` \| `approved` \| `rejected` (stewards only) |
| `created_by`, `assigned_steward_id` | Farmers: the steward who created and manages them |
| `avatar_path` | Storage path |

**`kyc_profiles`**: one per user. `status`: `not_started` → `pending` → `under_review` → `verified` \| `rejected` \| `requires_update`. Stores `nid_number`, present/permanent addresses, `nid_front_path`, `nid_back_path`, `profile_photo_path` (the older `*_url` columns are superseded), `submitted_by`, `reviewed_by`, `reviewed_at`, `rejection_reason`.

**`withdrawal_preferences`**: one per user, where payouts go. `method` is `mobile` (requires `mfs_provider` ∈ bkash/nagad/rocket and `mobile_number`) or `bank` (requires `bank_name` and `bank_account_number`; branch and routing number are optional). A CHECK constraint enforces this.

**`steward_profiles`**: `steward_type` (`individual`/`organization`), `division_id`, `district_id`, `upazila`, `categories text[]`, `experience`.

**`agreement_acceptances`**: legal acceptances tied to a user and/or interest. `document_type` ∈ `terms_of_investment`, `risk_disclosure`, `privacy_policy`, `interest_acknowledgement`. Also stores `document_version` and `ip_address`.

### Reference data (seeded by migrations)

| Table | Content |
|-------|---------|
| `livestock_categories` | `slug`, `name_en`, `name_bn`, `icon`, `sort_order`, `is_active`. Admin-editable in the console. |
| `breeds` | Per category |
| `divisions` → `districts` → `thanas` | Bangladesh administrative hierarchy, bilingual names |

### Investment domain

**`investment_plans`**: the product template.

| Column | Notes |
|--------|-------|
| `slug` unique, `name_en/bn`, `description_en/bn` | |
| `category_id`, `division_id`, `district_id` | FK, `on delete restrict` |
| `duration_months` | 1–60 |
| `unit_price` = `animal_allocation` + `care_allocation` | CHECK constraint enforces the sum |
| `estimated_roi_min` ≤ `estimated_roi_max` | Percent |
| `risk_information`, `image_path` | |
| `status` | `draft` \| `open` \| `coming_soon` \| `fully_funded` \| `closed` |
| `created_by` | Admin |

(`steward_id`, `total_units` and `units_funded` were moved to offerings by `20261014000004_investment_plans_refactor.sql`.)

**`steward_plan_offerings`**: a steward's capacity on a plan. Unique on `(plan_id, steward_id)`.

| Column | Notes |
|--------|-------|
| `units_offered` > 0, `units_funded` ≤ `units_offered` | |
| `thana_id` | Optional finer location |
| `status` | `pending_approval` \| `approved` \| `paused` \| `closed` \| `rejected` |
| `approved_by`, `approved_at`, `rejection_reason` | |

**`investment_interests`**: a request for units.

| Column | Notes |
|--------|-------|
| `reference` | `KR-INT-000001`, from a sequence |
| `offering_id`, `requested_units` | |
| `investor_id` **or** `guest_name/guest_phone/guest_email` | CHECK requires exactly one identity |
| `status` | `submitted` → `under_review` → `approved` \| `not_approved` → `onboarding` → `converted` (also `expired`, `cancelled`) |
| `reviewed_by`, `reviewed_at`, `rejection_reason` | Set by the steward |

Partial unique indexes allow only one *active* interest (`submitted`, `under_review`, `approved`, `onboarding`) per investor or guest phone per offering.

**`investment_sales`** (`20261118000001_sales_and_settlements.sql`): one per investment. The farmer records the sale (`animals_sold`, `sale_amount`, `sale_date`, buyer, photo); the steward confirms it; the farmer then reports sending the money to Krishi (`remit_method` bank/mfs/cash, `remit_txn_id`, `remit_proof_path`).

| `status` | Meaning | Investment stage |
|----------|---------|------------------|
| `pending_review` | Waiting for the steward | `sale_pending` |
| `rejected` | Steward sent it back; farmer can record again (same row) | `growing_care` |
| `awaiting_remittance` | Confirmed; farmer must send the money (admin can send a payment back here with `remit_rejection_reason`) | `sold` |
| `remittance_submitted` | Admin to check the payment | `sold` |
| `settled` | Admin confirmed the money and settled | `settled` (investment `status` = `completed`) |

**`investment_settlements`**: one per investment, written by `settle_investment_sale()` together with the sale and investment updates. Stores `capital`, `funds_released` (approved fund requests), `sale_amount`, `total_return` (= sale + unspent capital), `net_result`, `outcome` (profit/loss/break_even) and the payouts. On a profit the net is split 60% farmer / 30% investor / 5% steward / 5% Krishi and the investor also gets the capital back; on a loss nobody takes a share and the investor receives the whole total return. The rule lives in `web/src/lib/investments/settlement.ts`.

**`wallet_transactions`** (`20261118000002_wallets_and_withdrawals.sql`): every money movement for a user; positive = in, negative = out, balance = sum. Types: `settlement_payout` (investor), `settlement_share` (farmer/steward), `withdrawal` (held when requested), `withdrawal_reversal` (rejected/cancelled), `adjustment`. Unique indexes stop a settlement being credited twice or a withdrawal reversed twice. `settle_investment_sale()` calls `credit_settlement()` so wallets are credited in the same transaction.

**`withdrawal_requests`**: `KR-WD-000001`. Copies the user's `withdrawal_preferences` at request time. `status`: `pending` → `paid` (admin records `payout_txn_id`) | `rejected` (admin, with reason) | `cancelled` (user). Created by `request_withdrawal()`, which locks per user, checks the minimum (`WITHDRAWAL_MIN` in `web/src/lib/wallet/config.ts`) and the balance, and holds the amount. Closed by `close_withdrawal()`, which returns the money unless paid.

### Tables without migrations (inferred from code)

| Table | Key columns used in code | Statuses / stages seen |
|-------|--------------------------|------------------------|
| `deposits` | `id`, `reference`, `investor_id`, `interest_id`, `amount`, `method` (`bank`/`mfs`), `txn_id`, `sender_number`, `deposit_date`, `note`, `proof_path`, `status`, `reviewed_by`, `reviewed_at` | `pending` → `approved` \| rejected |
| `investments` | `id`, `reference`, `interest_id`, `investor_id`, `offering_id`, `farmer_id`, `units`, `amount`, `status`, `current_stage`, `created_at` | status `active`; stages `awaiting_farmer` → `awaiting_purchase` → `purchased` → … `completed` / `settled` |
| `fund_requests` | `id`, `reference`, `investment_id`, `farmer_id`, `amount`, `purpose`, `status`, `rejection_reason`, `reviewed_by`, `reviewed_at` | purpose: `animal_purchase`, `feed`, `medical`, `transport`, `other`; status `pending` → `approved`/`rejected` (detail code also expects `disbursed`) |
| `expenses` | `investment_id`, `farmer_id`, `amount`, `category`, `description`, `receipt_path`, `status` | `pending` → `approved` |
| `investment_updates` | `investment_id`, `author_id`, `author_role`, `update_type`, `title`, `body`, `amount`, `photo_path` | types: `fund_request`, `fund_disbursed`, `expense`, `note` |
| `platform_accounts` | `is_active` and display fields | Krishi's receiving accounts |

### Auth and ops

| Table | Purpose |
|-------|---------|
| `otp_codes` | `phone`, `code_hash`, `purpose` (signup/login/reset), `expires_at`, `attempts`, `consumed_at`, `verified_at`. `cleanup_expired_otps()` deletes rows older than 24h (not scheduled). |
| `dev_otps` | Plaintext OTPs, written only when `DEV_SHOW_OTP=true` |
| `admin_login_attempts` | Rate-limit source. `cleanup_old_login_attempts()` deletes rows older than 24h. |
| `admin_audit_log` | Append-only admin action log |
| `_migrations` | Filename + SHA-256 checksum of applied migrations |

## Database functions and triggers

- `touch_updated_at()`: BEFORE UPDATE trigger on most tables.
- `generate_interest_reference()`: default for `investment_interests.reference`.
- `current_user_role()`, `current_user_status()`, `is_admin()`, `handle_new_auth_user()`: from the original Supabase Auth design. They depend on `auth.uid()` and are no longer used by the custom-auth app.
