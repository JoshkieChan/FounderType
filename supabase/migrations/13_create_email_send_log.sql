CREATE TABLE IF NOT EXISTS email_send_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE email_send_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON email_send_log FROM anon;
GRANT SELECT, INSERT ON email_send_log TO authenticated;

DROP POLICY IF EXISTS "Users can view own email log" ON email_send_log;
CREATE POLICY "Users can view own email log"
  ON email_send_log FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own email log" ON email_send_log;
CREATE POLICY "Users can insert own email log"
  ON email_send_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_email_send_log_user_created
  ON email_send_log(user_id, created_at DESC);
