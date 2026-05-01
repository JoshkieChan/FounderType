-- Add daily_action field to commitments table
ALTER TABLE commitments ADD COLUMN IF NOT EXISTS daily_action VARCHAR(60);
