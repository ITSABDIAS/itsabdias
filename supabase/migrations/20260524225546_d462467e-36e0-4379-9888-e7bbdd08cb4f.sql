
-- 1. help_tickets: SELECT solo al dueño o staff
DROP POLICY IF EXISTS tickets_select_all ON public.help_tickets;
CREATE POLICY "tickets_select_own_or_staff" ON public.help_tickets
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'founder')
  );

-- 2. user_roles: SELECT solo propio o staff
DROP POLICY IF EXISTS user_roles_select_all ON public.user_roles;
CREATE POLICY "user_roles_select_own_or_staff" ON public.user_roles
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'founder')
  );

-- 3. Quitar tablas sensibles de realtime
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'help_tickets'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.help_tickets';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_roles'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.user_roles';
  END IF;
END $$;

-- 4. Límites de longitud
ALTER TABLE public.posts        ADD CONSTRAINT posts_content_len    CHECK (char_length(content) <= 2000) NOT VALID;
ALTER TABLE public.comments     ADD CONSTRAINT comments_content_len CHECK (char_length(content) <= 1000) NOT VALID;
ALTER TABLE public.help_tickets ADD CONSTRAINT tickets_title_len    CHECK (char_length(title)   <= 200)  NOT VALID;
ALTER TABLE public.help_tickets ADD CONSTRAINT tickets_body_len     CHECK (char_length(body)    <= 5000) NOT VALID;
ALTER TABLE public.profiles     ADD CONSTRAINT profiles_bio_len     CHECK (bio IS NULL OR char_length(bio) <= 300) NOT VALID;
ALTER TABLE public.profiles     ADD CONSTRAINT profiles_username_len CHECK (char_length(username) BETWEEN 1 AND 40) NOT VALID;
