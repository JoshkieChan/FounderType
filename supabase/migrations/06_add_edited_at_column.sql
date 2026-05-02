-- Add edited_at column to commitments table
ALTER TABLE commitments 
ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;
