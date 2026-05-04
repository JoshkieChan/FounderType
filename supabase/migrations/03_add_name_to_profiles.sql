-- Add name field to profiles table for better user identification
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS name TEXT;

-- Update existing profiles with a default name if needed
UPDATE profiles 
SET name = 'Founder ' || SUBSTRING(id::text, 1, 8)
WHERE name IS NULL;
