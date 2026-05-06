-- Tighten owner policies for Supabase anonymous-auth users.
-- Supabase anonymous sign-ins use the authenticated database role, so every
-- owner mutation must require a non-null auth.uid() matching user_id.

REVOKE INSERT, UPDATE, DELETE ON commitments FROM anon;
REVOKE INSERT, UPDATE, DELETE ON daily_progress FROM anon;
REVOKE INSERT, UPDATE, DELETE ON profiles FROM anon;
REVOKE ALL ON accountability_receipts FROM anon;

GRANT SELECT ON commitments TO anon, authenticated;
GRANT SELECT ON daily_progress TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON commitments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON daily_progress TO authenticated;
GRANT SELECT, INSERT ON accountability_receipts TO authenticated;

DROP POLICY IF EXISTS "Users can insert own commitments" ON commitments;
DROP POLICY IF EXISTS "Users can update own commitments" ON commitments;
DROP POLICY IF EXISTS "Users can delete own commitments" ON commitments;

CREATE POLICY "Users can insert own commitments"
  ON commitments FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

CREATE POLICY "Users can update own commitments"
  ON commitments FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

CREATE POLICY "Users can delete own commitments"
  ON commitments FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own check-ins" ON daily_progress;
DROP POLICY IF EXISTS "Users can update own check-ins" ON daily_progress;

CREATE POLICY "Users can insert own check-ins"
  ON daily_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM commitments
      WHERE commitments.id = commitment_id
        AND commitments.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update own check-ins"
  ON daily_progress FOR UPDATE
  TO authenticated
  USING (
    (select auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM commitments
      WHERE commitments.id = commitment_id
        AND commitments.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM commitments
      WHERE commitments.id = commitment_id
        AND commitments.user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view own accountability receipts" ON accountability_receipts;
DROP POLICY IF EXISTS "Users can insert own accountability receipts" ON accountability_receipts;

CREATE POLICY "Users can view own accountability receipts"
  ON accountability_receipts FOR SELECT
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL AND (select auth.uid()) = user_id);

CREATE POLICY "Users can insert own accountability receipts"
  ON accountability_receipts FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) IS NOT NULL
    AND (select auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM commitments
      WHERE commitments.id = commitment_id
        AND commitments.user_id = (select auth.uid())
    )
  );

CREATE INDEX IF NOT EXISTS idx_commitments_user_status_created
  ON commitments(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_user_created
  ON profiles(user_id, created_at DESC);
