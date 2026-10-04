CREATE TABLE public.bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  description text NOT NULL,
  page text,
  severity text NOT NULL DEFAULT 'normal',
  status text NOT NULL DEFAULT 'pending',
  points_awarded integer NOT NULL DEFAULT 0,
  reviewed_by uuid,
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.bug_reports TO authenticated;
GRANT ALL ON public.bug_reports TO service_role;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own or staff read bugs" ON public.bug_reports FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_moderator_or_higher(auth.uid()));
CREATE POLICY "create own bug" ON public.bug_reports FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending' AND points_awarded = 0 AND reviewed_by IS NULL
    AND char_length(title) BETWEEN 5 AND 120 AND char_length(description) BETWEEN 10 AND 3000
    AND severity IN ('low','normal','high','critical'));

CREATE TABLE public.hunter_xp (
  user_id uuid PRIMARY KEY,
  xp integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hunter_xp TO authenticated;
GRANT ALL ON public.hunter_xp TO service_role;
ALTER TABLE public.hunter_xp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read xp" ON public.hunter_xp FOR SELECT TO authenticated USING (true);

CREATE TABLE public.mission_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mission_key text NOT NULL,
  xp integer NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_key)
);
GRANT SELECT ON public.mission_claims TO authenticated;
GRANT ALL ON public.mission_claims TO service_role;
ALTER TABLE public.mission_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own claims" ON public.mission_claims FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.hunter_add_xp(_uid uuid, _xp integer) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO hunter_xp(user_id, xp) VALUES (_uid, greatest(_xp,0))
  ON CONFLICT (user_id) DO UPDATE SET xp = hunter_xp.xp + greatest(_xp,0), updated_at = now();
$$;
REVOKE EXECUTE ON FUNCTION public.hunter_add_xp(uuid,integer) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.staff_review_bug(_id uuid, _status text, _points integer, _note text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r bug_reports;
BEGIN
  IF NOT is_moderator_or_higher(auth.uid()) THEN RAISE EXCEPTION 'Sin permiso'; END IF;
  IF _status NOT IN ('confirmed','rejected','fixed','duplicate') THEN RAISE EXCEPTION 'Estado inválido'; END IF;
  SELECT * INTO r FROM bug_reports WHERE id = _id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'No existe'; END IF;
  IF r.user_id = auth.uid() THEN RAISE EXCEPTION 'No puedes revisar tu propio reporte'; END IF;
  IF r.status <> 'pending' THEN RAISE EXCEPTION 'Ya fue revisado'; END IF;
  _points := CASE WHEN _status IN ('confirmed','fixed') THEN least(greatest(coalesce(_points,0),10),500) ELSE 0 END;
  UPDATE bug_reports SET status=_status, points_awarded=_points, reviewed_by=auth.uid(), review_note=_note, updated_at=now() WHERE id=_id;
  IF _points > 0 THEN PERFORM hunter_add_xp(r.user_id, _points); END IF;
  PERFORM create_notification(r.user_id, 'bug',
    CASE WHEN _points > 0 THEN '🐞 Bug confirmado: +' || _points || ' XP' ELSE 'Tu reporte de error fue revisado' END,
    coalesce(_note, r.title), '/bug-hunter');
END $$;
REVOKE EXECUTE ON FUNCTION public.staff_review_bug(uuid,text,integer,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_review_bug(uuid,text,integer,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.hunter_mission_stats() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'bugs_sent', (SELECT count(*) FROM bug_reports WHERE user_id = auth.uid()),
    'bugs_confirmed', (SELECT count(*) FROM bug_reports WHERE user_id = auth.uid() AND status IN ('confirmed','fixed')),
    'posts', (SELECT count(*) FROM posts WHERE user_id = auth.uid()),
    'comments', (SELECT count(*) FROM comments WHERE user_id = auth.uid()),
    'projects', (SELECT count(*) FROM projects WHERE user_id = auth.uid()),
    'follows', (SELECT count(*) FROM follows WHERE follower_id = auth.uid()),
    'lessons', (SELECT count(*) FROM academy_lesson_progress WHERE user_id = auth.uid()),
    'nexus', (SELECT count(*) FROM chat_messages WHERE user_id = auth.uid() AND role = 'user')
  );
$$;
REVOKE EXECUTE ON FUNCTION public.hunter_mission_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hunter_mission_stats() TO authenticated;

CREATE OR REPLACE FUNCTION public.hunter_claim_mission(_key text) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s jsonb; metric text; target int; reward int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Inicia sesión'; END IF;
  -- key format: metric:target
  metric := split_part(_key, ':', 1);
  target := split_part(_key, ':', 2)::int;
  IF metric NOT IN ('bugs_sent','bugs_confirmed','posts','comments','projects','follows','lessons','nexus') OR target < 1 OR target > 1000 THEN
    RAISE EXCEPTION 'Misión inválida'; END IF;
  s := hunter_mission_stats();
  IF (s->>metric)::int < target THEN RAISE EXCEPTION 'Misión aún no completada'; END IF;
  reward := least(20 + target * CASE WHEN metric = 'bugs_confirmed' THEN 60 WHEN metric IN ('projects') THEN 40 WHEN metric = 'bugs_sent' THEN 15 ELSE 8 END, 3000);
  INSERT INTO mission_claims(user_id, mission_key, xp) VALUES (auth.uid(), _key, reward);
  PERFORM hunter_add_xp(auth.uid(), reward);
  RETURN reward;
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'Ya reclamaste esta misión';
END $$;
REVOKE EXECUTE ON FUNCTION public.hunter_claim_mission(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.hunter_claim_mission(text) TO authenticated;