
-- ============================================================
-- STAFF PERMISSIONS SYSTEM
-- ============================================================

-- 1. Add columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS joined_staff_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- 2. Enum for staff actions
DO $$ BEGIN
  CREATE TYPE public.staff_action_type AS ENUM (
    'assign_admin','remove_admin',
    'assign_moderator','remove_moderator',
    'assign_verified','remove_verified',
    'grant_premium','revoke_premium',
    'suspend_user','unsuspend_user',
    'ban_user','unban_user',
    'mute_user','unmute_user',
    'delete_post','delete_project','delete_tutorial','delete_comment',
    'feature_post','feature_project','feature_tutorial',
    'unfeature_post','unfeature_project','unfeature_tutorial',
    'hide_content','unhide_content',
    'send_announcement','send_notification_broadcast'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.user_status_type AS ENUM ('active','muted','suspended','banned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. user_status table
CREATE TABLE IF NOT EXISTS public.user_status (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.user_status_type NOT NULL DEFAULT 'active',
  reason TEXT,
  until TIMESTAMPTZ,
  set_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_status TO anon, authenticated;
GRANT ALL ON public.user_status TO service_role;
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_status_read_all" ON public.user_status;
CREATE POLICY "user_status_read_all" ON public.user_status FOR SELECT USING (true);
-- writes go through RPC only

-- 4. staff_actions history
CREATE TABLE IF NOT EXISTS public.staff_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action public.staff_action_type NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_content_type TEXT,
  target_content_id UUID,
  reason TEXT,
  result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS staff_actions_actor_idx ON public.staff_actions(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS staff_actions_target_idx ON public.staff_actions(target_user_id, created_at DESC);
GRANT SELECT ON public.staff_actions TO authenticated;
GRANT ALL ON public.staff_actions TO service_role;
ALTER TABLE public.staff_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_actions_admin_read" ON public.staff_actions;
CREATE POLICY "staff_actions_admin_read" ON public.staff_actions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'founder') OR public.has_role(auth.uid(),'admin') OR actor_id = auth.uid());

-- 5. announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  level TEXT NOT NULL DEFAULT 'info',
  audience TEXT NOT NULL DEFAULT 'all',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.announcements TO anon, authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "announcements_read" ON public.announcements;
CREATE POLICY "announcements_read" ON public.announcements FOR SELECT USING (active = true);

-- 6. Helper role functions
CREATE OR REPLACE FUNCTION public.is_founder(_uid UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_uid AND role='founder'::app_role);
$$;

CREATE OR REPLACE FUNCTION public.is_admin_or_higher(_uid UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_uid AND role IN ('founder'::app_role,'admin'::app_role));
$$;

CREATE OR REPLACE FUNCTION public.is_moderator_or_higher(_uid UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_uid AND role IN ('founder'::app_role,'admin'::app_role,'moderator'::app_role));
$$;

-- 7. Assign role RPC
CREATE OR REPLACE FUNCTION public.staff_assign_role(_target UUID, _role app_role, _reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  actor UUID := auth.uid();
  action_name public.staff_action_type;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF actor = _target THEN RAISE EXCEPTION 'No puedes asignarte permisos a ti mismo'; END IF;
  IF _role = 'founder'::app_role THEN RAISE EXCEPTION 'No se puede asignar el rango Founder'; END IF;

  -- authorization
  IF _role = 'admin'::app_role THEN
    IF NOT public.is_founder(actor) THEN RAISE EXCEPTION 'Solo el Founder puede asignar Administradores'; END IF;
    action_name := 'assign_admin';
  ELSIF _role = 'moderator'::app_role THEN
    IF NOT public.is_admin_or_higher(actor) THEN RAISE EXCEPTION 'Solo Admin+ puede asignar Moderadores'; END IF;
    action_name := 'assign_moderator';
  ELSIF _role = 'verified'::app_role THEN
    IF NOT public.is_admin_or_higher(actor) THEN RAISE EXCEPTION 'Solo Admin+ puede asignar Verificado'; END IF;
    action_name := 'assign_verified';
  ELSE
    RAISE EXCEPTION 'Rol no gestionable por staff';
  END IF;

  INSERT INTO public.user_roles(user_id, role) VALUES (_target, _role) ON CONFLICT DO NOTHING;
  UPDATE public.profiles SET joined_staff_at = COALESCE(joined_staff_at, now()) WHERE id = _target;

  INSERT INTO public.staff_actions(actor_id, action, target_user_id, reason, result)
  VALUES (actor, action_name, _target, _reason, 'ok');

  INSERT INTO public.notifications(user_id, type, title, body, link)
  VALUES (_target, 'rank_grant', 'Nuevo rango asignado',
    'Has recibido el rango ' || _role::text || COALESCE(' — ' || _reason, ''), '/profile');
END; $$;

-- 8. Revoke role RPC
CREATE OR REPLACE FUNCTION public.staff_revoke_role(_target UUID, _role app_role, _reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  actor UUID := auth.uid();
  action_name public.staff_action_type;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _role = 'founder'::app_role THEN RAISE EXCEPTION 'No se puede quitar el rango Founder'; END IF;

  IF _role = 'admin'::app_role THEN
    IF NOT public.is_founder(actor) THEN RAISE EXCEPTION 'Solo el Founder puede quitar Administradores'; END IF;
    action_name := 'remove_admin';
  ELSIF _role = 'moderator'::app_role THEN
    IF NOT public.is_admin_or_higher(actor) THEN RAISE EXCEPTION 'Solo Admin+ puede quitar Moderadores'; END IF;
    action_name := 'remove_moderator';
  ELSIF _role = 'verified'::app_role THEN
    IF NOT public.is_admin_or_higher(actor) THEN RAISE EXCEPTION 'Solo Admin+ puede quitar Verificado'; END IF;
    action_name := 'remove_verified';
  ELSE
    RAISE EXCEPTION 'Rol no gestionable por staff';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _target AND role = _role;

  INSERT INTO public.staff_actions(actor_id, action, target_user_id, reason, result)
  VALUES (actor, action_name, _target, _reason, 'ok');

  INSERT INTO public.notifications(user_id, type, title, body, link)
  VALUES (_target, 'rank_revoke', 'Rango retirado',
    'Se retiró tu rango ' || _role::text || COALESCE(' — ' || _reason, ''), '/profile');
END; $$;

-- 9. Grant premium (founder only)
CREATE OR REPLACE FUNCTION public.staff_grant_premium(_target UUID, _reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE actor UUID := auth.uid();
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_founder(actor) THEN RAISE EXCEPTION 'Solo el Founder puede asignar Premium manualmente'; END IF;
  INSERT INTO public.subscriptions(user_id, plan, status)
    VALUES (_target, 'premium', 'active')
    ON CONFLICT (user_id) DO UPDATE SET plan='premium', status='active', updated_at=now();
  INSERT INTO public.staff_actions(actor_id, action, target_user_id, reason, result)
    VALUES (actor,'grant_premium',_target,_reason,'ok');
  INSERT INTO public.notifications(user_id,type,title,body,link)
    VALUES (_target,'premium_grant','Premium activado','Se te otorgó acceso Premium','/premium');
END; $$;

CREATE OR REPLACE FUNCTION public.staff_revoke_premium(_target UUID, _reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE actor UUID := auth.uid();
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_founder(actor) THEN RAISE EXCEPTION 'Solo el Founder puede quitar Premium'; END IF;
  UPDATE public.subscriptions SET status='cancelled', updated_at=now() WHERE user_id=_target;
  INSERT INTO public.staff_actions(actor_id, action, target_user_id, reason, result)
    VALUES (actor,'revoke_premium',_target,_reason,'ok');
END; $$;

-- 10. User status (suspend / ban / mute)
CREATE OR REPLACE FUNCTION public.staff_set_user_status(
  _target UUID, _status public.user_status_type, _until TIMESTAMPTZ DEFAULT NULL, _reason TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  actor UUID := auth.uid();
  action_name public.staff_action_type;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF actor = _target THEN RAISE EXCEPTION 'No puedes cambiar tu propio estado'; END IF;
  IF public.is_founder(_target) THEN RAISE EXCEPTION 'No se puede modificar al Founder'; END IF;

  IF _status = 'banned' THEN
    IF NOT public.is_admin_or_higher(actor) THEN RAISE EXCEPTION 'Solo Admin+ puede banear'; END IF;
    action_name := 'ban_user';
  ELSIF _status = 'suspended' THEN
    IF NOT public.is_admin_or_higher(actor) THEN RAISE EXCEPTION 'Solo Admin+ puede suspender'; END IF;
    action_name := 'suspend_user';
  ELSIF _status = 'muted' THEN
    IF NOT public.is_moderator_or_higher(actor) THEN RAISE EXCEPTION 'Solo Mod+ puede silenciar'; END IF;
    action_name := 'mute_user';
  ELSIF _status = 'active' THEN
    IF NOT public.is_moderator_or_higher(actor) THEN RAISE EXCEPTION 'No autorizado'; END IF;
    action_name := 'unsuspend_user';
  ELSE
    RAISE EXCEPTION 'Estado inválido';
  END IF;

  INSERT INTO public.user_status(user_id,status,reason,until,set_by,updated_at)
  VALUES (_target,_status,_reason,_until,actor,now())
  ON CONFLICT (user_id) DO UPDATE
    SET status=EXCLUDED.status, reason=EXCLUDED.reason, until=EXCLUDED.until, set_by=EXCLUDED.set_by, updated_at=now();

  INSERT INTO public.staff_actions(actor_id, action, target_user_id, reason, result)
  VALUES (actor, action_name, _target, _reason, 'ok');

  INSERT INTO public.notifications(user_id,type,title,body,link)
  VALUES (_target,'status_change','Cambio de estado','Tu estado ahora es: ' || _status::text || COALESCE(' — '||_reason,''),'/profile');
END; $$;

-- 11. Delete content
CREATE OR REPLACE FUNCTION public.staff_delete_content(_type TEXT, _id UUID, _reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  actor UUID := auth.uid();
  action_name public.staff_action_type;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_moderator_or_higher(actor) THEN RAISE EXCEPTION 'No autorizado'; END IF;

  IF _type = 'post' THEN
    DELETE FROM public.posts WHERE id=_id; action_name:='delete_post';
  ELSIF _type = 'project' THEN
    DELETE FROM public.projects WHERE id=_id; action_name:='delete_project';
  ELSIF _type = 'tutorial' THEN
    IF NOT public.is_admin_or_higher(actor) THEN RAISE EXCEPTION 'Solo Admin+ puede eliminar tutoriales'; END IF;
    DELETE FROM public.tutorials WHERE id=_id; action_name:='delete_tutorial';
  ELSIF _type = 'comment' THEN
    DELETE FROM public.comments WHERE id=_id; action_name:='delete_comment';
  ELSE
    RAISE EXCEPTION 'Tipo no soportado';
  END IF;

  INSERT INTO public.staff_actions(actor_id, action, target_content_type, target_content_id, reason, result)
  VALUES (actor, action_name, _type, _id, _reason, 'ok');
END; $$;

-- 12. Feature content (admin+)
CREATE OR REPLACE FUNCTION public.staff_feature_content(_type TEXT, _id UUID, _featured BOOLEAN, _reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  actor UUID := auth.uid();
  action_name public.staff_action_type;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_admin_or_higher(actor) THEN RAISE EXCEPTION 'Solo Admin+ puede destacar'; END IF;

  IF _type = 'tutorial' THEN
    UPDATE public.tutorials SET is_featured=_featured WHERE id=_id;
    action_name := CASE WHEN _featured THEN 'feature_tutorial'::public.staff_action_type ELSE 'unfeature_tutorial'::public.staff_action_type END;
  ELSE
    RAISE EXCEPTION 'Tipo no soportado';
  END IF;

  INSERT INTO public.staff_actions(actor_id, action, target_content_type, target_content_id, reason, result)
  VALUES (actor, action_name, _type, _id, _reason, 'ok');
END; $$;

-- 13. Broadcast notification (admin+)
CREATE OR REPLACE FUNCTION public.staff_broadcast_notification(_title TEXT, _body TEXT, _link TEXT, _audience TEXT DEFAULT 'all')
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  actor UUID := auth.uid();
  n INT := 0;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_admin_or_higher(actor) THEN RAISE EXCEPTION 'Solo Admin+ puede enviar broadcasts'; END IF;

  IF _audience = 'premium' THEN
    INSERT INTO public.notifications(user_id, type, title, body, link)
      SELECT ur.user_id, 'announcement', _title, _body, _link
      FROM public.user_roles ur WHERE ur.role='premium'::app_role;
  ELSIF _audience = 'staff' THEN
    INSERT INTO public.notifications(user_id, type, title, body, link)
      SELECT DISTINCT ur.user_id, 'announcement', _title, _body, _link
      FROM public.user_roles ur WHERE ur.role IN ('founder'::app_role,'admin'::app_role,'moderator'::app_role);
  ELSE
    INSERT INTO public.notifications(user_id, type, title, body, link)
      SELECT id, 'announcement', _title, _body, _link FROM public.profiles;
  END IF;
  GET DIAGNOSTICS n = ROW_COUNT;
  INSERT INTO public.staff_actions(actor_id, action, reason, result)
    VALUES (actor, 'send_notification_broadcast', _audience, n::text || ' notificaciones enviadas');
  RETURN n;
END; $$;

-- 14. Create announcement (admin+)
CREATE OR REPLACE FUNCTION public.staff_create_announcement(_title TEXT, _body TEXT, _level TEXT DEFAULT 'info', _audience TEXT DEFAULT 'all', _expires_at TIMESTAMPTZ DEFAULT NULL)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  actor UUID := auth.uid();
  aid UUID;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_admin_or_higher(actor) THEN RAISE EXCEPTION 'Solo Admin+ puede crear anuncios'; END IF;

  INSERT INTO public.announcements(title,body,level,audience,expires_at,created_by,active)
    VALUES (_title,_body,_level,_audience,_expires_at,actor,true)
    RETURNING id INTO aid;
  INSERT INTO public.staff_actions(actor_id, action, reason, result)
    VALUES (actor,'send_announcement',_audience,aid::text);
  RETURN aid;
END; $$;

CREATE OR REPLACE FUNCTION public.staff_deactivate_announcement(_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE actor UUID := auth.uid();
BEGIN
  IF NOT public.is_admin_or_higher(actor) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  UPDATE public.announcements SET active=false WHERE id=_id;
END; $$;

-- 15. Touch last_seen (called from heartbeat)
CREATE OR REPLACE FUNCTION public.touch_last_seen()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  UPDATE public.profiles SET last_seen_at = now() WHERE id = uid;
END; $$;

-- 16. Grant execute
GRANT EXECUTE ON FUNCTION public.staff_assign_role(UUID, app_role, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_revoke_role(UUID, app_role, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_grant_premium(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_revoke_premium(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_set_user_status(UUID, public.user_status_type, TIMESTAMPTZ, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_delete_content(TEXT, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_feature_content(TEXT, UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_broadcast_notification(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_create_announcement(TEXT, TEXT, TEXT, TEXT, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_deactivate_announcement(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.touch_last_seen() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_founder(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_or_higher(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_moderator_or_higher(UUID) TO authenticated, anon;
