# Page Routes

Localized routes live under `src/app/[locale]/`. With `localePrefix: "as-needed"`, Bangla has no prefix (`/plans`) and English uses `/en/plans`. Parenthesized folders are route groups: they share a layout but do not appear in the URL.

## Public marketing site: `(public)`

| URL | Purpose |
|-----|---------|
| `/` | Home: hero, opportunities, lifecycle, transparency, trust, risk disclosure, FAQ |
| `/plans` | Plan listing with filters |
| `/plans/[slug]` | Plan detail: allocation, ROI estimate, lifecycle, steward offerings, risk, documents |
| `/stewards` | Steward directory |
| `/stewards/[slug]` | Steward profile: about, opportunities, reviews |
| `/how-it-works` | Step-by-step explainer (deposit → purchase → care → sale → settlement) |
| `/about` | Mission, principles, roles, what Krishi is and isn't |
| `/faq` | FAQ accordion |

## Auth: `(auth)`

| URL | Purpose |
|-----|---------|
| `/login` | Phone + password login |
| `/register`, `/register/investor` | Join options and investor signup |
| `/verify-otp` | Signup OTP |
| `/forgot-password`, `/reset-password` | Password reset |
| `/steward/register`, `/steward/register/details`, `/steward/submitted` | Steward application |
| `/farmer/activate` | Farmer account activation |
| `/admin/login` | Localized admin login (the console also has its own `/krishi-console/login`) |

## Interest: `(interest)`

`/express-interest`, `/interest-submitted`, `/interest-received`, `/interest/[reference]`, `/interest-approved`, `/interest-not-approved`

## Investor onboarding: `(onboarding)`

`/onboarding/[reference]` (wizard hub), `/onboarding/phone`, `/onboarding/kyc`, `/onboarding/withdrawal`, `/onboarding/deposit`

## Investor portal: `(portal)` (requires login)

| URL | Purpose |
|-----|---------|
| `/portal/investments`, `/portal/investments/[id]` | Investments and detail timeline |
| `/portal/interests` | Submitted interests |
| `/portal/kyc` | KYC status / submit |
| `/portal/profile`, `/portal/settings` | Profile, password |

## Steward dashboard: `/steward` (role = steward)

`/steward` (overview), `/steward/interests`, `/steward/investments`, `/steward/investments/[id]`, `/steward/farmers`, `/steward/farmers/new`, `/steward/farmers/[id]`, `/steward/fund-requests`, `/steward/settings`

## Farmer dashboard: `/farmer` (role = farmer)

`/farmer` (assigned investments), `/farmer/investments/[id]`, `/farmer/fund-requests`, `/farmer/settings`

## Admin console: `/krishi-console` (not localized, admin only)

| URL | Purpose |
|-----|---------|
| `/krishi-console/login` | Admin login |
| `/krishi-console` | Overview |
| `/krishi-console/plans`, `/plans/new`, `/plans/[id]` | Plan management and steward offerings |
| `/krishi-console/categories` | Livestock categories |
| `/krishi-console/locations` | Divisions / districts / thanas |
| `/krishi-console/stewards`, `/stewards/[id]` | Steward approvals |
| `/krishi-console/kyc`, `/kyc/[id]` | KYC reviews |
| `/krishi-console/deposits` | Deposit approvals |
| `/krishi-console/investors`, `/investors/[id]` | Investor directory |
| `/krishi-console/farmers`, `/farmers/[id]` | Farmer directory |

The console is excluded from `proxy.ts`. Each dashboard page calls `requireAdmin()`.
