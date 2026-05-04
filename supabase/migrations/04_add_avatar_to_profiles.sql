-- Add avatar_url field to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;
