CREATE TABLE public.letter_moderation_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  letter_id uuid NOT NULL REFERENCES public.letters(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  action text NOT NULL CHECK (action IN ('approve','reject')),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.letter_moderation_tokens TO service_role;

ALTER TABLE public.letter_moderation_tokens ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_letter_moderation_tokens_token ON public.letter_moderation_tokens(token);