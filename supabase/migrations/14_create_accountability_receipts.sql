CREATE TABLE IF NOT EXISTS accountability_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number >= 1),
  founder_type TEXT NOT NULL DEFAULT 'Founder',
  commitment_text TEXT NOT NULL,
  daily_action TEXT,
  agent_mode TEXT NOT NULL CHECK (
    agent_mode IN ('empty', 'checked_in', 'behind', 'deadline', 'normal')
  ),
  title TEXT NOT NULL,
  mirror TEXT NOT NULL,
  prompt TEXT NOT NULL,
  missed_days INTEGER NOT NULL DEFAULT 0 CHECK (missed_days >= 0),
  checked_in_today BOOLEAN NOT NULL DEFAULT false,
  days_since_start INTEGER NOT NULL DEFAULT 0 CHECK (days_since_start >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE accountability_receipts ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON accountability_receipts FROM anon;
GRANT SELECT, INSERT ON accountability_receipts TO authenticated;

DROP POLICY IF EXISTS "Users can view own accountability receipts" ON accountability_receipts;
CREATE POLICY "Users can view own accountability receipts"
  ON accountability_receipts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own accountability receipts" ON accountability_receipts;
CREATE POLICY "Users can insert own accountability receipts"
  ON accountability_receipts FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM commitments
      WHERE commitments.id = commitment_id
        AND commitments.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_accountability_receipts_user_created
  ON accountability_receipts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_accountability_receipts_commitment_created
  ON accountability_receipts(commitment_id, created_at DESC);
