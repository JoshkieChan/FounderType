-- Unauthenticated visitors may read public data, but must not mutate public rows.
-- Anonymous product usage should sign in through Supabase anonymous auth, which uses
-- the authenticated role and receives a stable auth.uid() for RLS ownership checks.
REVOKE INSERT, UPDATE, DELETE ON commitments FROM anon;
REVOKE INSERT, UPDATE, DELETE ON daily_progress FROM anon;
REVOKE INSERT, UPDATE, DELETE ON profiles FROM anon;

-- Also ensure the sequences for IDs are usable by anon if they weren't using UUIDs
-- (We use UUIDs so this is mostly for completeness)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
