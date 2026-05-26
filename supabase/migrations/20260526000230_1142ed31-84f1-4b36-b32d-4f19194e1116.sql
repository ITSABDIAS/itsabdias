
-- Activity tracking
CREATE TABLE IF NOT EXISTS public.user_activity (
  user_id uuid PRIMARY KEY,
  total_seconds integer NOT NULL DEFAULT 0,
  last_heartbeat timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_select_own_or_staff" ON public.user_activity
FOR SELECT USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.has_role(auth.uid(), 'founder'::app_role)
);

-- Record activity for the current user. Caps additions to 120s per call
-- to prevent spoofing by spamming the function.
CREATE OR REPLACE FUNCTION public.record_activity(_seconds integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  add_s integer := GREATEST(0, LEAST(COALESCE(_seconds, 0), 120));
  new_total integer;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.user_activity (user_id, total_seconds, last_heartbeat, updated_at)
  VALUES (uid, add_s, now(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET total_seconds = public.user_activity.total_seconds + add_s,
        last_heartbeat = now(),
        updated_at = now()
  RETURNING total_seconds INTO new_total;

  RETURN new_total;
END;
$$;

-- Check unlockable ranks for a user and grant them. Returns array of newly granted roles.
CREATE OR REPLACE FUNCTION public.check_rank_unlocks(_user_id uuid)
RETURNS app_role[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  granted app_role[] := ARRAY[]::app_role[];
  total_s integer;
  proj_count integer;
BEGIN
  IF _user_id IS NULL THEN
    RETURN granted;
  END IF;

  -- Member: >= 30 minutes (1800 seconds) of activity
  SELECT COALESCE(total_seconds, 0) INTO total_s
    FROM public.user_activity WHERE user_id = _user_id;

  IF COALESCE(total_s, 0) >= 1800
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'member'::app_role) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'member'::app_role)
      ON CONFLICT DO NOTHING;
    granted := array_append(granted, 'member'::app_role);
  END IF;

  -- Developer: >= 5 projects created
  SELECT COUNT(*) INTO proj_count FROM public.projects WHERE user_id = _user_id;

  IF COALESCE(proj_count, 0) >= 5
     AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'developer'::app_role) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'developer'::app_role)
      ON CONFLICT DO NOTHING;
    granted := array_append(granted, 'developer'::app_role);
  END IF;

  RETURN granted;
END;
$$;

-- Auto-check developer rank when a new project is created
CREATE OR REPLACE FUNCTION public.projects_after_insert_check_ranks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.check_rank_unlocks(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_projects_check_ranks ON public.projects;
CREATE TRIGGER trg_projects_check_ranks
AFTER INSERT ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.projects_after_insert_check_ranks();
