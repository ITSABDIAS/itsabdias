-- 1. user_status extra columns
ALTER TABLE public.user_status
  ADD COLUMN IF NOT EXISTS is_permanent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS started_at timestamptz NOT NULL DEFAULT now();

-- 2. sanctions history table
CREATE TABLE IF NOT EXISTS public.sanctions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES auth.users(id),
  type public.user_status_type NOT NULL,
  reason text,
  is_permanent boolean NOT NULL DEFAULT false,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  state text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sanctions TO authenticated;
GRANT ALL ON public.sanctions TO service_role;
ALTER TABLE public.sanctions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sanctions owner or staff read" ON public.sanctions
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_moderator_or_higher(auth.uid()));
CREATE POLICY "sanctions founder delete" ON public.sanctions
  FOR DELETE TO authenticated
  USING (public.is_founder(auth.uid()));
CREATE TRIGGER sanctions_touch BEFORE UPDATE ON public.sanctions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX IF NOT EXISTS sanctions_user_idx ON public.sanctions(user_id, created_at DESC);

-- 3. permanent ban requests
CREATE TABLE IF NOT EXISTS public.ban_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id),
  reason text NOT NULL,
  evidence text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ban_requests TO authenticated;
GRANT ALL ON public.ban_requests TO service_role;
ALTER TABLE public.ban_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ban_requests staff read" ON public.ban_requests
  FOR SELECT TO authenticated
  USING (public.is_moderator_or_higher(auth.uid()));
CREATE POLICY "ban_requests founder delete" ON public.ban_requests
  FOR DELETE TO authenticated
  USING (public.is_founder(auth.uid()));
