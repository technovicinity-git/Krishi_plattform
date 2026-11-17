# Krishi — Product Overview

## What Krishi does

Krishi is a livestock investment platform for Bangladesh. Investors put money into **investment plans** (for example "Cow Fattening, 6 months, Sirajganj"). The money pays for animals and their care. A **steward** manages the project locally, a **farmer** raises the animals, and when the animals are sold the profit is shared.

The platform's focus is transparency: investors can see who is caring for their animals, what money was requested and spent, and stage-by-stage updates.

## Roles

| Role | Who they are | How they join | Where they work |
|------|--------------|---------------|-----------------|
| **Investor** | Funds plans | Self-registers with phone + password, verifies by OTP | `/portal/*` investor portal |
| **Steward** | Local operator who offers units on plans, approves investors, manages farmers and approves fund requests | Self-registers, submits details, then waits for **admin approval** | `/steward/*` dashboard |
| **Farmer** | Raises the animals | Account **created by a steward**; farmer activates it with an OTP and sets a password | `/farmer/*` dashboard |
| **Admin** | Krishi staff | Seeded by script (`seed:admin`) | `/krishi-console/*` admin console (no locale prefix) |

## Glossary

| Term | Meaning |
|------|---------|
| **Livestock category** | Cattle, goat, sheep, buffalo, etc. (`livestock_categories`) |
| **Breed** | A breed within a category, e.g. Sahiwal, Red Chittagong (`breeds`) |
| **Investment plan** | An admin-defined template: category, location, duration, unit price split into *animal allocation* + *care allocation*, estimated ROI range, risk text |
| **Offering** | A steward's commitment to deliver N units of a plan (`steward_plan_offerings`). Investors pick an offering, not just a plan. Tracks `units_offered` and `units_funded`. |
| **Interest** | An investor's (or guest's) request for units on an offering. Gets a reference like `KR-INT-000123`. |
| **Onboarding** | Steps an approved investor goes through: phone verify → KYC → withdrawal preference → deposit |
| **Deposit** | Money the investor sends (bank or mobile wallet) with a proof upload, reviewed by an admin |
| **Investment** | Created when an admin approves a deposit. Moves through stages (awaiting farmer → awaiting purchase → purchased → … → completed/settled). |
| **Fund request** | A farmer asks the steward for money against an investment (animal purchase, feed, medical, transport, other) |
| **Expense** | A farmer logs money actually spent, optionally with a receipt |
| **Investment update** | Timeline entry on an investment, written automatically for fund requests, approvals and expenses |
| **KYC** | Identity check using the national ID (NID) front/back and an optional photo, reviewed by an admin |
| **MFS** | Mobile Financial Service: bKash, Nagad, Rocket |
| **Thana / Upazila** | Sub-district administrative unit; location hierarchy is Division → District → Thana |

## High-level lifecycle

```
Admin creates Plan ──► Admin attaches Steward Offering (N units)
                                   │
Investor/guest browses /plans ─────┘
        │
        ▼
 Express Interest ──► Steward approves/rejects
        │ (approved)
        ▼
 Onboarding: phone OTP → KYC → withdrawal method → deposit + proof
        │
        ▼
 Admin approves deposit ──► Investment created (stage: awaiting_farmer)
        │                    offering.units_funded += units
        ▼
 Steward assigns Farmer ──► stage: awaiting_purchase
        │
        ▼
 Farmer: fund requests ⇄ Steward approves │ Farmer logs expenses
        │
        ▼
 Sale, settlement and profit sharing (presented in the UI; not yet implemented in the backend)
```

See [workflows.md](workflows.md) for each step in detail.
