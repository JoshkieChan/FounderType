-- Add daily_action field to commitments table
ALTER TABLE commitments ADD COLUMN IF NOT EXISTS daily_action VARCHAR(60);

-- Add daily_progress JSON field for tracking 30-day completion
ALTER TABLE commitments ADD COLUMN IF NOT EXISTS daily_progress JSONB DEFAULT '[]';

-- Clean up broken commitments without daily_action
DELETE FROM commitments WHERE daily_action IS NULL OR daily_action = '';

-- Update existing commitments to have a default daily_action if needed
-- UPDATE commitments SET daily_action = 'Work on commitment' WHERE daily_action IS NULL;"
