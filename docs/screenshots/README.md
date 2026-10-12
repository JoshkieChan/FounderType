# Application screenshots

Captured from the actual Metro web export using Playwright at a desktop viewport. All account, commitment and receipt data is fictional. The authenticated screens use intercepted Supabase and CAPTCHA SDK responses; no provider challenge is bypassed on a real service and no email is sent. Database and Edge Function tests cover those separate boundaries.

| Screen                       | Capture                                  |
| ---------------------------- | ---------------------------------------- |
| Onboarding                   | [01-onboarding.png](01-onboarding.png)   |
| Seven-question diagnostic    | [02-diagnostic.png](02-diagnostic.png)   |
| Deterministic builder result | [03-result.png](03-result.png)           |
| Commitment form              | [04-commitment.png](04-commitment.png)   |
| Daily check-in               | [05-check-in.png](05-check-in.png)       |
| Weekly receipt               | [06-receipt.png](06-receipt.png)         |
| Public feed                  | [07-public-feed.png](07-public-feed.png) |

Reproduce with `CAPTURE_SCREENSHOTS=1 npm run test:browser` on a POSIX shell, or `$env:CAPTURE_SCREENSHOTS='1'; npm run test:browser` in PowerShell. Install Chromium first with `npx playwright install chromium`. The browser suite exports its synthetic configuration separately to `.expo/browser-build`; the normal build exports to `web-build`.
