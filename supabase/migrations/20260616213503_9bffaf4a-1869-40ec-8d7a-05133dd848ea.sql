
-- letters table
CREATE TABLE public.letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  opening text NOT NULL DEFAULT 'Dear Stranger,',
  body text NOT NULL,
  closing text,
  word_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available',
  delivered_to uuid,
  delivered_at timestamptz,
  flagged_keywords text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.letters TO authenticated;
GRANT ALL ON public.letters TO service_role;

ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors can view own letters"
  ON public.letters FOR SELECT TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Recipients can view their delivered letters"
  ON public.letters FOR SELECT TO authenticated
  USING (delivered_to = auth.uid());

CREATE POLICY "Admins can view all letters"
  ON public.letters FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can write their own letters"
  ON public.letters FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Admins can update letters"
  ON public.letters FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE INDEX letters_status_idx ON public.letters(status);
CREATE INDEX letters_author_idx ON public.letters(author_id);
CREATE INDEX letters_delivered_to_idx ON public.letters(delivered_to);

CREATE TRIGGER letters_updated_at
  BEFORE UPDATE ON public.letters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- validation trigger: word count + crisis keyword hold
CREATE OR REPLACE FUNCTION public.validate_letter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lower_body text;
  crisis_terms text[] := ARRAY[
    'kill myself','kill me','end my life','want to die','wanna die',
    'suicide','suicidal','self harm','self-harm','hurt myself','cut myself',
    'don''t want to be here','dont want to be here','no reason to live','better off dead'
  ];
  term text;
  found text[] := ARRAY[]::text[];
BEGIN
  NEW.word_count := array_length(regexp_split_to_array(trim(NEW.body), '\s+'), 1);
  IF NEW.word_count IS NULL THEN NEW.word_count := 0; END IF;

  lower_body := lower(coalesce(NEW.body,'') || ' ' || coalesce(NEW.closing,''));
  FOREACH term IN ARRAY crisis_terms LOOP
    IF position(term IN lower_body) > 0 THEN
      found := array_append(found, term);
    END IF;
  END LOOP;

  IF array_length(found,1) > 0 THEN
    NEW.flagged_keywords := found;
    NEW.status := 'held_for_review';
  ELSIF NEW.word_count < 30 THEN
    NEW.status := 'held_for_review';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER letters_validate
  BEFORE INSERT ON public.letters
  FOR EACH ROW EXECUTE FUNCTION public.validate_letter();

-- saved_letters
CREATE TABLE public.saved_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  letter_id uuid NOT NULL REFERENCES public.letters(id) ON DELETE CASCADE,
  saved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, letter_id)
);

GRANT SELECT, INSERT, DELETE ON public.saved_letters TO authenticated;
GRANT ALL ON public.saved_letters TO service_role;

ALTER TABLE public.saved_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their saved letters"
  ON public.saved_letters FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- atomic claim function
CREATE OR REPLACE FUNCTION public.claim_random_letter()
RETURNS public.letters
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  picked public.letters;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  WITH candidate AS (
    SELECT id FROM public.letters
    WHERE status = 'available'
      AND author_id <> auth.uid()
    ORDER BY random()
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.letters l
     SET status = 'delivered',
         delivered_to = auth.uid(),
         delivered_at = now()
    FROM candidate c
   WHERE l.id = c.id
   RETURNING l.* INTO picked;

  RETURN picked;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_random_letter() TO authenticated;
