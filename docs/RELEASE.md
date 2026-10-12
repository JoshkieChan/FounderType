# Web and native delivery

## Web

npm run build exports a Metro single-page application to web-build. npm run serve:web serves it at http://127.0.0.1:4177; npm run smoke:web checks that local output. Client-side routes fall back to index.html, while missing static assets return 404 in the local server.

vercel.json specifies npm ci, the export command, output directory and SPA rewrites. It is deployment configuration, not evidence that a current deployment works. Set the public Expo variables in the target build environment. Apply the backend migration and deploy matching Edge Functions before releasing this client. Do not reuse the retired FounderType custom domain.

No live deployment is required for the test suite. CI builds without private service credentials. Playwright's authenticated-screen fixtures never connect to a real Supabase project and are not included in the production bundle.

## Native

app.json declares com.foundertype.app for both platforms, the existing artwork, dark UI and the new React Native architecture. eas.json defines development-client, internal preview and production profiles. Preview iOS builds target the simulator; Android previews produce APKs. Production profiles use remote versioning and Android App Bundles.

```sh
npx eas-cli init
npx eas-cli credentials -p ios
npx eas-cli credentials -p android
npm run eas:build:ios
npm run eas:build:android
```

These commands require an Expo account and platform credentials. Linking adds a real EAS project ID; none is invented here. Production build commands can incur provider charges. Do not submit simulator builds to TestFlight. Manual .eas workflows are optional configuration and have not been treated as proof of completed builds or submission.

Before any store submission: implement and verify native CAPTCHA, test authentication persistence and notifications on physical devices, configure actual support/privacy URLs, provide account deletion and public-content moderation/reporting, review all permissions and privacy disclosures, and supply real reviewer contact information in the store consoles. The existing store metadata is a draft, not a release record. A preview build or local bundle does not demonstrate store acceptance.

## Data and privacy disclosures

The diagnostic is calculated locally. Profiles may be saved under a Supabase identity; local diagnostic progress persists through AsyncStorage. Public commitments expose text, daily action, status, check-in dates and a pseudonymous account ID. Avoid sensitive text. Profiles and receipt history are owner-scoped; local receipt caches are namespaced by identity.

Optional email exposes a recipient address to Supabase logging and Resend. Sentry receives technical diagnostics only when a DSN is configured; default PII transmission is disabled. Local funnel events are stored on the device; Vercel analytics forwarding depends on host configuration. Notification permission is requested on native startup.

Validate disclosures against the actual SDK configuration and deployed services before completing App Store privacy labels or Google Play Data Safety. This guide describes implementation; it does not certify legal compliance or store readiness. Establish an active private support channel, deletion procedure and retention policy before public operation.

`store.config.json` is draft metadata with example URLs. Replace them with verified policy/support pages and review the user-content age-rating answers before submission. EAS workflows are manually triggered configuration, not completed builds or submissions.
