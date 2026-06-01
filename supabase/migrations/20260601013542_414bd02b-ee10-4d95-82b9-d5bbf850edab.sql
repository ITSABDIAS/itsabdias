
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id) WHERE read = false;

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND user_id = (SELECT n.user_id FROM public.notifications n WHERE n.id = notifications.id));

CREATE POLICY notifications_delete_own ON public.notifications
  FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Helper to create a notification (callable by SECURITY DEFINER functions / service role only)
CREATE OR REPLACE FUNCTION public.create_notification(_user_id uuid, _type text, _title text, _body text DEFAULT NULL, _link text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE nid uuid;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (_user_id, _type, _title, _body, _link)
  RETURNING id INTO nid;
  RETURN nid;
END;
$$;

REVOKE ALL ON FUNCTION public.create_notification(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, text) TO service_role;

-- Extend check_rank_unlocks to also create notifications for each new rank
CREATE OR REPLACE FUNCTION public.check_rank_unlocks(_user_id uuid)
RETURNS app_role[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  target uuid;
  granted app_role[] := ARRAY[]::app_role[];
  total_s integer;
  proj_count integer;
  ai_count integer;
  r app_role;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  target := uid;

  SELECT COALESCE(total_seconds, 0) INTO total_s FROM public.user_activity WHERE user_id = target;

  IF COALESCE(total_s,0) >= 1800
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target AND role = 'member'::app_role) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (target, 'member'::app_role) ON CONFLICT DO NOTHING;
    granted := array_append(granted, 'member'::app_role);
  END IF;

  SELECT COUNT(*) INTO proj_count FROM public.projects WHERE user_id = target;
  IF COALESCE(proj_count,0) >= 5
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target AND role = 'developer'::app_role) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (target, 'developer'::app_role) ON CONFLICT DO NOTHING;
    granted := array_append(granted, 'developer'::app_role);
  END IF;

  SELECT COUNT(*) INTO ai_count FROM public.projects WHERE user_id = target AND category = 'IA';
  IF COALESCE(ai_count,0) >= 3
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target AND role = 'ai_expert'::app_role) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (target, 'ai_expert'::app_role) ON CONFLICT DO NOTHING;
    granted := array_append(granted, 'ai_expert'::app_role);
  END IF;

  -- Create notifications for each newly granted rank
  FOREACH r IN ARRAY granted LOOP
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (target, 'rank_unlock', 'Nuevo rango desbloqueado', '¡Has desbloqueado el rango ' || r::text || '!', '/profile');
  END LOOP;

  RETURN granted;
END;
$$;
