-- Create commitments table
CREATE TABLE IF NOT EXISTS commitments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_type TEXT NOT NULL,
  commitment_text TEXT NOT NULL,
  deadline TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_public BOOLEAN DEFAULT true,
  check_ins JSONB DEFAULT '[]',
  completed BOOLEAN DEFAULT false,
  abandoned BOOLEAN DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;

-- Grant API access to anon and authenticated roles
GRANT SELECT ON commitments TO anon;
GRANT ALL ON commitments TO authenticated;

-- Public commitments are readable by everyone (including anon/unauthenticated users)
CREATE POLICY "Public commitments readable by all"
  ON commitments FOR SELECT
  USING (is_public = true);

-- Authenticated users can fully manage their own commitments
CREATE POLICY "Users manage own commitments"
  ON commitments FOR ALL
  USING (auth.uid() = user_id);

-- Index for fast public feed queries
CREATE INDEX IF NOT EXISTS idx_commitments_is_public_created_at
  ON commitments (is_public, created_at DESC);

-- Index for fast user-specific queries
CREATE INDEX IF NOT EXISTS idx_commitments_user_id
  ON commitments (user_id);
