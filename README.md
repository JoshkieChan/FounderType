# FounderType

FounderType is a behavioral commitment system for people who keep starting things and stopping.

It identifies a user's builder pattern, puts one 30-day commitment on public record, and keeps accountability visible through check-ins and weekly receipts. It is not a course, coaching app, or generic productivity community.

## Product Flow

1. Onboarding explains the accountability premise.
2. Diagnostic asks seven founder-pattern questions.
3. Results name the user's FounderType.
4. Commitment records one specific 30-day outcome publicly.
5. Daily check-in and accountability receipts keep the record honest.

## Tech Stack

- Expo SDK 54
- React Native / React Native Web
- React Navigation
- Supabase Auth, Postgres, RLS, and Edge Functions
- hCaptcha for public commitment abuse protection
- Resend through Supabase Edge Functions for optional receipt email
- Sentry for error monitoring
- Vercel for production web hosting
- EAS for native iOS/Android builds

## Local Development

```sh
npm install
npx expo start
```

Web production build:

```sh
npm run build
npm run serve:web
npm run smoke:web
```

## Verification

```sh
npx tsc --noEmit --pretty false
npm test -- --runInBand
npm run build
npm run expo:check
npm run expo:doctor
npm audit --audit-level=high
```

## Native Release

EAS profiles are defined in `eas.json`.

```sh
npm run eas:build:ios
npm run eas:build:android
```

Manual EAS workflows are available in `.eas/workflows/` for iOS TestFlight, Android internal builds, and optional EAS Hosting web deploys. Vercel remains the primary Product Hunt web deployment path.

Before the first App Store submission, complete the Apple Developer/App Store Connect setup documented in `docs/launch/APP_STORE_READINESS.md`.
