CREATE OR REPLACE FUNCTION public.staff_assign_role(_target uuid, _role app_role, _reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  actor UUID := auth.uid();
  action_name public.staff_action_type;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF actor = _target THEN RAISE EXCEPTION 'No puedes asignarte permisos a ti mismo'; END IF;
  IF _role = 'founder'::app_role THEN RAISE EXCEPTION 'No se puede asignar el rango Founder'; END IF;
  IF public.is_founder(_target) THEN RAISE EXCEPTION 'No se puede modificar al Founder'; END IF;

  IF _role = 'admin'::app_role THEN
    IF NOT public.is_founder(actor) THEN RAISE EXCEPTION 'Solo el Founder puede asignar Administradores'; END IF;
    action_name := 'assign_admin';
  ELSIF _role = 'moderator'::app_role THEN
    IF NOT public.is_admin_or_higher(actor) THEN RAISE EXCEPTION 'Solo Admin+ puede asignar Moderadores'; END IF;
    action_name := 'assign_moderator';
  ELSIF _role = 'verified'::app_role THEN
    IF NOT public.is_admin_or_higher(actor) THEN RAISE EXCEPTION 'Solo Admin+ puede asignar Verificado'; END IF;
    action_name := 'assign_verified';
  ELSIF _role = 'developer'::app_role THEN
    IF NOT public.is_founder(actor) THEN RAISE EXCEPTION 'Solo el Founder puede asignar Developer'; END IF;
    action_name := 'assign_developer';
  ELSIF _role = 'ai_expert'::app_role THEN
    IF NOT public.is_founder(actor) THEN RAISE EXCEPTION 'Solo el Founder puede asignar Experto IA'; END IF;
    action_name := 'assign_ai_expert';
  ELSIF _role = 'member'::app_role THEN
    IF NOT public.is_founder(actor) THEN RAISE EXCEPTION 'Solo el Founder puede asignar Miembro'; END IF;
    action_name := 'assign_member';
  ELSIF _role = 'premium'::app_role THEN
    RAISE EXCEPTION 'Usa staff_grant_premium para otorgar Premium';
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
END; $function$;

CREATE OR REPLACE FUNCTION public.staff_revoke_role(_target uuid, _role app_role, _reason text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  actor UUID := auth.uid();
  action_name public.staff_action_type;
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _role = 'founder'::app_role THEN RAISE EXCEPTION 'No se puede quitar el rango Founder'; END IF;
  IF public.is_founder(_target) THEN RAISE EXCEPTION 'No se puede modificar al Founder'; END IF;

  IF _role = 'admin'::app_role THEN
    IF NOT public.is_founder(actor) THEN RAISE EXCEPTION 'Solo el Founder puede quitar Administradores'; END IF;
    action_name := 'remove_admin';
  ELSIF _role = 'moderator'::app_role THEN
    IF NOT public.is_admin_or_higher(actor) THEN RAISE EXCEPTION 'Solo Admin+ puede quitar Moderadores'; END IF;
    action_name := 'remove_moderator';
  ELSIF _role = 'verified'::app_role THEN
    IF NOT public.is_admin_or_higher(actor) THEN RAISE EXCEPTION 'Solo Admin+ puede quitar Verificado'; END IF;
    action_name := 'remove_verified';
  ELSIF _role = 'developer'::app_role THEN
    IF NOT public.is_founder(actor) THEN RAISE EXCEPTION 'Solo el Founder puede quitar Developer'; END IF;
    action_name := 'remove_developer';
  ELSIF _role = 'ai_expert'::app_role THEN
    IF NOT public.is_founder(actor) THEN RAISE EXCEPTION 'Solo el Founder puede quitar Experto IA'; END IF;
    action_name := 'remove_ai_expert';
  ELSIF _role = 'member'::app_role THEN
    IF NOT public.is_founder(actor) THEN RAISE EXCEPTION 'Solo el Founder puede quitar Miembro'; END IF;
    action_name := 'remove_member';
  ELSIF _role = 'premium'::app_role THEN
    RAISE EXCEPTION 'Usa staff_revoke_premium para retirar Premium';
  ELSE
    RAISE EXCEPTION 'Rol no gestionable por staff';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _target AND role = _role;

  INSERT INTO public.staff_actions(actor_id, action, target_user_id, reason, result)
  VALUES (actor, action_name, _target, _reason, 'ok');

  INSERT INTO public.notifications(user_id, type, title, body, link)
  VALUES (_target, 'rank_revoke', 'Rango retirado',
    'Se retiró tu rango ' || _role::text || COALESCE(' — ' || _reason, ''), '/profile');
END; $function$;