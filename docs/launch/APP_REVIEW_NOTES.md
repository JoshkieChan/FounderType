# App Review Notes Draft

Use this in App Store Connect review notes once the Apple Developer account exists.

## Reviewer Access

FounderType does not require a traditional email/password login to evaluate the main flow. The app uses anonymous Supabase authentication so reviewers can open the app, complete the diagnostic, and create a commitment without a demo account.

## Suggested Review Flow

1. Open FounderType.
2. Read the onboarding screen.
3. Tap the primary diagnostic CTA.
4. Answer the seven diagnostic questions.
5. Continue from results to the commitment screen.
6. Enter one specific 30-day commitment and daily action.
7. Complete hCaptcha when prompted.
8. Submit the commitment.
9. View the public feed and daily check-in/accountability screen.

## Product Explanation

FounderType is a behavioral commitment system for people who repeatedly start projects and stop. It identifies a user's builder pattern, records one public 30-day commitment, and creates an accountability record through daily check-ins and weekly receipts.

It is not financial advice, medical advice, coaching, gambling, a contest, or a marketplace.

## Privacy/Safety Notes

- Public commitments are anonymous and intentionally visible.
- The app does not request camera, photo library, contacts, location, microphone, or tracking permissions.
- Email is optional and used only for accountability receipt delivery when the user opts in.
- hCaptcha is used to prevent automated abuse on public commitment submission.
- Sentry is used for crash/error diagnostics.

## Support

Support URL: https://project-zoaht.vercel.app

Privacy Policy: https://project-zoaht.vercel.app/privacy
