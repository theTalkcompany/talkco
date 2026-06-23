
-- 1) Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated/PUBLIC,
--    re-grant only to the roles that actually need to call them.

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.calculate_age(date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_role_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_role_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_user_banned(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_security_events() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_warnings_count(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.detect_suspicious_ips() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enhanced_role_change_audit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_backup_admin_activation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_masked_profile(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_room_admin(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_room_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_room_banned(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_room() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bump_room_activity() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_letters_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_letters_reviewer() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_list_pending_letters() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_display_name_available(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_letter() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_random_letter() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_moderate_letter(uuid, text) FROM PUBLIC, anon, authenticated;

-- Re-grant only what the app calls directly via PostgREST RPC:
GRANT EXECUTE ON FUNCTION public.is_display_name_available(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_letters_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_random_letter() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_pending_letters() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_moderate_letter(uuid, text) TO authenticated;

-- Helpers that are referenced from RLS policies run as the definer regardless of
-- the caller's EXECUTE grant, so anon/authenticated do not need direct access.


-- 2) Restrict permissive INSERT-true policies on logging tables to the
--    server-side roles that actually write them.

DROP POLICY IF EXISTS "System can insert moderation logs" ON public.content_moderation_logs;
CREATE POLICY "Service role inserts moderation logs"
  ON public.content_moderation_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can log security events" ON public.security_events;
CREATE POLICY "Authenticated users log own security events"
  ON public.security_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "Service role logs security events"
  ON public.security_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);


-- 3) Tighten room_join_requests SELECT policy: split into two clearly-scoped
--    policies so admins can only see requests for rooms they actually admin.

DROP POLICY IF EXISTS "Users see own requests; admins see all" ON public.room_join_requests;

CREATE POLICY "Users see own join requests"
  ON public.room_join_requests
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Room admins see join requests for their room"
  ON public.room_join_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.room_participants rp
      WHERE rp.room_id = room_join_requests.room_id
        AND rp.user_id = auth.uid()
        AND rp.role IN ('admin','co_admin')
    )
  );


-- 4) Prevent listing of the avatars bucket. Files remain publicly readable via
--    the public bucket CDN (getPublicUrl) without needing a SELECT policy on
--    storage.objects.

DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
