-- Apply after 01..16. Existing duplicate active commitments must be resolved
-- explicitly before deployment; never silently delete user records.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

DROP POLICY IF EXISTS "Anyone can view commitments" ON public.commitments;
CREATE POLICY "Public or owned commitments" ON public.commitments FOR SELECT
  TO anon, authenticated USING (is_public OR (select auth.uid()) = user_id);
DROP POLICY IF EXISTS "Anyone can view daily_progress" ON public.daily_progress;
CREATE POLICY "Public or owned progress" ON public.daily_progress FOR SELECT
  TO anon, authenticated USING (EXISTS (
    SELECT 1 FROM public.commitments c WHERE c.id = commitment_id
      AND (c.is_public OR c.user_id = (select auth.uid()))
  ));
ALTER VIEW public.commitments_feed SET (security_invoker = true);
GRANT SELECT ON public.commitments_feed TO anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

CREATE UNIQUE INDEX commitments_one_active_per_user
  ON public.commitments(user_id) WHERE status = 'active' AND user_id IS NOT NULL;
ALTER TABLE public.commitments ADD CONSTRAINT commitment_text_length
  CHECK (length(btrim(commitment_text)) BETWEEN 1 AND 140) NOT VALID;
ALTER TABLE public.commitments ADD CONSTRAINT commitment_daily_action_length
  CHECK (daily_action IS NOT NULL AND length(btrim(daily_action)) BETWEEN 1 AND 60) NOT VALID;
ALTER TABLE public.commitments ADD CONSTRAINT commitment_status
  CHECK (status IS NOT NULL AND status IN ('active', 'completed', 'abandoned')) NOT VALID;

-- Browser clients may edit content or record an outcome, never rewrite the
-- ownership, clock, visibility, or check-in evidence. Check-ins use one RPC.
REVOKE INSERT, UPDATE ON public.commitments FROM authenticated;
GRANT INSERT (user_id, founder_type, commitment_text, daily_action)
  ON public.commitments TO authenticated;
GRANT UPDATE (commitment_text, daily_action, status)
  ON public.commitments TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.daily_progress FROM authenticated;

CREATE FUNCTION private.commitment_rules() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := now();
    NEW.deadline := now() + interval '30 days';
    NEW.status := 'active';
    NEW.is_public := true;
    NEW.check_ins := '[]'::jsonb;
    NEW.days_completed := 0;
    NEW.completed := false;
    NEW.abandoned := false;
  ELSE
    IF NEW.commitment_text IS DISTINCT FROM OLD.commitment_text
       OR NEW.daily_action IS DISTINCT FROM OLD.daily_action THEN
      IF OLD.status <> 'active' OR now() >= OLD.created_at + interval '24 hours' THEN
        RAISE EXCEPTION 'The commitment edit window has closed';
      END IF;
      NEW.edited_at := now();
    END IF;
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      IF OLD.status <> 'active' OR NEW.status NOT IN ('completed', 'abandoned') THEN
        RAISE EXCEPTION 'Invalid commitment status transition';
      END IF;
      NEW.completed := NEW.status = 'completed';
      NEW.abandoned := NEW.status = 'abandoned';
      IF NEW.completed THEN NEW.completed_at := now(); END IF;
      IF NEW.abandoned THEN
        NEW.abandoned_at := now();
        NEW.abandoned_on_day := greatest(1, (now() AT TIME ZONE 'UTC')::date - (OLD.created_at AT TIME ZONE 'UTC')::date + 1);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.commitment_rules() FROM PUBLIC;
CREATE TRIGGER commitment_rules BEFORE INSERT OR UPDATE ON public.commitments
  FOR EACH ROW EXECUTE FUNCTION private.commitment_rules();

-- Deletion is deliberately available to owners for data removal. The UI must
-- not promise permanent retention when owner deletion and account cascade exist.
CREATE FUNCTION private.record_check_in(target_id uuid) RETURNS public.commitments
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  item public.commitments;
  day_index integer;
  today text := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