CREATE TRIGGER ban_requests_touch BEFORE UPDATE ON public.ban_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. effective sanction helpers
CREATE OR REPLACE FUNCTION public.expire_user_sanction(_uid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE public.sanctions
     SET state = 'expired'
   WHERE user_id = _uid AND state = 'active'
     AND is_permanent = false AND ends_at IS NOT NULL AND ends_at <= now();

  UPDATE public.user_status
     SET status = 'active', reason = NULL, until = NULL, is_permanent = false, updated_at = now()
   WHERE user_id = _uid AND status <> 'active'
     AND is_permanent = false AND until IS NOT NULL AND until <= now();
END; $$;

CREATE OR REPLACE FUNCTION public.is_user_muted(_uid uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s record;
BEGIN
  IF _uid IS NULL THEN RETURN false; END IF;
  PERFORM public.expire_user_sanction(_uid);
  SELECT status INTO s FROM public.user_status WHERE user_id = _uid;
  RETURN COALESCE(s.status, 'active') <> 'active';
END; $$;

CREATE OR REPLACE FUNCTION public.my_sanction()
RETURNS TABLE(status public.user_status_type, reason text, until timestamptz, started_at timestamptz, is_permanent boolean, staff_username text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  RETURN QUERY
  SELECT us.status, us.reason, us.until, us.started_at, us.is_permanent, p.username
  FROM public.user_status us
  LEFT JOIN public.profiles p ON p.id = us.set_by
  WHERE us.user_id = uid
    AND us.status <> 'active'
    AND (us.is_permanent OR us.until IS NULL OR us.until > now());
END; $$;

-- 5. block content creation while sanctioned
CREATE OR REPLACE FUNCTION public.block_if_sanctioned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF public.is_user_muted(auth.uid()) THEN
    RAISE EXCEPTION 'Tu cuenta tiene una sanción activa y no puede publicar.';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS block_sanctioned ON public.posts;
CREATE TRIGGER block_sanctioned BEFORE INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.block_if_sanctioned();
DROP TRIGGER IF EXISTS block_sanctioned ON public.comments;
CREATE TRIGGER block_sanctioned BEFORE INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.block_if_sanctioned();
DROP TRIGGER IF EXISTS block_sanctioned ON public.project_comments;
CREATE TRIGGER block_sanctioned BEFORE INSERT ON public.project_comments FOR EACH ROW EXECUTE FUNCTION public.block_if_sanctioned();
DROP TRIGGER IF EXISTS block_sanctioned ON public.tutorial_comments;
CREATE TRIGGER block_sanctioned BEFORE INSERT ON public.tutorial_comments FOR EACH ROW EXECUTE FUNCTION public.block_if_sanctioned();
DROP TRIGGER IF EXISTS block_sanctioned ON public.direct_messages;
CREATE TRIGGER block_sanctioned BEFORE INSERT ON public.direct_messages FOR EACH ROW EXECUTE FUNCTION public.block_if_sanctioned();
DROP TRIGGER IF EXISTS block_sanctioned ON public.chat_messages;
CREATE TRIGGER block_sanctioned BEFORE INSERT ON public.chat_messages FOR EACH ROW EXECUTE FUNCTION public.block_if_sanctioned();

-- 6. staff_set_user_status with duration + permanence + sanction log
CREATE OR REPLACE FUNCTION public.staff_set_user_status(
  _target uuid, _status public.user_status_type,
  _until timestamptz DEFAULT NULL, _reason text DEFAULT NULL,
  _permanent boolean DEFAULT false)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  actor uuid := auth.uid();
  action_name public.staff_action_type;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF actor = _target THEN RAISE EXCEPTION 'No puedes cambiar tu propio estado'; END IF;
  IF public.is_founder(_target) THEN RAISE EXCEPTION 'No se puede modificar al Founder'; END IF;

  IF _status = 'banned' THEN
    IF NOT public.is_admin_or_higher(actor) THEN RAISE EXCEPTION 'Solo Admin+ puede banear'; END IF;
    IF _permanent AND NOT public.is_founder(actor) THEN
      RAISE EXCEPTION 'El ban permanente requiere aprobación del Founder';
    END IF;
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

  IF _status = 'active' THEN
    UPDATE public.sanctions SET state='revoked' WHERE user_id=_target AND state='active';
    DELETE FROM public.user_status WHERE user_id=_target;
  ELSE
    UPDATE public.sanctions SET state='revoked' WHERE user_id=_target AND state='active';
    INSERT INTO public.user_status(user_id,status,reason,until,set_by,updated_at,is_permanent,started_at)
    VALUES (_target,_status,_reason, CASE WHEN _permanent THEN NULL ELSE _until END, actor, now(), COALESCE(_permanent,false), now())
    ON CONFLICT (user_id) DO UPDATE
      SET status=EXCLUDED.status, reason=EXCLUDED.reason, until=EXCLUDED.until,
          set_by=EXCLUDED.set_by, updated_at=now(), is_permanent=EXCLUDED.is_permanent, started_at=now();
    INSERT INTO public.sanctions(user_id, staff_id, type, reason, is_permanent, starts_at, ends_at, state)
    VALUES (_target, actor, _status, _reason, COALESCE(_permanent,false), now(),
            CASE WHEN _permanent THEN NULL ELSE _until END, 'active');
  END IF;

  INSERT INTO public.staff_actions(actor_id, action, target_user_id, reason, result)
  VALUES (actor, action_name, _target, _reason,
          CASE WHEN _permanent THEN 'permanente' WHEN _until IS NOT NULL THEN 'hasta ' || _until::text ELSE 'ok' END);

  INSERT INTO public.notifications(user_id,type,title,body,link)
  VALUES (_target,'status_change','Cambio de estado',
    'Tu estado ahora es: ' || _status::text || COALESCE(' — '||_reason,''),'/profile');
END; $$;

-- 7. permanent ban request workflow
CREATE OR REPLACE FUNCTION public.staff_request_permanent_ban(_target uuid, _reason text, _evidence text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE actor uuid := auth.uid(); rid uuid; founder_id uuid;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.is_moderator_or_higher(actor) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  IF public.is_founder(_target) THEN RAISE EXCEPTION 'No se puede sancionar al Founder'; END IF;
  IF _reason IS NULL OR length(trim(_reason)) < 10 THEN RAISE EXCEPTION 'El motivo detallado es obligatorio (mín. 10 caracteres)'; END IF;

  INSERT INTO public.ban_requests(target_user_id, requester_id, reason, evidence)
  VALUES (_target, actor, _reason, _evidence) RETURNING id INTO rid;

  FOR founder_id IN SELECT user_id FROM public.user_roles WHERE role='founder'::app_role LOOP
    INSERT INTO public.notifications(user_id,type,title,body,link)
    VALUES (founder_id,'ban_request','Solicitud de ban permanente','Hay una nueva solicitud pendiente de revisión.','/admin/bans');
  END LOOP;
  RETURN rid;
END; $$;

CREATE OR REPLACE FUNCTION public.founder_review_ban_request(_id uuid, _approve boolean, _note text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE actor uuid := auth.uid(); req record;
BEGIN
  IF NOT public.is_founder(actor) THEN RAISE EXCEPTION 'Solo el Founder puede revisar solicitudes'; END IF;
  SELECT * INTO req FROM public.ban_requests WHERE id=_id AND status='pending';
  IF req IS NULL THEN RAISE EXCEPTION 'Solicitud no encontrada o ya revisada'; END IF;

  UPDATE public.ban_requests
     SET status = CASE WHEN _approve THEN 'approved' ELSE 'rejected' END,
         reviewed_by = actor, reviewed_at = now(), review_note = _note
   WHERE id = _id;

  IF _approve THEN
    UPDATE public.sanctions SET state='revoked' WHERE user_id=req.target_user_id AND state='active';
    INSERT INTO public.user_status(user_id,status,reason,until,set_by,updated_at,is_permanent,started_at)
    VALUES (req.target_user_id,'banned',req.reason,NULL,actor,now(),true,now())
    ON CONFLICT (user_id) DO UPDATE
      SET status='banned', reason=EXCLUDED.reason, until=NULL, set_by=actor,
          updated_at=now(), is_permanent=true, started_at=now();
    INSERT INTO public.sanctions(user_id, staff_id, type, reason, is_permanent, ends_at, state)
    VALUES (req.target_user_id, actor, 'banned', req.reason, true, NULL, 'active');
    INSERT INTO public.staff_actions(actor_id, action, target_user_id, reason, result)
    VALUES (actor,'ban_user',req.target_user_id,req.reason,'ban permanente aprobado');
  END IF;

  INSERT INTO public.notifications(user_id,type,title,body,link)
  VALUES (req.requester_id,'ban_request',
    CASE WHEN _approve THEN 'Solicitud de ban aprobada' ELSE 'Solicitud de ban rechazada' END,
    COALESCE(_note,''), '/admin/bans');
END; $$;

-- 8. grants
REVOKE ALL ON FUNCTION public.expire_user_sanction(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.is_user_muted(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.block_if_sanctioned() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.my_sanction() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_sanction() TO authenticated;
REVOKE ALL ON FUNCTION public.staff_set_user_status(uuid, public.user_status_type, timestamptz, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_set_user_status(uuid, public.user_status_type, timestamptz, text, boolean) TO authenticated;
REVOKE ALL ON FUNCTION public.staff_request_permanent_ban(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_request_permanent_ban(uuid, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.founder_review_ban_request(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.founder_review_ban_request(uuid, boolean, text) TO authenticated;