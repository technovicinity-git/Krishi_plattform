# Krishi mobile app

One Flutter app (Android and iOS) for **investors, stewards and farmers**. After
sign-in it shows the home, tabs and actions for the person's role. Bangla and
English, phone-first, with a side rail on tablets.

- App name: **Krishi** · Package / bundle ID: **com.krishi.app**
- Talks to the Next.js backend in `../web` (same database, same rules)

## What it does

| | Investor | Farmer | Steward |
|---|---|---|---|
| Account | Sign up + phone verification, forgot password, profile, change password | Activate with the code from the steward, forgot password, profile | Sign up, details form, waits for Krishi's approval; profile |
| Home | Invested, batches, wallet, returns; reminders for KYC and payment | Batches, pending requests, purchase / money-to-send reminders | Items waiting for a decision, batches, wallet |
| Plans | Browse (also before signing in), filter, plan detail with reviews, send interest | — | My plans (units, interests, batches) |
| Getting started | My interests → identity (NID upload) → payout account → pay online (SSLCommerz) or report a bank/bKash transfer → Krishi checks → batch | — | Review interests (approve / decline), add farmers, resend activation codes, assign a farmer to a batch |
| Batches | Detail, sale & settlement, animals, timeline, PDF statement, rate the steward when settled | Confirm purchase, request funds, log expenses (receipt photo), record sale, send money to Krishi, post updates | Confirm/reject sales, fund requests, expenses; close as total loss |
| Animals | View | Weight/health records with photos, report a death (photo + cause + vet certificate) | Records, confirm/reject death reports |
| Approvals | — | — | One list: interests, death reports, sales, fund requests, expenses |
| Wallet | Balance, transactions, withdraw, cancel, payout account, PDF statement | same | same |
| Notifications | List, mark read, opens the related batch / interest / payment; count refreshes when the app comes back to the front | same | same |

Not in the app yet: push notifications (needs a Firebase project and Apple push
key), and admin work (the Krishi console stays on the website).

## Run it

Requirements: Flutter 3.44+ (Dart 3.12+). Android Studio / Android SDK for
Android; **a Mac with Xcode for iOS** (iOS can't be built on Windows).

```bash
cd mobile
flutter pub get
flutter run                                                      # uses the deployed site
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000      # Android emulator → local dev server
flutter run --dart-define=API_BASE_URL=http://192.168.0.10:3000  # real phone → your PC's LAN IP
```

For a real phone on the same Wi-Fi, start the web app so it listens on the
network: `yarn dev -H 0.0.0.0` (in `web/`), and use the PC's IP above.

Settings (all `--dart-define`):

| Name | Default | |
|---|---|---|
| `API_BASE_URL` | `https://krishi-plattform.vercel.app` | Backend the app calls |
| `WEB_BASE_URL` | same as `API_BASE_URL` | Website the app opens for payment, KYC, sign-up |

Release builds must use **https**; plain http is only allowed in debug builds
(Android `debug/AndroidManifest.xml`, iOS local networking).

```bash
flutter build apk --release        # installable APK for testing on a phone
flutter build appbundle --release  # Play Store
flutter build ipa --release        # on a Mac
```

Before publishing: add a release signing key (`android/app/build.gradle.kts`
still signs release with the debug key), app icons, and the Apple team in Xcode.

## How it talks to the backend

- **Sign-in:** the app sends `X-Krishi-Client: mobile`, so login, sign-up and
  farmer activation return a session token (30 days) instead of a cookie
  (`signedInResponse()` in `web/src/lib/auth/session.ts`). It is kept in the Keychain / Keystore
  (`flutter_secure_storage`) and sent as `Authorization: Bearer <token>`. The
  server accepts it everywhere the website's cookie works. Admins can't sign in
  to the app.
- **Reading:** `GET /api/mobile/v1/*` (`me`, `dashboard`, `plans`, `plans/[id]`,
  `interests`, `onboarding/[reference]`, `investments`, `investments/[id]`,
  `livestock`, `wallet`, `notifications`, `locations`, `steward/pending`,
  `steward/farmers`, `steward/plans`). `plans` and `locations` are public.
  Text the server writes (timeline, notifications) comes in the app's
  language via `Accept-Language`.
- **Actions:** the same APIs as the website (`/api/farmer/*`, `/api/steward/*`,
  `/api/animals/*`, `/api/wallet/*`, …), so every rule is enforced in one place.

## Code map

```
lib/
  main.dart, app.dart        start-up, routes (go_router), theme, languages
  core/                      api client, session, models, formatting
  l10n/                      app_en.arb / app_bn.arb (UI text), labels.g.dart (generated)
  ui/                        theme and shared widgets
  screens/                   one file per screen; forms.dart holds every form
tool/sync_labels.mjs         copies status/stage/purpose labels from the website
```

After changing labels in `web/src/messages/*.json`, run `node tool/sync_labels.mjs`.
After changing `lib/l10n/*.arb`, run `flutter gen-l10n` (also runs on build).

Checks: `flutter analyze` and `flutter test`.

**Windows note:** `android/gradle.properties` sets `kotlin.incremental=false`
because the project and the pub cache are on different drives; Kotlin's
incremental build fails across drives.
