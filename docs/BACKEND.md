# Backend

## Data model and ownership

Migrations are applied in filename order: the historical 01–16 series followed by timestamped migrations. They define profiles, commitments, daily_progress, accountability_receipts, and email_send_log. All five tables have RLS enabled.

An unauthenticated visitor uses the anon database role and can read public commitments and their progress. A Supabase anonymous sign-in is a real authenticated identity with an auth.uid(); it can write only its own rows. Profiles and receipts are private to the owner. Private historical commitments and their progress are visible only to their owner. The feed view uses security_invoker so its underlying reads obey RLS.

A partial unique index permits at most one active commitment per owner. Column grants prevent browser clients from setting ownership after creation, timestamps, visibility or progress. A trigger sets the 30-day window, locks content edits after 24 hours, and rejects reopening a completed/abandoned record. Owner deletion remains supported.

The record_check_in RPC delegates to a narrowly granted SECURITY DEFINER function in an unexposed private schema, with an empty search_path and explicit ownership checks. It locks the commitment row, inserts one progress record for the UTC date, and updates the summary in the same transaction. Direct browser writes to daily_progress are revoked. Repeating a request on the same date is idempotent. Check-ins are self-reported; these controls do not prove the user performed the activity.

## Fresh setup and upgrades

Use the Supabase CLI or a PostgreSQL migration runner against a dedicated development project. Enable anonymous sign-ins and configure hCaptcha in Supabase Auth before exposing public signup. Auth must validate the CAPTCHA itself; a call to hcaptcha-verify is not a reusable authorization grant.

Never apply migrations blindly to an existing hosted project. Back up the database and inspect the applied migration list first. The historical scripts are preserved. The new migration intentionally fails if multiple active commitments exist for one owner; reconcile those records explicitly, without silent deletion.

```sql
select user_id, count(*) from public.commitments
where status = 'active' and user_id is not null
group by user_id having count(*) > 1;

select id from public.commitments
where length(btrim(commitment_text)) not between 1 and 140
   or daily_action is null or length(btrim(daily_action)) not between 1 and 60
   or status is null or status not in ('active', 'completed', 'abandoned');
```

New content constraints are NOT VALID for historical rows: new writes are checked, while existing invalid rows require deliberate remediation. After reviewing them, validate commitment_text_length, commitment_daily_action_length and commitment_status with ALTER TABLE ... VALIDATE CONSTRAINT. Existing orphaned legacy rows with null user_id are not automatically assigned to anyone.

Run npm run test:database for a fresh migration replay using PGlite (PostgreSQL compiled to WebAssembly). The harness supplies minimal Supabase auth roles, auth.users and auth.uid(). It verifies table grants, RLS, RPC ownership, edit rules and email reservations. Hosted Auth, PostgREST, Deno networking and deployment drift require separate staging verification.

## Edge Functions

send-email validates a Supabase session, looks up a receipt and commitment owned by that identity, verifies a fresh hCaptcha token, and sends a fixed plain-text message built from database fields. Client-supplied HTML and subject are ignored. Requests have bounded bodies, provider timeouts, and generic client errors.

Email is disabled without RESEND_API_KEY, a verified RESEND_FROM_EMAIL, CAPTCHA configuration and a nonempty RECEIPT_EMAIL_ALLOWLIST (comma-separated permitted recipients). This intentionally does not provide an open email relay for anonymous accounts. Supply only synthetic recipients for staging checks.

The service role is used only inside the function for explicit owner-filtered lookups, atomic reservations and delivery-status logging. Browser clients cannot forge logs or call reserve_receipt_email. A database transaction serializes reservations: at most five attempts per user/day, five per recipient/day and 100 total/day, using UTC. A receipt/recipient pair may be requested once. Failed/ambiguous sends consume the reservation; no automatic retry worker exists. The reservation ID is also the provider idempotency key.

email_send_log retains recipient, fixed subject, receipt reference, status and time, but no message body, token or provider error payload. Define an operator retention policy before public operation. Application CAPTCHA does not replace platform-level request throttling; hcaptcha-verify is a diagnostic endpoint with bounded inputs, not a complete rate limiter.

Deploy functions and migrations only to the intended project. Configure gateway JWT behavior consistently with its key type; send-email always validates the caller with Auth itself. The repository does not change any hosted database or send real messages during its tests.
