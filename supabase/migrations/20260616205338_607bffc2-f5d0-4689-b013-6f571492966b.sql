
-- Reactions table
CREATE TABLE IF NOT EXISTS public.room_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  message_id uuid NOT NULL REFERENCES public.room_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_message_reactions TO authenticated;
GRANT ALL ON public.room_message_reactions TO service_role;

ALTER TABLE public.room_message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view reactions"
  ON public.room_message_reactions FOR SELECT TO authenticated
  USING (public.is_room_member(room_id, auth.uid()));

CREATE POLICY "Members can add their own reactions"
  ON public.room_message_reactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_room_member(room_id, auth.uid()));

CREATE POLICY "Users can remove their own reactions"
  ON public.room_message_reactions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Track per-user read state for unread indicator
ALTER TABLE public.room_participants
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz NOT NULL DEFAULT now();

-- Enable realtime for reactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_message_reactions;
