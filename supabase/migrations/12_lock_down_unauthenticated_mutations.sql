-- Lock down public anon mutation paths that existed in earlier migrations.
-- Anonymous product usage must use Supabase anonymous auth, which receives
-- an auth.uid() and is governed by the authenticated owner policies.

REVOKE INSERT, UPDATE, DELETE ON commitments FROM anon;
REVOKE INSERT, UPDATE, DELETE ON daily_progress FROM anon;
REVOKE INSERT, UPDATE, DELETE ON profiles FROM anon;

DROP POLICY IF EXISTS "Users can insert own commitments" ON commitments;
DROP POLICY IF EXISTS "Users can update own commitments" ON commitments;
DROP POLICY IF EXISTS "Users can delete own commitments" ON commitments;

CREATE POLICY "Users can insert own commitments"
  ON commitments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commitments"
  ON commitments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own commitments"
  ON commitments FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own check-ins" ON daily_progress;
DROP POLICY IF EXISTS "Users can update own check-ins" ON daily_progress;

CREATE POLICY "Users can insert own check-ins"
  ON daily_progress FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM commitments
      WHERE commitments.id = commitment_id
        AND commitments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own check-ins"
  ON daily_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM commitments
      WHERE commitments.id = commitment_id
        AND commitments.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM commitments
      WHERE commitments.id = commitment_id
        AND commitments.user_id = auth.uid()
    )
  );
