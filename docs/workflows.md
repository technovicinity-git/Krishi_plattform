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
| Deposit | `/onboarding/deposit` | Shows active `platform_accounts`. `POST /api/deposits` (multipart) uploads the proof server-side to the private `deposit-proofs` bucket, works out the amount from the plan's unit price × units, requires an **approved** interest owned by the caller, inserts `deposits` (`pending`), and sets the interest to `onboarding`. |

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

**Sale.** While the batch is in `growing_care`, the farmer records the sale and ticks the live animals sold (dead or death-reported animals can't be chosen). Stage → `sale_pending`. The steward confirms it (→ `sold`, sale `awaiting_remittance`) or sends it back (→ `growing_care`). The steward can only confirm once every expense is reviewed; at that point the **unspent fund money** (approved care fund requests minus approved care expenses) is fixed on the sale as `funds_returned`. The farmer sends the sale money **plus** that leftover to Krishi and submits the transfer (`remittance_submitted`). The admin confirms the payment and settles; settlement credits each wallet (see `lib/investments/settlement.ts` for the 60/30/5/5 split and the loss rule).

**Animal deaths.** A farmer reports a death with a photo, cause and optional vet certificate (animal → `death_reported`). The steward confirms (→ `dead`) or rejects with a reason (→ `active`). No sale can be recorded while a report is pending.

**Total loss.** When every animal in a `growing_care` batch is dead (none reported-pending, no pending fund requests), the steward can **Close as total loss** with a note (`POST /api/steward/investments/[id]/total-loss`). This creates an `investment_sales` row with `kind = 'total_loss'`, no animals and ৳0 (stage `sale_pending`). With no unspent fund money it goes straight to `remittance_submitted`; otherwise it waits at `awaiting_remittance` for the farmer to send the leftover back first. The admin reviews it on the Sales page: **Settle as total loss** runs the normal settlement with sale amount 0 (the investor gets back the unspent capital, no shares), or **Not accepted** sends it back to the steward (closing `rejected`, stage back to `growing_care`).


**What counts as spent.** `capitalSpent()` in `lib/investments/settlement.ts`: the animal purchase (the larger of the recorded purchase cost and any animal-purchase fund requests) plus approved care expenses, up to the care money released. Fund money released but not spent is returned by the farmer with the sale money, so only real spending reduces the investor's return. New fund requests are capped by money *released* (purchase + approved/pending requests), not by expenses.


**Online payment refunds.** A paid SSLCommerz payment that can't become an investment (units sold out, held as risky, or the deposit couldn't be recorded) is refunded, never rejected: the reject API refuses online deposits. In the console, *Deposits → Online payments* lists them. **Refund via SSLCommerz** calls the gateway's refund API (payment `refund_pending` until *Check refund status* sees it refunded); **Refunded manually** records money returned another way with its transaction ID (`refunded` at once). Either way the deposit becomes `refunded`, the interest is cancelled (or reopened if the admin lets the investor pay again), the investor is notified and the action is audit-logged. Code: `lib/payments/refund.ts`, `/api/admin/payments/[id]/refund` and `/refund-status`.


**Transaction history.** Every panel has a *Transactions* page (investor `/portal/transactions`, farmer `/farmer/transactions`, steward `/steward/transactions`, admin `/krishi-console/transactions`; app: Wallet → history icon, or More). `lib/transactions/index.ts` merges deposits and online payments, refunds, fund requests released to farmers, sale money sent by farmers, wallet credits (payouts, shares, adjustments), withdrawals and Krishi's 5% share into one list. For a person, "+" is money Krishi paid or credited to them and "−" is money they paid or took out of their wallet; for the admin, "+"/"−" is cash into/out of Krishi and wallet credits are shown as internal. Filters: type, date range (Bangladesh days), and search (admin). `GET /api/transactions/export` downloads the same list as CSV; `GET /api/mobile/v1/transactions` serves the app.


**Fund requests pay the farmer through their wallet.** When a steward approves a fund request, a database trigger (`credit_fund_release`, `20261123000001_fund_release_to_wallet.sql`) credits the farmer's wallet once (`wallet_transactions.type = 'fund_release'`, linked by `fund_request_id`). The farmer withdraws it like any wallet money and an admin pays the withdrawal. In the admin's transaction history the release is internal and the cash out is the paid withdrawal. Spending rules are unchanged: approved requests count as paid out of the batch's capital, and unspent fund money goes back to Krishi with the sale money.
