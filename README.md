# FounderType

[![Verify](https://github.com/JoshkieChan/FounderType/actions/workflows/launch-readiness.yml/badge.svg)](https://github.com/JoshkieChan/FounderType/actions/workflows/launch-readiness.yml)

FounderType is a cross-platform behavioral commitment and accountability application built with Expo and React Native. A seven-question diagnostic identifies a builder pattern, followed by one public 30-day commitment, daily check-ins, and user-triggered weekly receipts.

The diagnostic and accountability messages use deterministic local rules. They are not AI-generated, clinically validated assessments, or independent proof that work was completed.

## Product flow

1. Read the onboarding and answer seven questions.
2. Review the resulting builder pattern.
3. Complete the web security check and post one outcome with a daily action.
4. Check in once per UTC date; review the public record.
5. Log a weekly receipt, then mark the commitment complete or abandoned.

Content can be edited for 24 hours. Owners can delete commitments; records are not guaranteed permanent. Weekly receipts are generated on demand, not by a background scheduler.

## Architecture

React Native / React Native Web screens → React Navigation, context and hooks → Supabase client → Auth and PostgreSQL with RLS. Edge Functions provide CAPTCHA verification and optional restricted receipt email through Resend. Sentry diagnostics are enabled only when a public DSN is configured.

- Expo SDK 54, React 19.1, React Native 0.81, TypeScript
- React Navigation; AsyncStorage for diagnostic progress and scoped receipt caches
- Supabase anonymous Auth, PostgreSQL migrations, RLS, Deno Edge Functions
- hCaptcha on web; Resend behind an operator recipient allowlist
- Jest, Playwright, local PostgreSQL tests using PGlite, GitHub Actions
- Metro web export, static-hosting configuration for Vercel, EAS native build profiles

See [backend and security boundaries](docs/BACKEND.md) and [delivery setup](docs/RELEASE.md).

## Run locally

Use Node 22 LTS and npm. The lockfile is committed; peer dependency checking is enabled.

```sh
npm ci
npm run web
```

With no environment file, onboarding, diagnostic, results and the commitment form can be explored without a backend. Posting, check-ins and feed data require a configured Supabase project. Failed writes remain errors; they do not produce pretend public records.

Copy the placeholders in [.env.example](.env.example) into an ignored local environment file only when configuring services. Replace the public Supabase URL/key and hCaptcha site key with actual public configuration. Never put a service-role key, Resend key, CAPTCHA secret or Sentry upload token in an `EXPO_PUBLIC_*` variable. Public variables are embedded at build time and require a rebuild when changed. Server-only values belong in Supabase Function secrets or the source-map upload environment.

Native development uses npm run android or npm run ios (iOS requires macOS). First-time native commitment creation is currently blocked by the missing native CAPTCHA integration; use the web flow. Native build configuration does not imply a store release.

## Verification

```sh
npm run format:check
npm run lint
npm run typecheck
npm test -- --runInBand
npm run test:database
npm run test:edge
npm run expo:check
npm run expo:doctor
npm run build
npm run audit:dependencies
npx playwright install chromium
npm run test:browser
```

For an exported local build, run npm run serve:web in one terminal and npm run smoke:web in another. The HTTP smoke test checks routes; Playwright executes the application, asserts the diagnostic flow, and uses isolated synthetic API fixtures for authenticated screens. Database tests apply every migration in order and exercise actual PostgreSQL roles/RLS. They do not test a hosted Supabase deployment. CI also type-checks both Edge Function entry points with Deno.

The dependency gate reports a small set of explicitly documented, expiring upstream exceptions; it is not a zero-vulnerability claim. See [security and dependency maintenance](docs/SECURITY.md).

## Screenshots

[Application screenshots](docs/screenshots/README.md) are captured from the actual web application. Authenticated screens use synthetic local test fixtures; they are not evidence of a live deployment or real users.

## Delivery and limitations

The repository contains Vercel static-hosting configuration and EAS development, preview and production build profiles. A build profile named production is configuration, not release evidence. This repository makes no claim of App Store/Play Store availability, current public deployment, downloads, or production-scale usage.

- Anonymous accounts are tied to their session. Recovery/linking and a complete in-app account deletion flow are not implemented.
- Native CAPTCHA and physical-device notification/release verification remain outstanding.
- Local notifications require permissions; there is no server push or scheduled receipt-email worker.
- Receipt email is optional and restricted to operator-enabled recipients. Provider acceptance does not prove inbox delivery.
- Offline diagnostic progress and receipt snapshots are local conveniences. There is no reliable offline write queue or automatic receipt resynchronization.
- Public-feed moderation/reporting workflows are not implemented.
- The additive backend migration must be applied before deploying the updated client and functions. Existing data needs the preflight checks in the backend guide.
