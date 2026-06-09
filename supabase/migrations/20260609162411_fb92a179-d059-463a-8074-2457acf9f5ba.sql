
-- 1. Restrictive policy on user_roles: only staff (admin/founder) can ever insert role rows.
-- This closes any future accidental permissive gap for regular users.
CREATE POLICY "user_roles_insert_staff_only_restrictive"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'founder'::app_role)
);

-- 2. Restrictive policy on chat_messages: forbid all UPDATEs (messages are immutable).
CREATE POLICY "chat_messages_no_update_restrictive"
ON public.chat_messages
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- 3. Realtime channel authorization: deny-by-default and only allow authenticated users
-- to subscribe to topics scoped to their own user id (topic format: "user:<uuid>" or "notifications:<uuid>").
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "realtime_authenticated_user_scoped_topics" ON realtime.messages;
CREATE POLICY "realtime_authenticated_user_scoped_topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    realtime.topic() = ('user:' || auth.uid()::text)
    OR realtime.topic() = ('notifications:' || auth.uid()::text)
    OR realtime.topic() LIKE 'public:%'
  )
);
