-- Allow anonymous users to insert commitments
DROP POLICY IF EXISTS "Anonymous users can insert commitments" ON commitments;
CREATE POLICY "Anonymous users can insert commitments"
  ON commitments FOR INSERT
  WITH CHECK (true);

-- Allow updating anonymous commitments (where user_id is null)
DROP POLICY IF EXISTS "Anyone can update anonymous commitments" ON commitments;
CREATE POLICY "Anyone can update anonymous commitments"
  ON commitments FOR UPDATE
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);
