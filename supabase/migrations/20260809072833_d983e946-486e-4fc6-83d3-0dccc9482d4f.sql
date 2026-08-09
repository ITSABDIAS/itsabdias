
-- ENUMS
DO $$ BEGIN
  CREATE TYPE public.report_target_type AS ENUM ('user','post','comment','tutorial','project');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.report_status AS ENUM ('new','reviewing','action_required','escalated','resolved','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.report_priority AS ENUM ('low','normal','high','critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- REPORTS
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number bigint GENERATED ALWAYS AS IDENTITY,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type public.report_target_type NOT NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_content_id uuid,
  reason text NOT NULL,
  description text,
  evidence text,
  screenshot_url text,
  status public.report_status NOT NULL DEFAULT 'new',
  priority public.report_priority NOT NULL DEFAULT 'normal',
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution text,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  is_false_report boolean NOT NULL DEFAULT false,
  duplicate_of uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT UPDATE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
CREATE POLICY "reports_insert_own" ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_select_own_or_staff" ON public.reports;
CREATE POLICY "reports_select_own_or_staff" ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR public.is_moderator_or_higher(auth.uid()));

DROP POLICY IF EXISTS "reports_update_staff" ON public.reports;
CREATE POLICY "reports_update_staff" ON public.reports FOR UPDATE TO authenticated
  USING (public.is_moderator_or_higher(auth.uid()))
  WITH CHECK (public.is_moderator_or_higher(auth.uid()));

CREATE INDEX IF NOT EXISTS reports_status_idx ON public.reports(status);
CREATE INDEX IF NOT EXISTS reports_priority_idx ON public.reports(priority);
CREATE INDEX IF NOT EXISTS reports_reporter_idx ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS reports_target_user_idx ON public.reports(target_user_id);

DROP TRIGGER IF EXISTS reports_touch ON public.reports;
CREATE TRIGGER reports_touch BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- REPORT ACTIONS (historial inmutable)
CREATE TABLE IF NOT EXISTS public.report_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  reason text,
  result text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.report_actions TO authenticated;
GRANT ALL ON public.report_actions TO service_role;
ALTER TABLE public.report_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "report_actions_select_staff" ON public.report_actions;
CREATE POLICY "report_actions_select_staff" ON public.report_actions FOR SELECT TO authenticated
  USING (public.is_moderator_or_higher(auth.uid()));

CREATE INDEX IF NOT EXISTS report_actions_report_idx ON public.report_actions(report_id);

-- WARNINGS
CREATE TABLE IF NOT EXISTS public.user_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text NOT NULL,
  report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_warnings TO authenticated;
GRANT ALL ON public.user_warnings TO service_role;
ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "warnings_select_own_or_staff" ON public.user_warnings;
CREATE POLICY "warnings_select_own_or_staff" ON public.user_warnings FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_moderator_or_higher(auth.uid()));

