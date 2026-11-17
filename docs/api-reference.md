# API Reference

All handlers live under `web/src/app/api/**/route.ts` and run on the Node.js runtime. Requests and responses are JSON unless noted. Errors look like `{ "error": "message" }` with a 4xx/5xx status.

**Auth column legend:** *Public* = no session. *Session* = any logged-in user (`krishi_session` cookie). *Investor / Steward / Farmer* = role check through `getCurrentUser()`. *Admin* = `getCurrentAdmin()`.

## Auth

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/register` | Public | Investor signup (fullName, phone, email?, password). Sets session and sends signup OTP. |
| POST | `/api/auth/verify-otp` | Session | Verify signup OTP, then user becomes `active` |
| POST | `/api/auth/login` | Public | Phone + password login (all non-admin roles) |
| POST | `/api/auth/logout` | Public | Clears session cookie |
| POST | `/api/auth/forgot-password` | Public | Send reset OTP |
| POST | `/api/auth/verify-reset-otp` | Public | Verify reset OTP |
| POST | `/api/auth/reset-password` | Public | Set new password after a verified reset OTP |
| POST | `/api/auth/steward-register` | Public | Steward signup (approval `pending`), sets session |
| POST | `/api/auth/steward-details` | Steward session | Save `steward_profiles` |
| POST | `/api/auth/farmer-activate` | Public | Farmer activation: phone + OTP + password |
| GET | `/api/dev/latest-otp?phone=` | Public, **only when `DEV_SHOW_OTP=true`** (404 otherwise) | Returns latest plaintext OTP for the phone |

## Account

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| PUT | `/api/account/profile` | Session | Update name, email, avatar |
| POST | `/api/account/change-password` | Session | Change password (verifies the current one) |

## Interests and onboarding

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/interests` | Public or Investor | Submit interest on an offering (`offering_id`, `requested_units`, `message?`, `guest_*` when not logged in) |
| GET | `/api/interests/[reference]` | Public | Look up interest status by reference |
| POST | `/api/kyc/submit` | Session | Multipart: `docType=nid`, `nidNumber`, addresses, `nidFront`, `nidBack`, `profilePhoto?` (JPG/PNG/PDF, 5 MB max) |
| POST | `/api/onboarding/withdrawal` | Session | Save withdrawal preference (mobile wallet or bank) |
| POST | `/api/deposits` | Investor | Submit a deposit against an approved interest. Interest becomes `onboarding`. |

## Steward

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/steward/interests` | Steward | Interests on own offerings |
| PATCH | `/api/steward/interests/[id]` | Steward (owner) | `{action: approve\|reject, rejection_reason?}` |
| POST | `/api/steward/farmers` | Steward | Create farmer (fullName, phone, nidNumber, presentAddress) |
| POST | `/api/steward/farmers/[id]/resend-activation` | Steward | New activation OTP |
| POST | `/api/steward/investments/[id]/assign` | Steward (owner) | `{farmer_id}`. Stage goes `awaiting_farmer` → `awaiting_purchase`. |
| PATCH | `/api/steward/fund-requests/[id]` | Steward (owner) | `{action: approve\|reject, reason?}` |

## Farmer

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/farmer/fund-requests` | Farmer (assigned) | `{investment_id, amount, purpose, note?}` |
| POST | `/api/farmer/expenses` | Farmer (assigned) | `{investment_id, amount, category, description?, receipt_path?}` |

## Admin

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/admin/auth/login` | Public (rate-limited 5/15 min per email) | Email + password admin login |
| POST | `/api/admin/auth/logout` | Session | Logout (audited) |
| POST | `/api/admin/categories` | Admin | Create livestock category |
| PATCH | `/api/admin/categories/[id]` | Admin | Update category |
| POST | `/api/admin/plans` | Admin | Create investment plan |
| PATCH / DELETE | `/api/admin/plans/[id]` | Admin | Update or delete plan |
| GET / POST | `/api/admin/plans/[id]/offerings` | Admin | List or add steward offerings on a plan |
| PATCH / DELETE | `/api/admin/offerings/[id]` | Admin | Edit offering (not below funded units) or delete (only if unfunded) |
| POST | `/api/admin/stewards/[id]/approve` · `/reject` | Admin | Steward approval |
| POST | `/api/admin/kyc/[id]/approve` · `/reject` | Admin | KYC decision |
| POST | `/api/admin/deposits/[id]/approve` | Admin | Approve deposit, create investment, increment `units_funded` |
| POST | `/api/admin/deposits/[id]/reject` | Admin | Reject deposit |
| POST | `/api/deposits/[id]/approve` | Admin | **Legacy duplicate** of the approve route above. It does *not* increment `units_funded`. See [known-gaps.md](known-gaps.md). |
