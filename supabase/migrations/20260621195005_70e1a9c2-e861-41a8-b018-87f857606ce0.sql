-- 1. room_messages: replace permissive SELECT policies with membership-scoped policy
DROP POLICY IF EXISTS "Messages readable to authenticated" ON public.room_messages;
DROP POLICY IF EXISTS "Authenticated users can view room messages" ON public.room_messages;

CREATE POLICY "Members can view room messages"
ON public.room_messages
FOR SELECT
TO authenticated
USING (
  public.is_room_member(room_id, auth.uid())
  OR public.is_room_admin(room_id, auth.uid())
);

-- 2. room_participants: replace permissive SELECT policies with membership-scoped policy
DROP POLICY IF EXISTS "Participants readable to authenticated" ON public.room_participants;
DROP POLICY IF EXISTS "Authenticated users can view room participants" ON public.room_participants;

CREATE POLICY "Members can view room participants"
ON public.room_participants
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_room_member(room_id, auth.uid())
  OR public.is_room_admin(room_id, auth.uid())
);

-- 3. Realtime channel authorization: only allow subscriptions to room:<room_id> topics
--    for users who are members or admins of that room. This prevents broadcast leakage
--    from private rooms (room_messages and room_message_reports change events).
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read room realtime they belong to" ON realtime.messages;
CREATE POLICY "Authenticated can read room realtime they belong to"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Allow non room: topics through; restrict room:<uuid> topics to members
  CASE
    WHEN (realtime.topic())::text LIKE 'room:%' THEN
      public.is_room_member(
        ((substring((realtime.topic())::text from 6))::uuid),
        auth.uid()
      )
      OR public.is_room_admin(
        ((substring((realtime.topic())::text from 6))::uuid),
        auth.uid()
      )
    ELSE true
  END
);

DROP POLICY IF EXISTS "Authenticated can broadcast to rooms they belong to" ON realtime.messages;
CREATE POLICY "Authenticated can broadcast to rooms they belong to"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  CASE
    WHEN (realtime.topic())::text LIKE 'room:%' THEN
      public.is_room_member(
        ((substring((realtime.topic())::text from 6))::uuid),
        auth.uid()
      )
      OR public.is_room_admin(
        ((substring((realtime.topic())::text from 6))::uuid),
        auth.uid()
      )
    ELSE true
  END
);