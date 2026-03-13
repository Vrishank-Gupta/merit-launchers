# Merit Launchers

Flutter MVP for the Merit Launchers student app and admin dashboard.

## What is included

- Student-facing mobile-first app flow
- Admin dashboard for web
- Mock login, onboarding, referral capture, purchases, receipts, support chat
- Timed exam engine with scoring, sectional analysis, and PDF export
- Admin content creation for courses, papers, and affiliates
- Stable readable math formatting for LaTeX-style exam content on Android, iOS, and web
- Native course video playback from direct stream URLs
- Payment receipts can be opened in-app and downloaded as PDF
- Student content refresh without app updates through backend-driven data sync
- Admin paper creation includes live math preview and quick-insert math snippets
- Attempts, receipts, and support history are persisted locally on device for low-cost resilience

## Stack

- Flutter
- Material 3
- Single codebase with separate platform surfaces:
  - mobile: student app
  - web: admin dashboard

## Project structure

- `lib/app`: app shell, theme, controller, models, seeded demo data
- `lib/features/student`: student experience
- `lib/features/admin`: admin dashboard
- `lib/widgets`: shared UI helpers
- `assets/branding`: logo and brand assets

## Local run

1. Install Flutter 3.29.x or compatible stable SDK.
2. Run `flutter pub get`
3. Run `flutter run -d chrome` for web admin preview
4. Run `flutter run` on an Android or iOS target for mobile preview

## Environment setup

- The app loads `.env.demo` by default.
- Use `APP_ENV=prod` at build or run time to target production.
- Use `APP_ENV=dev` to target your dev Supabase project.
- Only `SUPABASE_URL` and `SUPABASE_ANON_KEY` belong in the Flutter client.
- Never put `service_role` keys in the app.
- Put backend-only secrets in Supabase Edge Function secrets or `supabase/functions/.env.local` for local function testing only.

Run demo:

- `flutter run`
- `flutter run -d chrome`

Platform behavior:

- `flutter run` on Android/iOS opens the student app only
- `flutter run -d chrome` opens the admin web dashboard only

Run dev:

- `flutter run --dart-define=APP_ENV=dev`
- `flutter run -d chrome --dart-define=APP_ENV=dev`

Run prod:

- `flutter run --dart-define=APP_ENV=prod`
- `flutter build web --dart-define=APP_ENV=prod`
- `flutter build apk --dart-define=APP_ENV=prod`

## Content behavior

- Mobile student builds do not include the admin surface.
- Web builds do not include the student surface.
- Courses, papers, and uploaded course videos are fetched from Supabase at runtime.
- The student app refreshes on app resume, manual pull-to-refresh, and after content-changing actions.
- There is no 30-second background polling loop, which keeps Supabase usage lower.
- The same math formatter is used for student Android, student iOS, and admin preview.

## Cost posture

- Keep Supabase for shared metadata only: courses, papers, question banks, affiliates, student profiles, and payment verification.
- Student runtime activity is handled local-first in the app so exam submission and support actions do not break if backend state is incomplete.
- Attempts, receipts, and support history are cached on-device with `shared_preferences` so they survive app restarts.
- Avoid Supabase Realtime unless a real operational need appears.
- Prefer app resume and manual refresh over frequent background polling.

## Payments

- Mobile checkout is wired for Razorpay.
- The Flutter app uses only the client-safe Razorpay `key_id`.
- Order creation and payment verification are handled in Supabase Edge Functions under [supabase/functions](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/supabase/functions).
- Demo mode simulates a successful payment so you can review the full student flow without real gateway credentials.
- In `dev` and `prod`, the payment flow is:
  1. app requests a Razorpay order from `create-razorpay-order`
  2. mobile Razorpay checkout completes
  3. `verify-razorpay-payment` validates the signature
  4. the Edge Function fetches the payment from Razorpay
  5. the Edge Function writes the final `purchases` row using `SUPABASE_SERVICE_ROLE_KEY`
- Put these backend secrets in Supabase function secrets, not in Flutter:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `RAZORPAY_KEY_ID`
  - `RAZORPAY_KEY_SECRET`
  - `RAZORPAY_WEBHOOK_SECRET`

Flutter env values:

- `.env.dev`
- `.env.prod`

Only these keys belong there:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-client-safe-anon-key
RAZORPAY_KEY_ID=rzp_test_or_live_key_id
```

Supabase function secrets:

```powershell
supabase secrets set SUPABASE_URL=https://your-project-ref.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-server-only-key
supabase secrets set RAZORPAY_KEY_ID=rzp_test_or_live_key_id
supabase secrets set RAZORPAY_KEY_SECRET=your_razorpay_secret
supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

Deploy the payment functions:

```powershell
supabase functions deploy create-razorpay-order
supabase functions deploy verify-razorpay-payment
```

Current limitation:

- Razorpay in-app checkout is configured for Android and iOS builds.
- Web admin review stays in demo or unsupported-payment mode.

## Supabase schema

- Initial schema is in [supabase/migrations/20260313_001_init.sql](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/supabase/migrations/20260313_001_init.sql)
- Payment verification additions are in [supabase/migrations/20260313_002_payment_verification.sql](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/supabase/migrations/20260313_002_payment_verification.sql)
- Course video storage bucket and policies are in [supabase/migrations/20260314_003_course_videos_storage.sql](C:/Users/VRISHANK/OneDrive/Desktop/ML/merit_launchers/supabase/migrations/20260314_003_course_videos_storage.sql)
- This migration is intentionally permissive for `dev` while auth is still mocked
- Before real production launch, tighten RLS around authenticated users and admin roles

Quick way to apply it:

1. Open Supabase SQL Editor for your dev project
2. Run `20260313_001_init.sql`
3. Run `20260313_002_payment_verification.sql`
4. Run `20260314_003_course_videos_storage.sql`
5. Deploy the Edge Functions
6. Start the app with `--dart-define=APP_ENV=dev`

## Production direction

- Keep backend managed and low-maintenance: Supabase is the recommended next step.
- Keep admin as web, not a separate app.
- Keep payments server-verified and backend-driven.
- Keep dynamic course and paper content in backend storage so app updates are not needed for content changes.
- Keep the student app phone-first and do not expose admin routes in the mobile build.

## Repository hygiene

- Do not commit local SDK/tooling folders such as `.tools`
- Do not commit generated folders such as `.dart_tool` and `build`
- Do not keep local-only npm folders or lockfiles here unless you intentionally need them for Supabase CLI work
- Do not commit client `.env.*` files with real keys, Supabase local secrets, signing keys, or Android local properties
- This repository should only contain source, config, and deploy-relevant assets
