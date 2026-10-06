DROP POLICY IF EXISTS "read xp" ON public.hunter_xp;
CREATE POLICY "read own xp" ON public.hunter_xp FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_moderator_or_higher(auth.uid()));

CREATE OR REPLACE FUNCTION public.get_hunter_leaderboard(_limit int DEFAULT 100)
RETURNS TABLE(user_id uuid, xp integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT h.user_id, h.xp::integer FROM public.hunter_xp h
  ORDER BY h.xp DESC LIMIT LEAST(GREATEST(COALESCE(_limit,100),1),100)
$$;

CREATE OR REPLACE FUNCTION public.get_user_level(_user_id uuid)
RETURNS TABLE(xp integer, staff_xp integer, streak integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT h.xp::integer, h.staff_xp::integer, h.streak::integer FROM public.hunter_xp h WHERE h.user_id = _user_id
$$;

REVOKE ALL ON FUNCTION public.get_hunter_leaderboard(int) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_level(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_hunter_leaderboard(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_level(uuid) TO authenticated;