-- Enable RLS on all tables
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;

-- Commitments table policies
DROP POLICY IF EXISTS "Anyone can view commitments" ON commitments;
DROP POLICY IF EXISTS "Users can insert own commitments" ON commitments;
DROP POLICY IF EXISTS "Users can update own commitments" ON commitments;
DROP POLICY IF EXISTS "Users can delete own commitments" ON commitments;
DROP POLICY IF EXISTS "Public commitments readable by all" ON commitments;
DROP POLICY IF EXISTS "Users manage own commitments" ON commitments;
DROP POLICY IF EXISTS "Anonymous users can insert commitments" ON commitments;
DROP POLICY IF EXISTS "Anyone can update anonymous commitments" ON commitments;

-- Allow anyone to read all public commitments (public feed)
CREATE POLICY "Anyone can view commitments"
  ON commitments FOR SELECT
  USING (is_public = true);

-- Only owner can insert their own commitments (allowing NULL user_id for anonymous commitments)
CREATE POLICY "Users can insert own commitments"
  ON commitments FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Only owner can update their own commitments
CREATE POLICY "Users can update own commitments"
  ON commitments FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Only owner can delete their own commitments
CREATE POLICY "Users can delete own commitments"
  ON commitments FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Daily progress table policies (mapping from prompt's 'check_ins' table)
DROP POLICY IF EXISTS "Anyone can view check-ins" ON daily_progress;
DROP POLICY IF EXISTS "Users can insert own check-ins" ON daily_progress;
DROP POLICY IF EXISTS "Progress readable for public commitments" ON daily_progress;
DROP POLICY IF EXISTS "Users manage progress for own commitments" ON daily_progress;

-- Anyone can read check-ins (to show progress on public commitments)
CREATE POLICY "Anyone can view daily_progress"
  ON daily_progress FOR SELECT
  USING (true);

-- Only commitment owner can insert check-ins
CREATE POLICY "Users can insert own check-ins"
  ON daily_progress FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM commitments 
      WHERE commitments.id = commitment_id 
      AND (commitments.user_id = auth.uid() OR commitments.user_id IS NULL)
    )
  );

-- Only commitment owner can update check-ins
CREATE POLICY "Users can update own check-ins"
  ON daily_progress FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM commitments 
      WHERE commitments.id = commitment_id 
      AND (commitments.user_id = auth.uid() OR commitments.user_id IS NULL)
    )
  );

-- Profiles table policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON profiles;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
