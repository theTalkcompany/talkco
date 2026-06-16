
-- =========================================================
-- WIPE existing room data (user approved)
-- =========================================================
DELETE FROM public.reports WHERE room_id IS NOT NULL;
DELETE FROM public.room_messages;
DELETE FROM public.room_participants;
DELETE FROM public.rooms;

-- =========================================================
-- ROOMS — extend
-- =========================================================
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS topic_tag text DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS age_band text NOT NULL DEFAULT 'all' CHECK (age_band IN ('teen','adult','all')),
  ADD COLUMN IF NOT EXISTS rules text DEFAULT '',
  ADD COLUMN IF NOT EXISTS privacy text NOT NULL DEFAULT 'open' CHECK (privacy IN ('open','approval')),
  ADD COLUMN IF NOT EXISTS pinned_announcement text,
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz NOT NULL DEFAULT now();

-- =========================================================
-- ROOM_PARTICIPANTS — extend with role + guidelines
-- =========================================================
ALTER TABLE public.room_participants
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin','co_admin','member')),
  ADD COLUMN IF NOT EXISTS agreed_to_guidelines boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS agreed_at timestamptz;

-- Ensure uniqueness so we can upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'room_participants_room_user_unique'
  ) THEN
    ALTER TABLE public.room_participants
      ADD CONSTRAINT room_participants_room_user_unique UNIQUE (room_id, user_id);
  END IF;
END $$;

-- =========================================================
-- ROOM_MESSAGES — extend with hidden flag
-- =========================================================
ALTER TABLE public.room_messages
  ADD COLUMN IF NOT EXISTS is_hidden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_reason text;

-- =========================================================
-- NEW: ROOM_JOIN_REQUESTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.room_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.room_join_requests TO authenticated;
GRANT ALL ON public.room_join_requests TO service_role;
ALTER TABLE public.room_join_requests ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- NEW: ROOM_BANS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.room_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  banned_by uuid,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.room_bans TO authenticated;
GRANT ALL ON public.room_bans TO service_role;
ALTER TABLE public.room_bans ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- NEW: ROOM_MESSAGE_REPORTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.room_message_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  message_id uuid NOT NULL,
  reported_by uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN ('harmful','bullying','crisis','spam','other')),
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.room_message_reports TO authenticated;
GRANT ALL ON public.room_message_reports TO service_role;
ALTER TABLE public.room_message_reports ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- Helper functions (SECURITY DEFINER → avoid RLS recursion)
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_room_admin(_room_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_participants
    WHERE room_id = _room_id AND user_id = _user_id AND role IN ('admin','co_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_room_member(_room_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_participants
    WHERE room_id = _room_id AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_room_banned(_room_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_bans WHERE room_id = _room_id AND user_id = _user_id
  );
$$;

-- Auto-create admin participant when room is created
CREATE OR REPLACE FUNCTION public.handle_new_room()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.room_participants (room_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin')
    ON CONFLICT (room_id, user_id) DO UPDATE SET role = 'admin';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_room_created ON public.rooms;
CREATE TRIGGER on_room_created
  AFTER INSERT ON public.rooms
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_room();

-- Bump room last_activity_at on new message
CREATE OR REPLACE FUNCTION public.bump_room_activity()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.rooms SET last_activity_at = now() WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_room_message_bump ON public.room_messages;
CREATE TRIGGER on_room_message_bump
  AFTER INSERT ON public.room_messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_room_activity();

-- =========================================================
-- RLS POLICIES — reset and rebuild
-- =========================================================

-- rooms
DROP POLICY IF EXISTS "Rooms readable to authenticated" ON public.rooms;
DROP POLICY IF EXISTS "Rooms insertable by authenticated" ON public.rooms;
DROP POLICY IF EXISTS "Rooms updatable by admins" ON public.rooms;
DROP POLICY IF EXISTS "Rooms deletable by admins" ON public.rooms;

CREATE POLICY "Rooms readable to authenticated" ON public.rooms
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Rooms insertable by authenticated" ON public.rooms
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Rooms updatable by admins" ON public.rooms
  FOR UPDATE TO authenticated USING (public.is_room_admin(id, auth.uid()));
CREATE POLICY "Rooms deletable by admins" ON public.rooms
  FOR DELETE TO authenticated USING (public.is_room_admin(id, auth.uid()));

-- room_participants
DROP POLICY IF EXISTS "Participants readable to authenticated" ON public.room_participants;
DROP POLICY IF EXISTS "Users can join open rooms" ON public.room_participants;
DROP POLICY IF EXISTS "Admins can manage participants" ON public.room_participants;
DROP POLICY IF EXISTS "Users can leave" ON public.room_participants;
DROP POLICY IF EXISTS "Users can update own participation" ON public.room_participants;

CREATE POLICY "Participants readable to authenticated" ON public.room_participants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can join open rooms" ON public.room_participants
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND NOT public.is_room_banned(room_id, auth.uid())
    AND (
      EXISTS (SELECT 1 FROM public.rooms r WHERE r.id = room_id AND r.privacy = 'open')
      OR public.is_room_admin(room_id, auth.uid())
    )
  );

CREATE POLICY "Admins can add participants" ON public.room_participants
  FOR INSERT TO authenticated WITH CHECK (public.is_room_admin(room_id, auth.uid()));

CREATE POLICY "Users can update own participation" ON public.room_participants
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can update participants" ON public.room_participants
  FOR UPDATE TO authenticated USING (public.is_room_admin(room_id, auth.uid()));

CREATE POLICY "Users can leave or admins can remove" ON public.room_participants
  FOR DELETE TO authenticated USING (
    auth.uid() = user_id OR public.is_room_admin(room_id, auth.uid())
  );

-- room_messages
DROP POLICY IF EXISTS "Messages readable to authenticated" ON public.room_messages;
DROP POLICY IF EXISTS "Members can post messages" ON public.room_messages;
DROP POLICY IF EXISTS "Authors can delete own messages" ON public.room_messages;
DROP POLICY IF EXISTS "Admins can update messages" ON public.room_messages;

CREATE POLICY "Messages readable to authenticated" ON public.room_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Members can post messages" ON public.room_messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id
    AND public.is_room_member(room_id, auth.uid())
    AND NOT public.is_room_banned(room_id, auth.uid())
  );

CREATE POLICY "Authors or admins can delete messages" ON public.room_messages
  FOR DELETE TO authenticated USING (
    auth.uid() = user_id OR public.is_room_admin(room_id, auth.uid())
  );

CREATE POLICY "Admins can update messages" ON public.room_messages
  FOR UPDATE TO authenticated USING (public.is_room_admin(room_id, auth.uid()));

-- room_join_requests
CREATE POLICY "Users see own requests; admins see all" ON public.room_join_requests
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR public.is_room_admin(room_id, auth.uid())
  );
