
-- Replace blanket staff manage policy with granular role-aware ones
DROP POLICY IF EXISTS user_roles_staff_manage ON public.user_roles;

-- Only founder can insert/delete the founder or admin role
CREATE POLICY user_roles_founder_manage_top
ON public.user_roles
FOR ALL
USING (
  public.has_role(auth.uid(), 'founder'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'founder'::app_role)
);

-- Admins (and founder) can manage moderator/verified/ai_expert/premium/member/developer
CREATE POLICY user_roles_admin_manage_lower
ON public.user_roles
FOR INSERT
WITH CHECK (
  (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'founder'::app_role))
  AND role <> 'founder'::app_role
  AND role <> 'admin'::app_role
);

CREATE POLICY user_roles_admin_delete_lower
ON public.user_roles
FOR DELETE
USING (
  (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'founder'::app_role))
  AND role <> 'founder'::app_role
  AND role <> 'admin'::app_role
);

-- Update check_rank_unlocks to also auto-grant ai_expert via 3 IA projects
CREATE OR REPLACE FUNCTION public.check_rank_unlocks(_user_id uuid)
RETURNS app_role[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  uid uuid := auth.uid();
  target uuid;
  granted app_role[] := ARRAY[]::app_role[];
  total_s integer;
  proj_count integer;
  ai_count integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  target := uid;

  SELECT COALESCE(total_seconds, 0) INTO total_s
    FROM public.user_activity WHERE user_id = target;

  IF COALESCE(total_s, 0) >= 1800
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target AND role = 'member'::app_role) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (target, 'member'::app_role)
      ON CONFLICT DO NOTHING;
    granted := array_append(granted, 'member'::app_role);
  END IF;

  SELECT COUNT(*) INTO proj_count FROM public.projects WHERE user_id = target;

  IF COALESCE(proj_count, 0) >= 5
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target AND role = 'developer'::app_role) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (target, 'developer'::app_role)
      ON CONFLICT DO NOTHING;
    granted := array_append(granted, 'developer'::app_role);
  END IF;

  SELECT COUNT(*) INTO ai_count
    FROM public.projects
    WHERE user_id = target AND category = 'IA';

  IF COALESCE(ai_count, 0) >= 3
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = target AND role = 'ai_expert'::app_role) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (target, 'ai_expert'::app_role)
      ON CONFLICT DO NOTHING;
    granted := array_append(granted, 'ai_expert'::app_role);
  END IF;

  RETURN granted;
END;
$function$;
