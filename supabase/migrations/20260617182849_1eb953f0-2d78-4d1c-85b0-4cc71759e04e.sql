
-- Public stats for landing page
CREATE OR REPLACE FUNCTION public.get_letters_stats()
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'available', (SELECT count(*) FROM public.letters WHERE status = 'available'),
    'pending',   (SELECT count(*) FROM public.letters WHERE status = 'held_for_review'),
    'delivered', (SELECT count(*) FROM public.letters WHERE status = 'delivered')
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_letters_stats() TO anon, authenticated;

-- Helper: is the caller the demo reviewer or an admin?
CREATE OR REPLACE FUNCTION public.is_letters_reviewer()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid() AND email = 'demo@talkco.app'
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_letters_reviewer() TO authenticated;

-- List pending letters for the moderation queue
CREATE OR REPLACE FUNCTION public.admin_list_pending_letters()
RETURNS SETOF public.letters
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_letters_reviewer() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY
    SELECT * FROM public.letters
    WHERE status = 'held_for_review'
    ORDER BY created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_pending_letters() TO authenticated;

-- Moderate a letter: approve | reject | flag
CREATE OR REPLACE FUNCTION public.admin_moderate_letter(_letter_id uuid, _action text)
RETURNS public.letters
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated public.letters;
BEGIN
  IF NOT public.is_letters_reviewer() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF _action = 'approve' THEN
    UPDATE public.letters
       SET status = 'available'
     WHERE id = _letter_id
    RETURNING * INTO updated;
  ELSIF _action = 'reject' THEN
    UPDATE public.letters
       SET status = 'removed'
     WHERE id = _letter_id
    RETURNING * INTO updated;
  ELSIF _action = 'flag' THEN
    UPDATE public.letters
       SET status = 'held_for_review',
           flagged_keywords = COALESCE(flagged_keywords, ARRAY[]::text[]) || ARRAY['welfare_check']
     WHERE id = _letter_id
    RETURNING * INTO updated;
  ELSE
    RAISE EXCEPTION 'Unknown action: %', _action;
  END IF;

  RETURN updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_moderate_letter(uuid, text) TO authenticated;
