
-- 1. Trigger-only functions: not callable from the API at all
REVOKE EXECUTE ON FUNCTION public.academy_sync_lessons_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.academy_sync_students_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.after_dm_insert() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_premium_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tutorial_comments_counter() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tutorial_likes_counter() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tutorial_saves_counter() FROM PUBLIC, anon, authenticated;

-- 2. Staff/admin + user-scoped functions: authenticated only (they enforce roles internally)
REVOKE EXECUTE ON FUNCTION public.staff_assign_role(uuid, app_role, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_revoke_role(uuid, app_role, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_grant_premium(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_revoke_premium(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_set_user_status(uuid, user_status_type, timestamptz, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_delete_content(text, uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_feature_content(text, uuid, boolean, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_create_announcement(text, text, text, text, timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_deactivate_announcement(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_broadcast_notification(text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.academy_enroll(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.academy_complete_lesson(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.touch_last_seen() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_premium(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_higher(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_founder(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_moderator_or_higher(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_rank_unlocks(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_activity(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_follow() FROM PUBLIC, anon, authenticated;

-- 3. Public-facing helpers stay callable but without the blanket PUBLIC grant
REVOKE EXECUTE ON FUNCTION public.increment_news_view(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_tutorial_view(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.verify_certificate(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_news_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_tutorial_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;

-- 4. Public bucket: files stay reachable by direct public URL, but no bulk listing
DROP POLICY IF EXISTS "project_images_public_read" ON storage.objects;
CREATE POLICY "project_images_owner_read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'project-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 5. subscriptions: explicit deny of client-side deletes
DROP POLICY IF EXISTS "subscriptions no client delete" ON public.subscriptions;
CREATE POLICY "subscriptions no client delete" ON public.subscriptions
FOR DELETE TO authenticated
USING (false);

-- 6. user_activity: writes only for own row (RPC record_activity remains the normal path)
DROP POLICY IF EXISTS "user_activity insert own" ON public.user_activity;
CREATE POLICY "user_activity insert own" ON public.user_activity
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_activity update own" ON public.user_activity;
CREATE POLICY "user_activity update own" ON public.user_activity
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 7. Realtime already has RLS enabled with an authenticated-only policy.
