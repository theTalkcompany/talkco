
-- Case-insensitive unique constraint on display_name
CREATE UNIQUE INDEX IF NOT EXISTS profiles_display_name_unique_ci
  ON public.profiles (lower(display_name))
  WHERE display_name IS NOT NULL;

-- RPC to check display name availability (callable by anon during signup)
CREATE OR REPLACE FUNCTION public.is_display_name_available(_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE lower(display_name) = lower(trim(_name))
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_display_name_available(text) TO anon, authenticated;
