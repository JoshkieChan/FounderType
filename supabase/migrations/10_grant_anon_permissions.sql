-- Grant INSERT, UPDATE, and DELETE permissions to anonymous users
-- RLS policies will still restrict these to only rows where user_id IS NULL
GRANT INSERT, UPDATE, DELETE ON commitments TO anon;
GRANT INSERT, UPDATE, DELETE ON daily_progress TO anon;
GRANT INSERT, UPDATE, DELETE ON profiles TO anon;

-- Also ensure the sequences for IDs are usable by anon if they weren't using UUIDs
-- (We use UUIDs so this is mostly for completeness)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
