-- Internal helper: only used inside other SECURITY DEFINER staff functions.
REVOKE ALL ON FUNCTION public.is_founder(uuid) FROM PUBLIC, anon, authenticated;

-- Trigger-only functions must never be callable through the API.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.after_dm_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_on_follow() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_premium_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tutorial_comments_counter() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tutorial_likes_counter() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tutorial_saves_counter() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.academy_sync_lessons_count() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.academy_sync_students_count() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_notification(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;

-- Anonymous visitors must not reach any authenticated-only helper.
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin_or_higher(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_moderator_or_higher(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_premium(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_activity(integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.touch_last_seen() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.check_rank_unlocks(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_or_create_conversation(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.academy_enroll(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.academy_complete_lesson(uuid, integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_assign_role(uuid, public.app_role, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_revoke_role(uuid, public.app_role, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_grant_premium(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_revoke_premium(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_set_user_status(uuid, public.user_status_type, timestamptz, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_broadcast_notification(text, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_create_announcement(text, text, text, text, timestamptz) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_deactivate_announcement(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_delete_content(text, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.staff_feature_content(text, uuid, boolean, text) FROM PUBLIC, anon;

-- Keep required grants for authenticated app flows.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_higher(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_moderator_or_higher(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_premium(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_activity(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.touch_last_seen() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_rank_unlocks(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.academy_enroll(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.academy_complete_lesson(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_assign_role(uuid, public.app_role, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_revoke_role(uuid, public.app_role, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_grant_premium(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_revoke_premium(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_set_user_status(uuid, public.user_status_type, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_broadcast_notification(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_create_announcement(text, text, text, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_deactivate_announcement(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_delete_content(text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_feature_content(text, uuid, boolean, text) TO authenticated;

-- Intentionally public endpoints.
GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_news_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_tutorial_view(uuid) TO anon, authenticated;