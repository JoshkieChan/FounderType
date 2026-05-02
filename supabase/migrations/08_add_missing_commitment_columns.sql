-- Add missing columns to commitments table to match frontend usage
ALTER TABLE commitments 
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS abandoned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS abandoned_on_day INTEGER,
  ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;

-- Ensure RLS is updated for these new columns (though ALL should cover it)
-- This migration assumes 07 has already been considered or will be.
