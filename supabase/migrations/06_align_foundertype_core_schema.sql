-- Remove old delete helpers that bypassed commitment ownership checks.
DROP FUNCTION IF EXISTS delete_commitment(UUID);
DROP FUNCTION IF EXISTS admin_delete_commitment(UUID);

ALTER TABLE commitments
  ADD COLUMN IF NOT EXISTS days_completed INTEGER NOT NULL DEFAULT 0;

-- Daily progress is tracked as first-class rows so each day can be updated,
-- audited, and queried without rewriting a JSON array on the commitment.
CREATE TABLE IF NOT EXISTS daily_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  commitment_id UUID NOT NULL REFERENCES commitments(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number BETWEEN 1 AND 30),
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (commitment_id, day_number)
);

ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON daily_progress TO anon;
GRANT ALL ON daily_progress TO authenticated;

DROP POLICY IF EXISTS "Progress readable for public commitments" ON daily_progress;
CREATE POLICY "Progress readable for public commitments"
  ON daily_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM commitments
      WHERE commitments.id = daily_progress.commitment_id
        AND commitments.is_public = true
    )
  );

DROP POLICY IF EXISTS "Users manage progress for own commitments" ON daily_progress;
CREATE POLICY "Users manage progress for own commitments"
  ON daily_progress FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM commitments
      WHERE commitments.id = daily_progress.commitment_id
        AND commitments.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM commitments
      WHERE commitments.id = daily_progress.commitment_id
        AND commitments.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_daily_progress_commitment_day
  ON daily_progress (commitment_id, day_number);

CREATE INDEX IF NOT EXISTS idx_commitments_status_created_at
  ON commitments (status, created_at DESC);
