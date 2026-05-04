-- 11. Add performance indexes for free tier optimization
CREATE INDEX IF NOT EXISTS idx_commitments_user_created 
ON commitments(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_commitments_public_created 
ON commitments(is_public, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_commitments_status_created 
ON commitments(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_daily_progress_commitment_day 
ON daily_progress(commitment_id, day_number);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON profiles(user_id);

-- 12. Create optimized view for public feed
DROP VIEW IF EXISTS public.commitments_feed;
CREATE VIEW public.commitments_feed AS
SELECT 
  c.id,
  c.user_id,
  c.founder_type,
  c.commitment_text,
  c.deadline,
  c.status,
  c.is_public,
  c.days_completed,
  c.created_at
FROM commitments c
WHERE c.is_public = true
ORDER BY c.created_at DESC
LIMIT 100;

-- 13. Create pagination function for commitments
CREATE OR REPLACE FUNCTION get_paginated_commitments(
  page_size INTEGER DEFAULT 20,
  page_number INTEGER DEFAULT 1,
  filter_public BOOLEAN DEFAULT true
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  founder_type TEXT,
  commitment_text TEXT,
  deadline TIMESTAMPTZ,
  status TEXT,
  is_public BOOLEAN,
  days_completed INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.founder_type,
    c.commitment_text,
    c.deadline,
    c.status,
    c.is_public,
    c.days_completed,
    c.created_at
  FROM commitments c
  WHERE (filter_public = false OR c.is_public = true)
  ORDER BY c.created_at DESC
  LIMIT page_size
  OFFSET (page_number - 1) * page_size;
END;
$$ LANGUAGE plpgsql;

-- 14. Create function for user-specific commitments
CREATE OR REPLACE FUNCTION get_user_commitments(
  target_user_id UUID,
  page_size INTEGER DEFAULT 20,
  page_number INTEGER DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  founder_type TEXT,
  commitment_text TEXT,
  deadline TIMESTAMPTZ,
  status TEXT,
  is_public BOOLEAN,
  days_completed INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.user_id,
    c.founder_type,
    c.commitment_text,
    c.deadline,
    c.status,
    c.is_public,
    c.days_completed,
    c.created_at
  FROM commitments c
  WHERE c.user_id = target_user_id
  ORDER BY c.created_at DESC
  LIMIT page_size
  OFFSET (page_number - 1) * page_size;
END;
$$ LANGUAGE plpgsql;

-- 15. Update database statistics for better query planning
ANALYZE commitments;
ANALYZE profiles;
ANALYZE daily_progress;
