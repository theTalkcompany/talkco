DROP POLICY IF EXISTS "Authenticated can broadcast to rooms they belong to" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can read room realtime they belong to" ON realtime.messages;

CREATE POLICY "Authenticated can broadcast to rooms they belong to"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (
  CASE
    WHEN realtime.topic() LIKE 'room:%' THEN (
      public.is_room_member((SUBSTRING(realtime.topic() FROM 6))::uuid, auth.uid())
      OR public.is_room_admin((SUBSTRING(realtime.topic() FROM 6))::uuid, auth.uid())
    )
    ELSE false
  END
);

CREATE POLICY "Authenticated can read room realtime they belong to"
ON realtime.messages FOR SELECT TO authenticated
USING (
  CASE
    WHEN realtime.topic() LIKE 'room:%' THEN (
      public.is_room_member((SUBSTRING(realtime.topic() FROM 6))::uuid, auth.uid())
      OR public.is_room_admin((SUBSTRING(realtime.topic() FROM 6))::uuid, auth.uid())
    )
    ELSE false
  END
);