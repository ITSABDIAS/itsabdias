
-- Lock down execution to authenticated users, and force check to use auth.uid()
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
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  -- Users can only check their own progression
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

  RETURN granted;
END;
$$;

REVOKE ALL ON FUNCTION public.record_activity(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_activity(integer) TO authenticated;

REVOKE ALL ON FUNCTION public.check_rank_unlocks(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_rank_unlocks(uuid) TO authenticated;