CREATE POLICY "Users create own requests" ON public.room_join_requests
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND NOT public.is_room_banned(room_id, auth.uid())
  );
CREATE POLICY "Admins decide requests" ON public.room_join_requests
  FOR UPDATE TO authenticated USING (public.is_room_admin(room_id, auth.uid()));
CREATE POLICY "Users or admins delete requests" ON public.room_join_requests
  FOR DELETE TO authenticated USING (
    auth.uid() = user_id OR public.is_room_admin(room_id, auth.uid())
  );

-- room_bans
CREATE POLICY "Bans readable to room admins and banned user" ON public.room_bans
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR public.is_room_admin(room_id, auth.uid())
  );
CREATE POLICY "Admins create bans" ON public.room_bans
  FOR INSERT TO authenticated WITH CHECK (public.is_room_admin(room_id, auth.uid()));
CREATE POLICY "Admins remove bans" ON public.room_bans
  FOR DELETE TO authenticated USING (public.is_room_admin(room_id, auth.uid()));

-- room_message_reports
CREATE POLICY "Reporters see own; admins see all" ON public.room_message_reports
  FOR SELECT TO authenticated USING (
    auth.uid() = reported_by OR public.is_room_admin(room_id, auth.uid())
  );
CREATE POLICY "Authenticated can create reports" ON public.room_message_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "Admins update report status" ON public.room_message_reports
  FOR UPDATE TO authenticated USING (public.is_room_admin(room_id, auth.uid()));

-- =========================================================
-- REALTIME
-- =========================================================
DO $$
BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='room_messages';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages';
  END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='room_participants';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.room_participants';
  END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='room_join_requests';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.room_join_requests';
  END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='room_message_reports';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.room_message_reports';
  END IF;
END $$;

-- =========================================================
-- SEED starter rooms (created_by = first admin if any, else null)
-- =========================================================
DO $$
DECLARE
  admin_id uuid;
BEGIN
  SELECT user_id INTO admin_id FROM public.user_roles WHERE role = 'admin' ORDER BY created_at LIMIT 1;

  INSERT INTO public.rooms (name, description, created_by, age_min, age_max, age_band, topic_tag, rules, privacy)
  VALUES
    ('anxiety-support', 'A calm space to talk about anxiety, panic, and overwhelm.', admin_id, 18, 99, 'adult', 'anxiety',
      'Be kind. No medical advice. Trigger-warn intense content.', 'open'),
    ('teen-talk', 'For 13–17 year olds — vent, share, support each other.', admin_id, 13, 17, 'teen', 'general',
      'Be respectful. No personal contact info. No adult content.', 'approval'),
    ('low-mood', 'Gentle conversations about low mood and getting through the day.', admin_id, 13, 99, 'all', 'depression',
      'Listen first. Validate before advice. No glorifying self-harm.', 'open'),
    ('good-days', 'Share wins, small joys, and what helped today.', admin_id, 13, 99, 'all', 'positivity',
      'Keep it warm. No comparison or one-upping.', 'open');
END $$;
