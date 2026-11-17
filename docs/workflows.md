# Business Workflows

Each flow lists the UI pages, the API calls and the state changes in order.

---

## 1. Investor registration

| Step | UI | API | Effect |
|------|----|-----|--------|
| Register | `/register` (or `/register/investor`) | `POST /api/auth/register` | `users` row created: `role=investor`, `status=pending_activation`. Signup OTP stored. Session cookie set immediately. |
| Verify phone | `/verify-otp` | `POST /api/auth/verify-otp` | OTP checked (max 5 attempts, 5-min TTL). User becomes `status=active` with `phone_verified_at` set. |
| Login | `/login` | `POST /api/auth/login` | Phone + password. Returns `role` so the client can redirect to the right dashboard. Suspended or deleted users get 403. |
| Forgot password | `/forgot-password` → `/reset-password` | `POST /api/auth/forgot-password`, `/verify-reset-otp`, `/reset-password` | OTP with `purpose=reset`. |

Phone numbers are normalized to E.164 (`+880…`) by `lib/auth/phone.ts`.

## 2. Steward onboarding

1. `/steward/register` → `POST /api/auth/steward-register`: creates `role=steward`, `status=active`, `steward_approval_status=pending`, and logs the steward in.
2. `/steward/register/details` → `POST /api/auth/steward-details`: writes `steward_profiles` (type, division/district/upazila, categories, experience).
3. `/steward/submitted`: waiting screen.
4. Admin reviews at `/krishi-console/stewards/[id]` → `POST /api/admin/stewards/[id]/approve` or `/reject` sets `steward_approval_status`.

## 3. Plan and offering setup (admin)

1. Admin creates a plan at `/krishi-console/plans/new` → `POST /api/admin/plans`. Includes category, location, duration, unit price split, ROI range, risk text and image (uploaded to `plan-images`).
2. On the plan page the admin attaches **steward offerings** → `POST /api/admin/plans/[id]/offerings` (`steward_id`, `units_offered`, default status `approved`).
3. Offerings can be edited or removed via `PATCH/DELETE /api/admin/offerings/[id]`. `units_offered` cannot go below `units_funded`, and an offering with funded units cannot be deleted.
4. The plan's `status` (`draft`/`open`/`coming_soon`/…) controls public visibility. Interest is only accepted when the plan is `open` or `coming_soon` **and** the offering is `approved`.

## 4. Expressing interest

- Public plan detail `/plans/[slug]` lists offerings by steward. The investor picks one and goes to `/express-interest`.
- `POST /api/interests` → `lib/public/interests.ts#submitInterest`:
  - Validates the offering and plan status, and that requested units ≤ `units_offered`.
  - **Logged-in investor:** must be an `active` investor.
  - **Guest:** name and phone required. Rejected if an account already exists for that phone.
  - Rejects duplicates if an active interest already exists for the same offering and identity.
  - Inserts `investment_interests` (`status=submitted`) plus `agreement_acceptances`.
- Status pages: `/interest-submitted`, `/interest-received`, `/interest/[reference]` (public lookup by reference via `GET /api/interests/[reference]`), `/interest-approved`, `/interest-not-approved`.

## 5. Steward reviews interest

- `/steward/interests` (`GET /api/steward/interests`) lists interests on the steward's offerings.
- `PATCH /api/steward/interests/[id]` with `{action: "approve" | "reject", rejection_reason?}`. Ownership is checked through `offering.steward_id`. Only `submitted`/`under_review` interests can change.
- Approval **does not reserve units**. Units are counted only when the deposit is approved.

## 6. Investor onboarding and deposit

Wizard at `/onboarding/[reference]`, with steps in `components/onboarding/*`:

| Step | Page / component | API |
|------|------------------|-----|
| Phone verification | `/onboarding/phone` | OTP routes |
| KYC | `/onboarding/kyc` | `POST /api/kyc/submit`: multipart upload of NID front/back (+ optional photo) to `kyc-documents`; `kyc_profiles.status` → `pending` |
| Withdrawal method | `/onboarding/withdrawal` | `POST /api/onboarding/withdrawal`: upserts `withdrawal_preferences` |
| Deposit | `/onboarding/deposit` | Shows active `platform_accounts`. Proof uploaded to `deposit-proofs`. `POST /api/deposits` requires an **approved** interest owned by the caller, inserts `deposits` (`pending`), and sets the interest to `onboarding`. |

Bank deposits require `txn_id`. MFS deposits require `sender_number`.

## 7. Admin approvals

- **KYC:** `/krishi-console/kyc/[id]` shows documents via signed URLs. `POST /api/admin/kyc/[id]/approve|reject` sets `verified` or `rejected` with a reason.
- **Deposit:** `/krishi-console/deposits` → `POST /api/admin/deposits/[id]/approve`:
  1. deposit → `approved`
  2. interest → `converted`
  3. `investments` row created (`status=active`, `units`, `amount`)
  4. `steward_plan_offerings.units_funded += requested_units`
  5. audit log entry
- Rejection: `POST /api/admin/deposits/[id]/reject`.

## 8. Running the investment

| Actor | Action | API | Effect |
|-------|--------|-----|--------|
| Steward | Create farmer | `/steward/farmers/new` → `POST /api/steward/farmers` | Farmer `users` row (`pending_activation`, `assigned_steward_id` = steward), draft `kyc_profiles` (NID, address), activation OTP |
| Steward | Resend activation | `POST /api/steward/farmers/[id]/resend-activation` | New OTP |
| Farmer | Activate | `/farmer/activate` → `POST /api/auth/farmer-activate` | Phone + OTP + new password. Status → `active`, logged in. |
| Steward | Assign farmer to investment | `POST /api/steward/investments/[id]/assign` | Only from stage `awaiting_farmer`, and only with the steward's own farmers. Stage → `awaiting_purchase`. |
| Farmer | Request funds | `POST /api/farmer/fund-requests` | `fund_requests` (`pending`) + timeline update |
| Steward | Approve/reject funds | `PATCH /api/steward/fund-requests/[id]` | Status + timeline update (`fund_disbursed` or `note`) |
| Farmer | Log expense | `POST /api/farmer/expenses` | `expenses` (`pending`) + timeline update with receipt photo |

All three roles see the same investment detail, assembled by `lib/investments/detail.ts`: stats, stage timeline, fund requests, updates and approved expenses. Pages: `/portal/investments/[id]`, `/steward/investments/[id]`, `/farmer/investments/[id]`.

## 9. Sale, settlement and profit sharing

The marketing pages (`how-it-works`: `StepSale`, `Settlement`, `ProfitSharing`) describe the sale and the profit split. The UI knows the stages `purchased`, `completed` and `settled`. **No API moves an investment past `awaiting_purchase`, records a sale, or pays out to `withdrawal_preferences`.** This part of the lifecycle has not been built yet.