BEGIN
  SELECT * INTO item FROM public.commitments
    WHERE id = target_id AND user_id = auth.uid() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Commitment not found'; END IF;
  IF item.status <> 'active' OR now() > item.deadline THEN
    RAISE EXCEPTION 'Commitment is not active';
  END IF;
  day_index := (now() AT TIME ZONE 'UTC')::date - (item.created_at AT TIME ZONE 'UTC')::date + 1;
  IF day_index NOT BETWEEN 1 AND 30 THEN RAISE EXCEPTION 'Outside check-in window'; END IF;
  INSERT INTO public.daily_progress(commitment_id, day_number, completed, completed_at)
    VALUES (target_id, day_index, true, now()) ON CONFLICT (commitment_id, day_number) DO NOTHING;
  UPDATE public.commitments SET
    check_ins = CASE WHEN coalesce(check_ins, '[]'::jsonb) ? today THEN check_ins
      ELSE coalesce(check_ins, '[]'::jsonb) || to_jsonb(today) END,
    days_completed = (SELECT count(*) FROM public.daily_progress WHERE commitment_id = target_id AND completed)
    WHERE id = target_id RETURNING * INTO item;
  RETURN item;
END;
$$;
REVOKE ALL ON FUNCTION private.record_check_in(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.record_check_in(uuid) TO authenticated;
CREATE FUNCTION public.record_check_in(target_id uuid) RETURNS public.commitments
LANGUAGE sql SECURITY INVOKER SET search_path = '' AS $$ SELECT private.record_check_in(target_id); $$;
REVOKE ALL ON FUNCTION public.record_check_in(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_check_in(uuid) TO authenticated;

-- Email reservations are written before contacting the provider. A global
-- transaction lock makes the user, recipient and global limits atomic.
REVOKE ALL ON public.email_send_log FROM anon, authenticated;
GRANT SELECT ON public.email_send_log TO authenticated;
DROP POLICY IF EXISTS "Users can insert own email log" ON public.email_send_log;
ALTER TABLE public.email_send_log ADD COLUMN receipt_id uuid REFERENCES public.accountability_receipts(id) ON DELETE SET NULL;
ALTER TABLE public.email_send_log ADD COLUMN status text NOT NULL DEFAULT 'reserved'
  CHECK (status IN ('reserved', 'accepted', 'failed'));
CREATE UNIQUE INDEX email_receipt_once ON public.email_send_log(user_id, receipt_id, recipient);
GRANT SELECT, INSERT, UPDATE ON public.email_send_log TO service_role;

CREATE FUNCTION public.reserve_receipt_email(target_user uuid, target_receipt uuid, target_recipient text)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE reservation uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(725104);
  IF NOT EXISTS (SELECT 1 FROM public.accountability_receipts
    WHERE id = target_receipt AND user_id = target_user) THEN
    RAISE EXCEPTION 'Receipt not found';
  END IF;
  IF EXISTS (SELECT 1 FROM public.email_send_log WHERE user_id = target_user
    AND receipt_id = target_receipt AND recipient = target_recipient) THEN
    RAISE EXCEPTION 'Receipt already requested';
  END IF;
  IF (SELECT count(*) FROM public.email_send_log WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
      AND user_id = target_user) >= 5
    OR (SELECT count(*) FROM public.email_send_log WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'
      AND recipient = target_recipient) >= 5
    OR (SELECT count(*) FROM public.email_send_log WHERE created_at >= date_trunc('day', now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC') >= 100 THEN
    RAISE EXCEPTION 'Daily email limit reached';
  END IF;
  INSERT INTO public.email_send_log(user_id, receipt_id, recipient, subject)
    VALUES (target_user, target_receipt, target_recipient, 'FounderType accountability receipt') RETURNING id INTO reservation;
  RETURN reservation;
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_receipt_email(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_receipt_email(uuid, uuid, text) TO service_role;
