-- Reduce legacy broad grants. RLS is the primary row-level control, but table
-- privileges should still be least-privilege for browser clients.

REVOKE ALL ON commitments FROM anon, authenticated;
REVOKE ALL ON daily_progress FROM anon, authenticated;
REVOKE ALL ON profiles FROM anon, authenticated;
REVOKE ALL ON accountability_receipts FROM anon, authenticated;

-- Public feed reads only public rows through RLS.
GRANT SELECT ON commitments TO anon, authenticated;
GRANT SELECT ON daily_progress TO anon, authenticated;

-- Supabase anonymous-auth users use the authenticated role and can only mutate
-- owner rows through RLS policies.
GRANT INSERT, UPDATE, DELETE ON commitments TO authenticated;
GRANT INSERT, UPDATE ON daily_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT ON accountability_receipts TO authenticated;
