-- SafeTag privacy fix
-- Problem: get_safety_tag() returned full PII (name, address, guardian phone,
-- medical notes) to ANY unauthenticated visitor who had a token. This defeats
-- the whole point of a "no personal data exposed" safety tag.
--
-- Fix: the public scan page now only confirms the tag is active and lets the
-- finder trigger a notification to the guardian, without ever seeing the
-- guardian's phone number, the traveller's exact identity, or where they're
-- staying. The guardian sees full details on their own authenticated
-- dashboard, same as before — only the PUBLIC scan flow changes.

-- 1. Remove public access to the old function that leaked everything.
REVOKE EXECUTE ON FUNCTION public.get_safety_tag(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_safety_tag(TEXT) FROM authenticated;

-- 2. Log of scan/notify events — lets the guardian see when + roughly where
--    their tag was scanned, without ever exposing their info to the finder.
CREATE TABLE IF NOT EXISTS public.safety_tag_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  safety_tag_id UUID NOT NULL REFERENCES public.safety_tags(id) ON DELETE CASCADE,
  finder_note TEXT,
  finder_contact TEXT,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.safety_tag_scans TO authenticated;
GRANT INSERT ON public.safety_tag_scans TO anon, authenticated;
GRANT ALL ON public.safety_tag_scans TO service_role;
ALTER TABLE public.safety_tag_scans ENABLE ROW LEVEL SECURITY;

-- Guardians can see scan events for their own tags.
CREATE POLICY "owner reads own tag scans" ON public.safety_tag_scans
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.safety_tags t
      WHERE t.id = safety_tag_id AND t.user_id = auth.uid()
    )
  );

-- Anyone can insert a scan event (that's the whole point — a stranger found
-- someone), but they can only ever insert, never read others' rows back.
CREATE POLICY "anyone can log a scan" ON public.safety_tag_scans
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 3. Minimal, non-identifying lookup — confirms the tag exists and is active,
--    returns only what's needed to reassure a finder, nothing that identifies
--    or locates the traveller or their guardian.
CREATE OR REPLACE FUNCTION public.check_safety_tag(_token TEXT)
RETURNS TABLE (
  tag_id UUID,
  category TEXT,
  is_active BOOLEAN
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT t.id, t.category, true
  FROM public.safety_tags t
  WHERE t.token = _token;
$$;
GRANT EXECUTE ON FUNCTION public.check_safety_tag(TEXT) TO anon, authenticated;

-- 4. Notify function — records that someone found the tagged person and
--    (in production) would trigger an SMS/push/email to the guardian via a
--    Supabase Edge Function or similar. It deliberately does NOT return any
--    guardian contact info to the caller.
CREATE OR REPLACE FUNCTION public.notify_safety_tag(_token TEXT, _finder_note TEXT DEFAULT NULL, _finder_contact TEXT DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _tag_id UUID;
BEGIN
  SELECT id INTO _tag_id FROM public.safety_tags WHERE token = _token;
  IF _tag_id IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.safety_tag_scans (safety_tag_id, finder_note, finder_contact)
  VALUES (_tag_id, _finder_note, _finder_contact);

  -- TODO (post-hackathon): trigger a real notification here, e.g.
  -- perform a pg_net / Edge Function call to send the guardian an SMS.
  -- Out of scope for the prototype — logging the event is what the
  -- demo/dashboard reads from.

  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.notify_safety_tag(TEXT, TEXT, TEXT) TO anon, authenticated;
