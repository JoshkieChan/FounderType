# App Store Privacy Labels Draft

Use this as the App Store Connect privacy questionnaire source of truth. Keep it aligned with the in-app Privacy Policy.

## Data Collected

### User Content

- Diagnostic answers
- FounderType result
- Public commitment text
- Daily action
- Check-in progress
- Accountability receipt content

Purpose: App functionality.

Linked to user: Yes, to the anonymous/authenticated FounderType account identifier.

Tracking: No.

### Contact Info

- Email address only if the user opts in to accountability receipt emails.

Purpose: App functionality.

Linked to user: Yes, when provided.

Tracking: No.

### Identifiers

- Supabase anonymous/authenticated user ID.

Purpose: App functionality, account ownership, fraud prevention.

Linked to user: Yes.

Tracking: No.

### Diagnostics

- Crash/error diagnostics through Sentry.
- Basic web performance events through Vercel for the web experience.

Purpose: Analytics and app functionality/reliability.

Linked to user: No for aggregate web analytics; crash diagnostics may include technical context.

Tracking: No.

## Data Not Collected

- Precise location
- Contacts
- Photos or videos
- Camera data
- Payment information
- Health data
- Browsing history outside FounderType
- Advertising identifiers

## Reviewer Notes

FounderType does not request camera, photo library, contacts, location, Bluetooth, microphone, or tracking permissions.

The public feed intentionally displays anonymous commitment content. Users should avoid posting personal, sensitive, illegal, or abusive content.
