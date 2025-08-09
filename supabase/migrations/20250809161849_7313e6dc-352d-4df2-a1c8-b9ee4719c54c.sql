-- Add display_name to profiles for public-facing alias
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Optional index to query by user_id quickly (if not exists already via unique)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_profiles_user_id'
  ) THEN
    CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
  END IF;
END $$;