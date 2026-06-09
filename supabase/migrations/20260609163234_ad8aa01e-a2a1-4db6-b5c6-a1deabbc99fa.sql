
-- 1. Banner column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- 2. Case-insensitive unique username index (for /u/username lookups)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique ON public.profiles (LOWER(username));

-- 3. Follows table
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS follows_following_idx ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.follows(follower_id);

GRANT SELECT ON public.follows TO anon, authenticated;
GRANT INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows_select_all" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert_own" ON public.follows FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete_own" ON public.follows FOR DELETE TO authenticated
  USING (auth.uid() = follower_id);

-- 4. Notification on follow
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_name TEXT;
BEGIN
  SELECT username INTO follower_name FROM public.profiles WHERE id = NEW.follower_id;
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    NEW.following_id,
    'follow',
    'Nuevo seguidor',
    COALESCE(follower_name, 'Alguien') || ' empezó a seguirte.',
    '/u/' || COALESCE(follower_name, '')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS follows_notify_trigger ON public.follows;
CREATE TRIGGER follows_notify_trigger
  AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- 5. Premium for founder ITSABDIAS
INSERT INTO public.subscriptions (user_id, plan, status, started_at, expires_at)
VALUES (
  '399c84d4-4438-49a4-8558-0e1b56ec76b5',
  'premium',
  'active',
  now(),
  now() + INTERVAL '100 years'
)
ON CONFLICT (user_id) DO UPDATE
  SET plan = 'premium',
      status = 'active',
      started_at = COALESCE(public.subscriptions.started_at, now()),
      expires_at = now() + INTERVAL '100 years',
      updated_at = now();
