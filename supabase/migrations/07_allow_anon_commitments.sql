-- Allow anonymous users to insert commitments
CREATE POLICY "Anonymous users can insert commitments"
  ON commitments FOR INSERT
  WITH CHECK (true);

-- Allow updating anonymous commitments (where user_id is null)
CREATE POLICY "Anyone can update anonymous commitments"
  ON commitments FOR UPDATE
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);