-- CREAR REPORTE (con antispam y duplicados)
CREATE OR REPLACE FUNCTION public.create_report(
  _target_type public.report_target_type,
  _reason text,
  _target_user_id uuid DEFAULT NULL,
  _target_content_id uuid DEFAULT NULL,
  _description text DEFAULT NULL,
  _evidence text DEFAULT NULL,
  _screenshot_url text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  uid uuid := auth.uid();
  recent int;
  dup uuid;
  rid uuid;
  prio public.report_priority := 'normal';
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  IF _reason IS NULL OR length(trim(_reason)) = 0 THEN RAISE EXCEPTION 'Debes indicar un motivo'; END IF;
  IF _target_user_id = uid THEN RAISE EXCEPTION 'No puedes reportarte a ti mismo'; END IF;

  SELECT count(*) INTO recent FROM public.reports
   WHERE reporter_id = uid AND created_at > now() - interval '1 hour';
  IF recent >= 10 THEN
    RAISE EXCEPTION 'Has enviado demasiados reportes. Intenta más tarde.';
  END IF;

  SELECT id INTO dup FROM public.reports
   WHERE reporter_id = uid
     AND target_type = _target_type
     AND COALESCE(target_content_id::text,'') = COALESCE(_target_content_id::text,'')
     AND COALESCE(target_user_id::text,'') = COALESCE(_target_user_id::text,'')
     AND created_at > now() - interval '24 hours'
   LIMIT 1;
  IF dup IS NOT NULL THEN
    RAISE EXCEPTION 'Ya reportaste esto recientemente. Nuestro staff lo está revisando.';
  END IF;

  IF _reason IN ('Acoso','Fraude o engaño','Suplantación') THEN prio := 'high'; END IF;

  INSERT INTO public.reports (reporter_id, target_type, target_user_id, target_content_id,
                              reason, description, evidence, screenshot_url, priority)
  VALUES (uid, _target_type, _target_user_id, _target_content_id,
          _reason, _description, _evidence, _screenshot_url, prio)
  RETURNING id INTO rid;

  INSERT INTO public.report_actions (report_id, staff_id, action, reason, result)
  VALUES (rid, uid, 'created', _reason, 'reporte creado');

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (uid, 'report', '🚨 Reporte recibido', 'Hemos recibido tu reporte. El staff lo revisará pronto.', '/reportes');

  RETURN rid;
END; $$;

REVOKE EXECUTE ON FUNCTION public.create_report(public.report_target_type,text,uuid,uuid,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_report(public.report_target_type,text,uuid,uuid,text,text,text) TO authenticated;

-- ACTUALIZAR REPORTE (estado / prioridad / asignación / resolución)
CREATE OR REPLACE FUNCTION public.staff_update_report(
  _id uuid,
  _status public.report_status DEFAULT NULL,
  _priority public.report_priority DEFAULT NULL,
  _assign_to uuid DEFAULT NULL,
  _resolution text DEFAULT NULL,
  _false_report boolean DEFAULT NULL,
  _duplicate_of uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  actor uuid := auth.uid();
  r record;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  IF NOT public.is_moderator_or_higher(actor) THEN RAISE EXCEPTION 'No autorizado'; END IF;

  SELECT * INTO r FROM public.reports WHERE id = _id;
  IF r IS NULL THEN RAISE EXCEPTION 'Reporte no encontrado'; END IF;

  -- Reabrir un reporte cerrado/resuelto requiere Admin+
  IF _status IS NOT NULL AND r.status IN ('resolved','closed')
     AND _status NOT IN ('resolved','closed')
     AND NOT public.is_admin_or_higher(actor) THEN
    RAISE EXCEPTION 'Solo Admin+ puede reabrir un reporte';
  END IF;

  -- Asignar reportes a otro staff requiere Admin+
  IF _assign_to IS NOT NULL AND _assign_to <> actor AND NOT public.is_admin_or_higher(actor) THEN
    RAISE EXCEPTION 'Solo Admin+ puede asignar reportes a otro staff';
  END IF;

  UPDATE public.reports SET
    status = COALESCE(_status, status),
    priority = COALESCE(_priority, priority),
    assigned_to = COALESCE(_assign_to, assigned_to),
    resolution = COALESCE(_resolution, resolution),
    is_false_report = COALESCE(_false_report, is_false_report),
    duplicate_of = COALESCE(_duplicate_of, duplicate_of),
    resolved_by = CASE WHEN _status IN ('resolved','closed') THEN actor ELSE resolved_by END,
    resolved_at = CASE WHEN _status IN ('resolved','closed') THEN now() ELSE resolved_at END
  WHERE id = _id;

  INSERT INTO public.report_actions (report_id, staff_id, action, reason, result)
  VALUES (_id, actor,
    COALESCE(_status::text, 'update'),
    _resolution,
    concat_ws(' · ',
      CASE WHEN _status IS NOT NULL THEN 'estado=' || _status::text END,
      CASE WHEN _priority IS NOT NULL THEN 'prioridad=' || _priority::text END,
      CASE WHEN _assign_to IS NOT NULL THEN 'asignado' END,
      CASE WHEN _false_report THEN 'marcado como falso' END,
      CASE WHEN _duplicate_of IS NOT NULL THEN 'duplicado' END));

  IF _status = 'reviewing' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (r.reporter_id, 'report', '🔎 Reporte en revisión', 'Tu reporte está siendo revisado por el staff.', '/reportes');
  ELSIF _status = 'resolved' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (r.reporter_id, 'report', '✅ Reporte resuelto', COALESCE(_resolution, 'Tu reporte ha sido resuelto. Gracias por ayudar a la comunidad.'), '/reportes');
  ELSIF _status = 'escalated' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
      SELECT DISTINCT ur.user_id, 'report', '🔴 Reporte escalado', 'Un reporte requiere revisión de Administración.', '/admin/reportes'
      FROM public.user_roles ur WHERE ur.role IN ('founder'::app_role,'admin'::app_role);
  END IF;
END; $$;

REVOKE EXECUTE ON FUNCTION public.staff_update_report(uuid,public.report_status,public.report_priority,uuid,text,boolean,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_update_report(uuid,public.report_status,public.report_priority,uuid,text,boolean,uuid) TO authenticated;

-- ADVERTENCIA FORMAL
CREATE OR REPLACE FUNCTION public.staff_warn_user(_target uuid, _reason text, _report_id uuid DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE actor uuid := auth.uid();
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  IF NOT public.is_moderator_or_higher(actor) THEN RAISE EXCEPTION 'No autorizado'; END IF;
  IF public.is_founder(_target) THEN RAISE EXCEPTION 'No se puede advertir al Founder'; END IF;
  IF _reason IS NULL OR length(trim(_reason)) < 3 THEN RAISE EXCEPTION 'Motivo obligatorio'; END IF;

  INSERT INTO public.user_warnings (user_id, staff_id, reason, report_id)
  VALUES (_target, actor, _reason, _report_id);

  IF _report_id IS NOT NULL THEN
    INSERT INTO public.report_actions (report_id, staff_id, action, reason, result)
    VALUES (_report_id, actor, 'warn', _reason, 'advertencia enviada');
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (_target, 'warning', '⚠️ Advertencia del staff', _reason, '/profile');
END; $$;

REVOKE EXECUTE ON FUNCTION public.staff_warn_user(uuid,text,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_warn_user(uuid,text,uuid) TO authenticated;

-- QUITAR BAN PERMANENTE (solo Founder)
CREATE OR REPLACE FUNCTION public.founder_remove_permanent_ban(_target uuid, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE actor uuid := auth.uid();
BEGIN
  IF NOT public.is_founder(actor) THEN RAISE EXCEPTION 'Solo el Founder puede quitar un ban permanente'; END IF;
  UPDATE public.sanctions SET state='revoked' WHERE user_id=_target AND state='active';
  DELETE FROM public.user_status WHERE user_id=_target;
  INSERT INTO public.staff_actions(actor_id, action, target_user_id, reason, result)
  VALUES (actor, 'unban_user', _target, _reason, 'ban permanente retirado');
  INSERT INTO public.notifications(user_id,type,title,body,link)
  VALUES (_target,'status_change','Cuenta restaurada','Tu ban permanente ha sido retirado por el Founder.','/profile');
END; $$;

REVOKE EXECUTE ON FUNCTION public.founder_remove_permanent_ban(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.founder_remove_permanent_ban(uuid,text) TO authenticated;
