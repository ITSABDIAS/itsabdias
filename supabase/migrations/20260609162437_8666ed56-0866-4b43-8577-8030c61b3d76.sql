
DROP POLICY IF EXISTS "realtime_authenticated_user_scoped_topics" ON realtime.messages;

CREATE POLICY "realtime_authenticated_only"
ON realtime.messages
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);
