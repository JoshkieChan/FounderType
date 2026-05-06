# FounderType App Store Readiness

This project is configured for Expo/EAS native release without changing the existing Vercel web launch workflow.

## Current Native Configuration

- iOS bundle identifier: `com.foundertype.app`
- Android package: `com.foundertype.app`
- EAS build profiles: `development`, `preview`, `production`
- Production builds use remote versioning and auto-increment through EAS.
- Unused camera/photo/storage permissions are intentionally not requested.
- Non-exempt encryption is declared as false because the app only uses standard HTTPS/TLS.
- Metadata draft is in `store.config.json`.
- Privacy label draft is in `docs/launch/APP_PRIVACY_LABELS.md`.
- Review notes draft is in `docs/launch/APP_REVIEW_NOTES.md`.

## Required Manual Setup Before First Store Submission

1. Link the project to the correct Expo account:

   ```sh
   npx eas-cli@latest init
   ```

   This should add the real `extra.eas.projectId` to `app.json`. Do not use placeholder project IDs.

2. Configure Apple credentials:

   ```sh
   npx eas-cli@latest credentials -p ios
   ```

3. Configure Android credentials:

   ```sh
   npx eas-cli@latest credentials -p android
   ```

4. Configure EAS submit credentials when App Store Connect and Play Console records exist:

   ```sh
   npx eas-cli@latest submit -p ios --profile production
   npx eas-cli@latest submit -p android --profile production
   ```

5. Fill App Store Connect review contact fields with real owner/support details. Do not use placeholder reviewer contact information.

## Build Commands

```sh
npx eas-cli@latest build -p ios --profile preview
npx eas-cli@latest build -p ios --profile production
npx eas-cli@latest build -p android --profile production
```

## Workflow Files

- `.eas/workflows/ios-testflight.yml` manually builds iOS and submits to TestFlight.
- `.eas/workflows/android-internal.yml` manually builds Android and optionally submits.
- `.eas/workflows/web-eas-hosting.yml` manually deploys web to EAS Hosting if you choose to use it later.

The Vercel/Product Hunt web workflow remains the active production web path.
