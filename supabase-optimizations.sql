-- Fixed Supabase optimizations for free tier
-- Remove CONCURRENTLY to fix transaction error

-- 1. Add essential indexes for free tier
CREATE INDEX IF NOT EXISTS idx_commitments_user_created 
ON commitments(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_commitments_public_created 
ON commitments(public, created_at DESC) 
WHERE public = true;

CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON profiles(email);

CREATE INDEX IF NOT EXISTS idx_commitment_checkins_commitment_date 
ON commitment_checkins(commitment_id, date);

CREATE INDEX IF NOT EXISTS idx_commitment_checkins_user_date 
ON commitment_checkins(user_id, date);

-- 2. Enable Row Level Security for performance
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitment_checkins ENABLE ROW LEVEL SECURITY;

-- 3. Create optimized view for feed
CREATE OR REPLACE VIEW public.commitments_feed AS
SELECT 
  c.id,
  c.title,
  c.description,
  c.created_at,
  c.deadline,
  c.status,
  c.public,
  p.name as author_name,
  p.avatar_url,
  p.username as author_username
FROM commitments c
JOIN profiles p ON c.user_id = p.id
WHERE c.public = true
ORDER BY c.created_at DESC
LIMIT 100;

-- 4. Add function for efficient pagination
CREATE OR REPLACE FUNCTION get_paginated_commitments(
  page_size INTEGER DEFAULT 20,
  page_number INTEGER DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  status TEXT,
  author_name TEXT,
  author_username TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.description,
    c.created_at,
    c.deadline,
    c.status,
    p.name as author_name,
    p.username as author_username
  FROM commitments c
  JOIN profiles p ON c.user_id = p.id
  WHERE c.public = true
  ORDER BY c.created_at DESC
  LIMIT page_size
  OFFSET (page_number - 1) * page_size;
END;
$$ LANGUAGE plpgsql;

-- 5. Add function for user commitments with pagination
CREATE OR REPLACE FUNCTION get_user_commitments(
  user_uuid UUID,
  page_size INTEGER DEFAULT 20,
  page_number INTEGER DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  deadline TIMESTAMPTZ,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.description,
    c.created_at,
    c.deadline,
    c.status
  FROM commitments c
  WHERE c.user_id = user_uuid
  ORDER BY c.created_at DESC
  LIMIT page_size
  OFFSET (page_number - 1) * page_size;
END;
$$ LANGUAGE plpgsql;

-- 6. Add function for commitment check-ins
CREATE OR REPLACE FUNCTION get_commitment_checkins(
  commitment_uuid UUID,
  page_size INTEGER DEFAULT 30,
  page_number INTEGER DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  date DATE,
  completed BOOLEAN,
  notes TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.date,
    ci.completed,
    ci.notes
  FROM commitment_checkins ci
  WHERE ci.commitment_id = commitment_uuid
  ORDER BY ci.date DESC
  LIMIT page_size
  OFFSET (page_number - 1) * page_size;
END;
$$ LANGUAGE plpgsql;

-- 7. Add analytics function for user stats
CREATE OR REPLACE FUNCTION get_user_stats(
  user_uuid UUID
)
RETURNS TABLE (
  total_commitments INTEGER,
  active_commitments INTEGER,
  completed_commitments INTEGER,
  total_checkins INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_commitments,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_commitments,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_commitments,
    (
      SELECT COUNT(*)
      FROM commitment_checkins ci
      JOIN commitments c ON ci.commitment_id = c.id
      WHERE c.user_id = user_uuid
    ) as total_checkins
  FROM commitments
  WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
DROP TRIGGER IF EXISTS update_commitments_updated_at ON commitments;
CREATE TRIGGER update_commitments_updated_at
  BEFORE UPDATE ON commitments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 9. Add policy for row level security
DROP POLICY IF EXISTS "Users can view own commitments" ON commitments;
CREATE POLICY "Users can view own commitments" ON commitments
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view public commitments" ON commitments;
CREATE POLICY "Users can view public commitments" ON commitments
  FOR SELECT USING (public = true);

DROP POLICY IF EXISTS "Users can update own commitments" ON commitments;
CREATE POLICY "Users can update own commitments" ON commitments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own commitments" ON commitments;
CREATE POLICY "Users can insert own commitments" ON commitments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own commitments" ON commitments;
CREATE POLICY "Users can delete own commitments" ON commitments
  FOR DELETE USING (auth.uid() = user_id);

-- 10. Add materialized view for performance (refresh every 5 minutes)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.commitments_stats AS
SELECT 
  COUNT(*) as total_commitments,
  COUNT(CASE WHEN public = true THEN 1 END) as public_commitments,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_commitments,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_commitments,
  DATE_TRUNC('day', created_at) as date
FROM commitments
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_commitments_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.commitments_stats;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh (requires pg_cron extension)
-- This would need to be set up in Supabase dashboard or via cron job
-- SELECT cron.schedule('refresh-commitments-stats', '*/5 * * * *', 'SELECT refresh_commitments_stats();');

-- 11. Add compression for better performance
ALTER TABLE commitments SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE profiles SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE commitment_checkins SET (autovacuum_vacuum_scale_factor = 0.1);

-- 12. Add table statistics for query planner
ANALYZE commitments;
ANALYZE profiles;
ANALYZE commitment_checkins;

-- 13. Create index for text search (if needed)
CREATE INDEX IF NOT EXISTS idx_commitments_search 
ON commitments USING gin(to_tsvector('english', title || ' ' || description));

-- 14. Add function for search
CREATE OR REPLACE FUNCTION search_commitments(
  search_query TEXT,
  page_size INTEGER DEFAULT 20,
  page_number INTEGER DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  author_name TEXT,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.description,
    c.created_at,
    p.name as author_name,
    ts_rank(to_tsvector('english', c.title || ' ' || c.description), plainto_tsquery('english', search_query)) as rank
  FROM commitments c
  JOIN profiles p ON c.user_id = p.id
  WHERE 
    c.public = true
    AND to_tsvector('english', c.title || ' ' || c.description) @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC, c.created_at DESC
  LIMIT page_size
  OFFSET (page_number - 1) * page_size;
END;
$$ LANGUAGE plpgsql;
