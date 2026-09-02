
-- ============ TABLES ============
CREATE TABLE public.staff_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  motivation text NOT NULL,
  contribution text NOT NULL,
  experience text NOT NULL,
  tech_knowledge text NOT NULL,
  conflict_answer text NOT NULL,
  trust_answer text NOT NULL,
  accepted_rules boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  phase text NOT NULL DEFAULT 'application',
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_note text,
  decided_by uuid REFERENCES auth.users(id),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_app_status_chk CHECK (status IN ('pending','reviewing','accepted','rejected','closed')),
  CONSTRAINT staff_app_phase_chk CHECK (phase IN ('application','training','pending_evaluation','extra_training','approved','rejected'))
);
CREATE UNIQUE INDEX staff_applications_active_uidx ON public.staff_applications(user_id)
  WHERE status IN ('pending','reviewing','accepted');

GRANT SELECT, INSERT ON public.staff_applications TO authenticated;
GRANT ALL ON public.staff_applications TO service_role;
ALTER TABLE public.staff_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own application read" ON public.staff_applications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "staff read applications" ON public.staff_applications FOR SELECT TO authenticated USING (public.is_moderator_or_higher(auth.uid()));
CREATE POLICY "insert own application" ON public.staff_applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND accepted_rules = true AND status = 'pending' AND phase = 'application');

CREATE TABLE public.staff_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  position integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT 'shield',
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.staff_modules TO authenticated;
GRANT ALL ON public.staff_modules TO service_role;
ALTER TABLE public.staff_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modules readable by candidates and staff" ON public.staff_modules FOR SELECT TO authenticated
  USING (is_published AND (public.is_moderator_or_higher(auth.uid())
    OR EXISTS (SELECT 1 FROM public.staff_applications a WHERE a.user_id = auth.uid() AND a.status = 'accepted')));

CREATE TABLE public.staff_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.staff_modules(id) ON DELETE CASCADE,
  position integer NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  content text NOT NULL,
  examples text,
  key_points text,
  min_seconds integer NOT NULL DEFAULT 45,
  is_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.staff_lessons TO authenticated;
GRANT ALL ON public.staff_lessons TO service_role;
ALTER TABLE public.staff_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons readable by candidates and staff" ON public.staff_lessons FOR SELECT TO authenticated
  USING (public.is_moderator_or_higher(auth.uid())
    OR EXISTS (SELECT 1 FROM public.staff_applications a WHERE a.user_id = auth.uid() AND a.status = 'accepted'));

CREATE TABLE public.staff_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.staff_lessons(id) ON DELETE CASCADE,
  seconds_spent integer NOT NULL DEFAULT 0,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT ON public.staff_lesson_progress TO authenticated;
GRANT ALL ON public.staff_lesson_progress TO service_role;
ALTER TABLE public.staff_lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own lesson progress" ON public.staff_lesson_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "staff read lesson progress" ON public.staff_lesson_progress FOR SELECT TO authenticated USING (public.is_moderator_or_higher(auth.uid()));

CREATE TABLE public.staff_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.staff_modules(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL,
  pass_score integer NOT NULL DEFAULT 80,
  max_attempts integer NOT NULL DEFAULT 3,
  position integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.staff_exams TO authenticated;
GRANT ALL ON public.staff_exams TO service_role;
ALTER TABLE public.staff_exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exams readable by candidates and staff" ON public.staff_exams FOR SELECT TO authenticated
  USING (public.is_moderator_or_higher(auth.uid())
    OR EXISTS (SELECT 1 FROM public.staff_applications a WHERE a.user_id = auth.uid() AND a.status = 'accepted'));

CREATE TABLE public.staff_exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.staff_exams(id) ON DELETE CASCADE,
  position integer NOT NULL,
  kind text NOT NULL DEFAULT 'multiple',
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_answer text NOT NULL,
  explanation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_q_kind_chk CHECK (kind IN ('multiple','boolean','case'))
);
-- No grants to authenticated: questions (with answers) are only served through SECURITY DEFINER RPCs.
GRANT ALL ON public.staff_exam_questions TO service_role;
ALTER TABLE public.staff_exam_questions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.staff_exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.staff_exams(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL,
  score integer NOT NULL,
  passed boolean NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  detail jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.staff_exam_attempts TO authenticated;
GRANT ALL ON public.staff_exam_attempts TO service_role;
ALTER TABLE public.staff_exam_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own attempts" ON public.staff_exam_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "staff read attempts" ON public.staff_exam_attempts FOR SELECT TO authenticated USING (public.is_moderator_or_higher(auth.uid()));

CREATE TABLE public.staff_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.staff_applications(id) ON DELETE CASCADE,
  evaluator_id uuid REFERENCES auth.users(id),
  knowledge integer NOT NULL,
  responsibility integer NOT NULL,
  moderation integer NOT NULL,
  communication integer NOT NULL,
  security integer NOT NULL,
  ethics integer NOT NULL,
  overall_note text,
  recommendation text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_eval_reco_chk CHECK (recommendation IN ('approve','reject','extra_training')),
  CONSTRAINT staff_eval_range_chk CHECK (
    knowledge BETWEEN 1 AND 5 AND responsibility BETWEEN 1 AND 5 AND moderation BETWEEN 1 AND 5
    AND communication BETWEEN 1 AND 5 AND security BETWEEN 1 AND 5 AND ethics BETWEEN 1 AND 5)
);
GRANT SELECT ON public.staff_evaluations TO authenticated;
GRANT ALL ON public.staff_evaluations TO service_role;
ALTER TABLE public.staff_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "candidate reads own evaluations" ON public.staff_evaluations FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.staff_applications a WHERE a.id = application_id AND a.user_id = auth.uid()));
CREATE POLICY "staff read evaluations" ON public.staff_evaluations FOR SELECT TO authenticated USING (public.is_moderator_or_higher(auth.uid()));

CREATE TABLE public.staff_program_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.staff_applications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  actor_id uuid,
  actor_role text,
  action text NOT NULL,
  result text,
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.staff_program_history TO authenticated;
GRANT ALL ON public.staff_program_history TO service_role;
ALTER TABLE public.staff_program_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own history" ON public.staff_program_history FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "staff read history" ON public.staff_program_history FOR SELECT TO authenticated USING (public.is_moderator_or_higher(auth.uid()));

CREATE TRIGGER staff_applications_touch BEFORE UPDATE ON public.staff_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ HELPERS ============
CREATE OR REPLACE FUNCTION public.staff_program_log(_app uuid, _user uuid, _action text, _result text, _detail text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _role text;
BEGIN
  SELECT CASE WHEN public.is_founder(auth.uid()) THEN 'founder'
              WHEN public.is_admin_or_higher(auth.uid()) THEN 'admin'
              WHEN public.is_moderator_or_higher(auth.uid()) THEN 'moderator'
              ELSE 'user' END INTO _role;
  INSERT INTO public.staff_program_history(application_id, user_id, actor_id, actor_role, action, result, detail)
  VALUES (_app, _user, auth.uid(), _role, _action, _result, _detail);
END; $$;

CREATE OR REPLACE FUNCTION public.staff_program_progress(_user uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _total_lessons int; _done_lessons int; _total_exams int; _passed_exams int;
BEGIN
  SELECT count(*) INTO _total_lessons FROM public.staff_lessons WHERE is_required;
  SELECT count(*) INTO _done_lessons FROM public.staff_lesson_progress p
    JOIN public.staff_lessons l ON l.id = p.lesson_id AND l.is_required WHERE p.user_id = _user;
  SELECT count(*) INTO _total_exams FROM public.staff_exams;
  SELECT count(DISTINCT exam_id) INTO _passed_exams FROM public.staff_exam_attempts WHERE user_id = _user AND passed;
  RETURN jsonb_build_object(
    'lessons_total', _total_lessons, 'lessons_done', _done_lessons,
    'exams_total', _total_exams, 'exams_passed', _passed_exams,
    'percent', CASE WHEN (_total_lessons + _total_exams) = 0 THEN 0
      ELSE round(((_done_lessons + _passed_exams)::numeric / (_total_lessons + _total_exams)) * 100) END,
    'training_complete', (_total_lessons > 0 AND _done_lessons >= _total_lessons AND _passed_exams >= _total_exams)
  );
END; $$;

-- ============ RPCs ============
CREATE OR REPLACE FUNCTION public.staff_program_apply(
  _motivation text, _contribution text, _experience text, _tech text, _conflict text, _trust text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid; _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  IF public.is_moderator_or_higher(_uid) THEN RAISE EXCEPTION 'Ya formas parte del Staff'; END IF;
  IF EXISTS (SELECT 1 FROM public.staff_applications WHERE user_id = _uid AND status IN ('pending','reviewing','accepted')) THEN
    RAISE EXCEPTION 'Ya tienes una solicitud activa';
  END IF;
  IF coalesce(length(trim(_motivation)),0) < 30 OR coalesce(length(trim(_contribution)),0) < 30
     OR coalesce(length(trim(_conflict)),0) < 30 OR coalesce(length(trim(_trust)),0) < 30 THEN
    RAISE EXCEPTION 'Responde con más detalle (mínimo 30 caracteres por respuesta clave)';
  END IF;
  INSERT INTO public.staff_applications(user_id, motivation, contribution, experience, tech_knowledge, conflict_answer, trust_answer, accepted_rules)
  VALUES (_uid, trim(_motivation), trim(_contribution), coalesce(trim(_experience),''), coalesce(trim(_tech),''), trim(_conflict), trim(_trust), true)
  RETURNING id INTO _id;
  PERFORM public.staff_program_log(_id, _uid, 'application_created', 'pending', NULL);
  PERFORM public.create_notification(_uid, 'staff_program', 'Solicitud enviada',
    'Tu solicitud para el Programa de Moderadores fue recibida. Te avisaremos cuando sea revisada.', '/programa-staff');
  RETURN _id;
END; $$;

CREATE OR REPLACE FUNCTION public.staff_program_review(_id uuid, _status text, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _app public.staff_applications;
BEGIN
  IF NOT public.is_admin_or_higher(auth.uid()) THEN RAISE EXCEPTION 'Sin permisos'; END IF;
  IF _status NOT IN ('reviewing','accepted','rejected','closed') THEN RAISE EXCEPTION 'Estado inválido'; END IF;
  SELECT * INTO _app FROM public.staff_applications WHERE id = _id;
  IF _app.id IS NULL THEN RAISE EXCEPTION 'Solicitud no encontrada'; END IF;
  IF _app.user_id = auth.uid() THEN RAISE EXCEPTION 'No puedes revisar tu propia solicitud'; END IF;

  UPDATE public.staff_applications SET
    status = _status,
    phase = CASE WHEN _status = 'accepted' THEN 'training'
                 WHEN _status = 'rejected' THEN 'rejected'
                 ELSE phase END,
    reviewed_by = auth.uid(), reviewed_at = now(), review_note = coalesce(_note, review_note)
  WHERE id = _id;

  PERFORM public.staff_program_log(_id, _app.user_id, 'application_' || _status, _status, _note);

  IF _status = 'accepted' THEN
    PERFORM public.create_notification(_app.user_id, 'staff_program', 'Solicitud aceptada',
      'Fuiste aceptado como Candidato a Moderador. Ya puedes acceder a la Academia de Staff.', '/programa-staff');
  ELSIF _status = 'rejected' THEN
    PERFORM public.create_notification(_app.user_id, 'staff_program', 'Solicitud rechazada',
      coalesce(_note, 'Tu solicitud no fue aceptada en esta ocasión.'), '/programa-staff');
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.staff_complete_lesson(_lesson_id uuid, _seconds integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _min int; _app public.staff_applications;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  SELECT * INTO _app FROM public.staff_applications WHERE user_id = _uid AND status = 'accepted';
  IF _app.id IS NULL THEN RAISE EXCEPTION 'No eres candidato activo'; END IF;
  SELECT min_seconds INTO _min FROM public.staff_lessons WHERE id = _lesson_id;
  IF _min IS NULL THEN RAISE EXCEPTION 'Clase no encontrada'; END IF;
  IF coalesce(_seconds,0) < _min THEN RAISE EXCEPTION 'Debes dedicar al menos % segundos a esta clase', _min; END IF;
  INSERT INTO public.staff_lesson_progress(user_id, lesson_id, seconds_spent)
  VALUES (_uid, _lesson_id, _seconds)
  ON CONFLICT (user_id, lesson_id) DO UPDATE SET seconds_spent = GREATEST(public.staff_lesson_progress.seconds_spent, EXCLUDED.seconds_spent);
  PERFORM public.staff_program_log(_app.id, _uid, 'lesson_completed', 'ok', _lesson_id::text);
  RETURN public.staff_program_progress(_uid);
END; $$;

CREATE OR REPLACE FUNCTION public.staff_get_exam(_exam_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _qs jsonb; _exam public.staff_exams; _attempts int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  IF NOT public.is_moderator_or_higher(_uid)
     AND NOT EXISTS (SELECT 1 FROM public.staff_applications WHERE user_id = _uid AND status = 'accepted') THEN
    RAISE EXCEPTION 'Sin acceso';
  END IF;
  SELECT * INTO _exam FROM public.staff_exams WHERE id = _exam_id;
  IF _exam.id IS NULL THEN RAISE EXCEPTION 'Examen no encontrado'; END IF;
  SELECT count(*) INTO _attempts FROM public.staff_exam_attempts WHERE user_id = _uid AND exam_id = _exam_id;
  SELECT coalesce(jsonb_agg(jsonb_build_object('id', id, 'kind', kind, 'prompt', prompt, 'options', options) ORDER BY position), '[]'::jsonb)
    INTO _qs FROM public.staff_exam_questions WHERE exam_id = _exam_id;
  RETURN jsonb_build_object('exam', to_jsonb(_exam), 'questions', _qs, 'attempts_used', _attempts);
END; $$;

CREATE OR REPLACE FUNCTION public.staff_submit_exam(_exam_id uuid, _answers jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid(); _exam public.staff_exams; _app public.staff_applications;
  _attempts int; _total int := 0; _ok int := 0; _score int; _passed boolean;
  _detail jsonb := '[]'::jsonb; _q record; _given text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  SELECT * INTO _app FROM public.staff_applications WHERE user_id = _uid AND status = 'accepted';
  IF _app.id IS NULL THEN RAISE EXCEPTION 'No eres candidato activo'; END IF;
  SELECT * INTO _exam FROM public.staff_exams WHERE id = _exam_id;
  IF _exam.id IS NULL THEN RAISE EXCEPTION 'Examen no encontrado'; END IF;
  IF EXISTS (SELECT 1 FROM public.staff_exam_attempts WHERE user_id = _uid AND exam_id = _exam_id AND passed) THEN
    RAISE EXCEPTION 'Ya aprobaste este examen';
  END IF;
  SELECT count(*) INTO _attempts FROM public.staff_exam_attempts WHERE user_id = _uid AND exam_id = _exam_id;
  IF _attempts >= _exam.max_attempts THEN
    RAISE EXCEPTION 'Alcanzaste el máximo de intentos. Solicita revisión del Staff.';
  END IF;

  FOR _q IN SELECT id, correct_answer, explanation, prompt FROM public.staff_exam_questions WHERE exam_id = _exam_id ORDER BY position LOOP
    _total := _total + 1;
    _given := _answers ->> _q.id::text;
    IF _given IS NOT NULL AND lower(trim(_given)) = lower(trim(_q.correct_answer)) THEN _ok := _ok + 1; END IF;
    _detail := _detail || jsonb_build_object('question_id', _q.id, 'prompt', _q.prompt,
      'correct', (_given IS NOT NULL AND lower(trim(_given)) = lower(trim(_q.correct_answer))),
      'explanation', _q.explanation);
  END LOOP;
  IF _total = 0 THEN RAISE EXCEPTION 'Examen sin preguntas'; END IF;

  _score := round((_ok::numeric / _total) * 100);
  _passed := _score >= _exam.pass_score;

  INSERT INTO public.staff_exam_attempts(user_id, exam_id, attempt_number, score, passed, answers, detail)
  VALUES (_uid, _exam_id, _attempts + 1, _score, _passed, _answers, _detail);

  PERFORM public.staff_program_log(_app.id, _uid, CASE WHEN _passed THEN 'exam_passed' ELSE 'exam_failed' END,
    _score::text || '%', _exam.title);
  PERFORM public.create_notification(_uid, 'staff_program',
    CASE WHEN _passed THEN 'Examen aprobado' ELSE 'Examen no aprobado' END,
    _exam.title || ' — puntuación: ' || _score || '%', '/academia-staff');

  IF (public.staff_program_progress(_uid) ->> 'training_complete')::boolean AND _app.phase = 'training' THEN
    UPDATE public.staff_applications SET phase = 'pending_evaluation' WHERE id = _app.id;
    PERFORM public.staff_program_log(_app.id, _uid, 'training_completed', 'pending_evaluation', NULL);
    PERFORM public.create_notification(_uid, 'staff_program', 'Formación completada',
      'Completaste la formación. Tu candidatura pasa a evaluación del Staff.', '/programa-staff');
  END IF;

  RETURN jsonb_build_object('score', _score, 'passed', _passed, 'detail', _detail, 'attempts_used', _attempts + 1);
END; $$;

CREATE OR REPLACE FUNCTION public.staff_program_check_training(_user uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _app public.staff_applications; _prog jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  IF _user <> auth.uid() AND NOT public.is_moderator_or_higher(auth.uid()) THEN RAISE EXCEPTION 'Sin permisos'; END IF;
  _prog := public.staff_program_progress(_user);
  SELECT * INTO _app FROM public.staff_applications WHERE user_id = _user AND status = 'accepted';
  IF _app.id IS NOT NULL AND _app.phase = 'training' AND (_prog ->> 'training_complete')::boolean THEN
    UPDATE public.staff_applications SET phase = 'pending_evaluation' WHERE id = _app.id;
    PERFORM public.staff_program_log(_app.id, _user, 'training_completed', 'pending_evaluation', NULL);
    PERFORM public.create_notification(_user, 'staff_program', 'Formación completada',
      'Completaste la formación. Tu candidatura pasa a evaluación del Staff.', '/programa-staff');
  END IF;
  RETURN _prog;
END; $$;

CREATE OR REPLACE FUNCTION public.staff_program_evaluate(
  _application_id uuid, _knowledge int, _responsibility int, _moderation int,
  _communication int, _security int, _ethics int, _note text, _recommendation text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _app public.staff_applications; _id uuid;
BEGIN
  IF NOT public.is_admin_or_higher(auth.uid()) THEN RAISE EXCEPTION 'Sin permisos'; END IF;
  SELECT * INTO _app FROM public.staff_applications WHERE id = _application_id;
  IF _app.id IS NULL THEN RAISE EXCEPTION 'Solicitud no encontrada'; END IF;
  IF _app.user_id = auth.uid() THEN RAISE EXCEPTION 'No puedes evaluarte a ti mismo'; END IF;
  IF _recommendation NOT IN ('approve','reject','extra_training') THEN RAISE EXCEPTION 'Recomendación inválida'; END IF;

  INSERT INTO public.staff_evaluations(application_id, evaluator_id, knowledge, responsibility, moderation, communication, security, ethics, overall_note, recommendation)
  VALUES (_application_id, auth.uid(), _knowledge, _responsibility, _moderation, _communication, _security, _ethics, _note, _recommendation)
  RETURNING id INTO _id;

  PERFORM public.staff_program_log(_application_id, _app.user_id, 'evaluation_created', _recommendation, _note);
  PERFORM public.create_notification(_app.user_id, 'staff_program', 'Evaluación registrada',
    'El Staff registró una evaluación de tu candidatura.', '/programa-staff');
  RETURN _id;
END; $$;

CREATE OR REPLACE FUNCTION public.staff_program_decide(_application_id uuid, _decision text, _note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _app public.staff_applications; _prog jsonb;
BEGIN
  IF NOT public.is_admin_or_higher(auth.uid()) THEN RAISE EXCEPTION 'Sin permisos'; END IF;
  IF _decision NOT IN ('approve','reject','extra_training') THEN RAISE EXCEPTION 'Decisión inválida'; END IF;
  SELECT * INTO _app FROM public.staff_applications WHERE id = _application_id;
  IF _app.id IS NULL THEN RAISE EXCEPTION 'Solicitud no encontrada'; END IF;
  IF _app.user_id = auth.uid() THEN RAISE EXCEPTION 'No puedes decidir sobre tu propia candidatura'; END IF;
  IF _app.status <> 'accepted' THEN RAISE EXCEPTION 'La candidatura no está activa'; END IF;

  IF _decision = 'approve' THEN
    _prog := public.staff_program_progress(_app.user_id);
    IF NOT (_prog ->> 'training_complete')::boolean THEN
      RAISE EXCEPTION 'El candidato no ha completado la formación requerida';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.staff_evaluations WHERE application_id = _application_id) THEN
      RAISE EXCEPTION 'Falta la evaluación final del Staff';
    END IF;
    INSERT INTO public.user_roles(user_id, role) VALUES (_app.user_id, 'moderator')
      ON CONFLICT (user_id, role) DO NOTHING;
    INSERT INTO public.staff_actions(actor_id, action, target_user_id, reason, result)
      VALUES (auth.uid(), 'assign_moderator', _app.user_id, coalesce(_note, 'Programa de formación de Staff'), 'approved');
    UPDATE public.staff_applications SET status = 'closed', phase = 'approved', decided_by = auth.uid(), decided_at = now(), review_note = coalesce(_note, review_note)
      WHERE id = _application_id;
    UPDATE public.profiles SET joined_staff_at = coalesce(joined_staff_at, now()) WHERE id = _app.user_id;
    PERFORM public.staff_program_log(_application_id, _app.user_id, 'candidate_approved', 'moderator', _note);
    PERFORM public.create_notification(_app.user_id, 'staff_program', '¡Aprobado como Moderador!',
      'Completaste el programa y fuiste promovido a Moderador. Bienvenido al Staff.', '/staff');
  ELSIF _decision = 'reject' THEN
    UPDATE public.staff_applications SET status = 'rejected', phase = 'rejected', decided_by = auth.uid(), decided_at = now(), review_note = coalesce(_note, review_note)
      WHERE id = _application_id;
    PERFORM public.staff_program_log(_application_id, _app.user_id, 'candidate_rejected', 'rejected', _note);
    PERFORM public.create_notification(_app.user_id, 'staff_program', 'Candidatura rechazada',
      coalesce(_note, 'Tu candidatura no fue aprobada.'), '/programa-staff');
  ELSE
    UPDATE public.staff_applications SET phase = 'extra_training', review_note = coalesce(_note, review_note) WHERE id = _application_id;
    PERFORM public.staff_program_log(_application_id, _app.user_id, 'extra_training_required', 'extra_training', _note);
    PERFORM public.create_notification(_app.user_id, 'staff_program', 'Formación adicional requerida',
      coalesce(_note, 'El Staff solicita formación adicional antes de decidir.'), '/academia-staff');
  END IF;
END; $$;

-- ============ EXECUTE PRIVILEGES ============
REVOKE EXECUTE ON FUNCTION public.staff_program_log(uuid, uuid, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.staff_program_progress(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_program_apply(text, text, text, text, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_program_review(uuid, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_complete_lesson(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_get_exam(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_submit_exam(uuid, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_program_check_training(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_program_evaluate(uuid, int, int, int, int, int, int, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.staff_program_decide(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_program_progress(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_program_apply(text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_program_review(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_complete_lesson(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_get_exam(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_submit_exam(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_program_check_training(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_program_evaluate(uuid, int, int, int, int, int, int, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.staff_program_decide(uuid, text, text) TO authenticated;

-- ============ SEED: MODULES / LESSONS / EXAMS ============
INSERT INTO public.staff_modules (slug, position, title, description, icon) VALUES
 ('reglas', 1, 'Módulo 1 — Reglas de ITSABDIAS', 'Normas de la comunidad, conducta del Staff y límites de los Moderadores.', 'book'),
 ('moderacion', 2, 'Módulo 2 — Moderación', 'Cómo revisar reportes, analizar evidencias y documentar decisiones.', 'gavel'),
 ('sanciones', 3, 'Módulo 3 — Sanciones', 'Advertencias, silencios, suspensiones y bans: qué puede hacer cada rango.', 'shield'),
 ('reportes', 4, 'Módulo 4 — Reportes', 'Flujo real del sistema de reportes, duplicados, falsos y escalado.', 'flag'),
 ('seguridad', 5, 'Módulo 5 — Seguridad', 'Privacidad, protección de cuentas y uso responsable de herramientas.', 'lock'),
 ('comunicacion', 6, 'Módulo 6 — Comunicación', 'Cómo responder, desescalar conflictos y mantener profesionalismo.', 'message'),
 ('nexus', 7, 'Módulo 7 — NEXUS', 'Uso correcto de NEXUS como asistente, nunca como decisor.', 'bot'),
 ('etica', 8, 'Módulo 8 — Ética del Staff', 'Imparcialidad, responsabilidad y respeto a la jerarquía.', 'scale');

INSERT INTO public.staff_lessons (module_id, position, title, description, content, examples, key_points, min_seconds)
SELECT m.id, v.position, v.title, v.description, v.content, v.examples, v.key_points, v.min_seconds
FROM (VALUES
 ('reglas',1,'Las normas de la comunidad','Qué se permite y qué no en ITSABDIAS.',
  'ITSABDIAS es una comunidad técnica. Las normas existen para que cualquier persona pueda aprender y publicar sin recibir acoso, spam ni contenido inapropiado. Como Staff, tu trabajo no es imponer tu opinión: es aplicar la norma escrita de forma consistente. Antes de actuar, identifica SIEMPRE qué norma concreta se incumplió y guarda la evidencia. Si no puedes nombrar la norma, no hay sanción.',
  'Un usuario publica un enlace de afiliado repetido en 6 publicaciones: es spam. Un usuario responde con un comentario duro pero técnico: no es acoso, es desacuerdo.',
  'Aplica normas escritas, no opiniones. Sin norma identificada no hay sanción. Documenta siempre.',60),
 ('reglas',2,'Conducta y límites del Staff','Qué NO puede hacer un Moderador.',
  'Un Moderador tiene herramientas limitadas: advertir, silenciar, suspender temporalmente y gestionar reportes. NO puede otorgar rangos, NO puede banear permanentemente por su cuenta (debe solicitarlo al Founder) y NO puede intervenir en casos donde esté personalmente implicado. Ese último punto es el conflicto de interés: si el reporte te involucra a ti, a un amigo cercano o a un usuario con el que discutiste, escala el caso a un Administrador.',
  'Te reportan a ti mismo: escalas. Reportan a alguien con quien discutiste ayer: escalas.',
  'Moderador ≠ Administrador ≠ Founder. Conflicto de interés = escalar, no actuar.',60),
 ('moderacion',1,'Revisar un reporte correctamente','El método de revisión paso a paso.',
  'Revisar un reporte tiene cuatro pasos: 1) leer el motivo y la descripción; 2) abrir el contenido reportado y verificar que sigue existiendo y dice lo que el reporte afirma; 3) revisar la evidencia y la captura adjunta; 4) revisar el historial del usuario reportado (advertencias y sanciones previas). Solo después decides. Una decisión sin verificar el contenido original es una decisión inválida.',
  'El reporte dice "insultos" pero el comentario solo critica el código: se descarta como falso reporte.',
  'Verifica el contenido original. Revisa el historial. Decide al final, nunca al principio.',60),
 ('moderacion',2,'Imparcialidad y documentación','Cómo dejar constancia de tus decisiones.',
  'Cada acción que tomas queda registrada en el historial inmutable. Escribe siempre un motivo claro y objetivo: qué norma se rompió, qué evidencia lo demuestra y qué medida aplicaste. Un motivo como "molesta" no sirve; "spam reiterado, 6 publicaciones idénticas en 10 minutos" sí. La documentación protege al usuario, te protege a ti y permite que un Administrador revise tu criterio.',
  'Motivo correcto: "Acoso — mensajes dirigidos a @user en 3 comentarios, capturas adjuntas en el reporte #42".',
  'Motivo objetivo + evidencia + medida. El historial es inmutable.',60),
 ('sanciones',1,'Escala de sanciones','De la advertencia al ban permanente.',
  'La escala normal es: advertencia → silencio → suspensión temporal → ban temporal → solicitud de ban permanente. Se sube de nivel por reincidencia o por gravedad. La proporcionalidad importa: una primera infracción leve casi nunca justifica una suspensión. El ban permanente NUNCA lo aplica un Moderador: se solicita y el Founder aprueba o rechaza.',
  'Primer spam: advertencia. Tercer spam: silencio 24h. Acoso grave con pruebas: suspensión y escalado.',
  'Proporcionalidad y reincidencia. El ban permanente solo lo aprueba el Founder.',60),
 ('sanciones',2,'Duraciones y restauración','Cómo funcionan los tiempos reales.',
  'Las sanciones temporales tienen fecha de fin y el sistema restaura la cuenta automáticamente al expirar. No debes "olvidar" levantar una sanción manualmente ni extenderla sin motivo nuevo. Si una sanción fue un error, se revoca y queda registrada como revocada: el historial no se borra jamás.',
  'Suspensión de 7 días aplicada por error: se revoca; el registro queda visible como "revoked".',
  'El sistema restaura solo. Los errores se revocan, no se borran.',60),
 ('reportes',1,'Duplicados, falsos y escalado','Clasificar antes de actuar.',
  'Muchos reportes son duplicados del mismo incidente: márcalos como duplicados enlazando al original en vez de sancionar dos veces. Otros son falsos: usados como arma contra otro usuario; márcalos como reporte falso, porque el abuso del sistema de reportes también es sancionable. Escala cuando: hay implicación personal, el caso afecta a otro miembro del Staff, hay amenazas reales o se pide ban permanente.',
  'Cinco reportes sobre el mismo comentario: uno se procesa, cuatro se marcan como duplicados.',
  'Duplicado ≠ falso. Escala amenazas, casos con Staff implicado y bans permanentes.',60),
 ('reportes',2,'Prioridades','Qué se atiende primero.',
  'Prioridad crítica: amenazas, doxxing, contenido ilegal. Alta: acoso dirigido y suplantación. Normal: spam y contenido inapropiado. Baja: desacuerdos y quejas menores. La prioridad determina el orden de la cola, no la severidad de la sanción; son decisiones distintas.',
  'Doxxing → crítica y escalado inmediato, aunque el usuario no tenga historial.',
  'Prioridad = urgencia de atención, no gravedad de la sanción.',60),
 ('seguridad',1,'Privacidad de los usuarios','Información que nunca se comparte.',
  'Como Staff puedes ver datos que los usuarios normales no ven: reportes, historiales y evidencias. Esa información es confidencial. Nunca la compartas fuera del panel, nunca publiques capturas de un reporte y nunca reveles quién reportó a quién. Filtrar esa información es motivo de expulsión inmediata del Staff.',
  'Un usuario te pregunta quién lo reportó: no se revela, bajo ninguna circunstancia.',
  'La identidad del reportante es confidencial. No se comparten evidencias fuera del panel.',60),
 ('seguridad',2,'Uso responsable de herramientas','Menor privilegio, siempre.',
  'Usa la herramienta mínima necesaria para resolver el caso. No abras datos de usuarios sin un reporte que lo justifique, no pruebes acciones administrativas "para ver qué pasa" y protege tu propia cuenta: una cuenta de Staff comprometida es un riesgo para toda la comunidad. Activa medidas de seguridad y no reutilices contraseñas.',
  'Necesitas ver un comentario: abre el reporte, no el historial completo del usuario.',
  'Principio de menor privilegio. Protege tu cuenta de Staff.',60),
 ('comunicacion',1,'Responder a usuarios','Tono profesional y claro.',
  'Responde siempre con hechos: qué pasó, qué norma aplica, qué medida se tomó y qué puede hacer el usuario. Nada de sarcasmo, nada de discusiones públicas. Si el usuario insiste o se altera, no escales el tono: repite la información una vez y cierra la conversación indicando la vía correcta de apelación.',
  '"Tu publicación fue eliminada por spam (norma 3). Puedes apelar abriendo un ticket de ayuda."',
  'Hechos, norma, medida, vía de apelación. Nunca discutas públicamente.',60),
 ('comunicacion',2,'Desescalar conflictos','Bajar la temperatura.',
  'En un conflicto entre dos usuarios, separa el problema de las personas: cierra o limita el hilo, habla con cada parte por separado y evita dar la razón públicamente. Si el conflicto continúa tras la intervención, aplica medidas temporales iguales para ambas partes y documenta el caso.',
  'Dos usuarios se insultan en un hilo: se limita el hilo, se advierte a ambos y se documenta.',
  'Separa personas del problema. Medidas simétricas cuando la culpa es compartida.',60),
 ('nexus',1,'NEXUS como asistente','Qué puede y qué no puede hacer.',
  'NEXUS puede resumir reportes, organizar información, sugerir prioridades y detectar posibles duplicados. NEXUS NO decide sanciones, NO aprueba bans y NO sustituye tu criterio. Sus sugerencias son un punto de partida que debes verificar contra la evidencia real. Si la sugerencia de NEXUS contradice la evidencia, gana la evidencia.',
  'NEXUS sugiere prioridad crítica pero la captura muestra un desacuerdo técnico: bajas la prioridad.',
  'NEXUS asiste, nunca decide. Verifica siempre contra la evidencia.',60),
 ('nexus',2,'Uso honesto durante la formación','Integridad académica.',
  'Puedes usar NEXUS para estudiar, pedir ejemplos y entender por qué una respuesta es correcta. Durante un examen activo, NEXUS no responde preguntas del examen: intentar obtener respuestas es un fallo de ética y queda registrado. La formación mide comprensión real, porque las decisiones que tomarás afectan cuentas de personas reales.',
  'Antes del examen: "NEXUS, explícame la diferencia entre duplicado y falso reporte". Durante: bloqueado.',
  'NEXUS ayuda a estudiar, no a aprobar. Hacer trampa invalida la candidatura.',60),
 ('etica',1,'Imparcialidad y jerarquía','El corazón del programa.',
  'No uses tus permisos para beneficio personal, no favorezcas amigos y no sanciones a nadie por motivos personales. Respeta la jerarquía: Moderador → Administrador → Founder. Si no estás de acuerdo con una decisión superior, discútela en privado por los canales del Staff; no la revientes públicamente ni la revoques por tu cuenta.',
  'Un amigo tuyo incumple una norma: escalas el caso a otro miembro del Staff.',
  'Cero favoritismos. Discrepa en privado, respeta la jerarquía.',60),
 ('etica',2,'Responsabilidad de tus acciones','Cada acción tiene tu nombre.',
  'Todo lo que haces queda firmado con tu identidad en el historial inmutable. Un Administrador o el Founder pueden auditar tus decisiones en cualquier momento. Ser Staff no es un premio ni un rango decorativo: es una responsabilidad. Si te equivocas, reconócelo, revoca la medida y documéntalo; ocultar un error es mucho más grave que cometerlo.',
  'Suspendiste al usuario equivocado: revocas, notificas y documentas el error.',
  'Tus acciones son auditables. Reconocer errores > ocultarlos.',60)
) AS v(mslug, position, title, description, content, examples, key_points, min_seconds)
JOIN public.staff_modules m ON m.slug = v.mslug;

INSERT INTO public.staff_exams (module_id, slug, title, description, pass_score, max_attempts, position)
SELECT m.id, v.slug, v.title, v.description, 80, 3, v.position
FROM (VALUES
 ('reglas','examen-reglas','Examen 1 — Reglas y conducta del Staff','Evalúa tu comprensión de las normas y los límites del rol.',1),
 ('reportes','examen-moderacion','Examen 2 — Moderación y reportes','Casos prácticos de revisión, duplicados y escalado.',2),
 ('etica','examen-etica','Examen 3 — Sanciones, seguridad y ética','Proporcionalidad, privacidad y conducta del Staff.',3)
) AS v(mslug, slug, title, description, position)
JOIN public.staff_modules m ON m.slug = v.mslug;

INSERT INTO public.staff_exam_questions (exam_id, position, kind, prompt, options, correct_answer, explanation)
SELECT e.id, v.position, v.kind, v.prompt, v.options::jsonb, v.correct_answer, v.explanation
FROM (VALUES
 ('examen-reglas',1,'multiple','Antes de aplicar cualquier sanción, ¿qué debes poder identificar siempre?',
  '["La norma concreta que se incumplió y la evidencia","Cuántos seguidores tiene el usuario","Si el usuario te cae bien","Si otro Moderador ya opinó"]',
  'La norma concreta que se incumplió y la evidencia','Sin norma identificada y evidencia, la sanción es arbitraria e inválida.'),
 ('examen-reglas',2,'boolean','Un Moderador puede aplicar un ban permanente por su cuenta.',
  '["Verdadero","Falso"]','Falso','El ban permanente se solicita y solo el Founder lo aprueba.'),
 ('examen-reglas',3,'case','Te reportan un comentario dirigido a un usuario con el que discutiste ayer. ¿Qué haces?',
  '["Escalar el caso por conflicto de interés","Sancionar rápido antes de que alguien lo vea","Ignorar el reporte","Responder públicamente al usuario"]',
  'Escalar el caso por conflicto de interés','Estar personalmente implicado obliga a escalar, no a actuar.'),
 ('examen-reglas',4,'multiple','¿Cuál es la jerarquía correcta?',
  '["Moderador → Administrador → Founder","Founder → Moderador → Administrador","Administrador → Moderador → Founder","Todos tienen los mismos permisos"]',
  'Moderador → Administrador → Founder','Cada rango tiene permisos distintos y el Founder conserva la autoridad máxima.'),
 ('examen-reglas',5,'boolean','Un motivo de sanción como "me molesta" es suficiente para el historial.',
  '["Verdadero","Falso"]','Falso','El motivo debe ser objetivo: norma, evidencia y medida.'),
 ('examen-moderacion',1,'multiple','Recibes cinco reportes sobre el mismo comentario. ¿Qué haces?',
  '["Procesar uno y marcar los otros como duplicados","Sancionar cinco veces","Descartar todos","Escalar los cinco al Founder"]',
  'Procesar uno y marcar los otros como duplicados','Los duplicados se enlazan al original; no se sanciona varias veces el mismo hecho.'),
 ('examen-moderacion',2,'multiple','El reporte dice "insultos" pero el comentario solo critica el código con dureza técnica.',
  '["Se descarta como reporte falso o improcedente","Se suspende al autor del comentario","Se banea al autor","Se ignora sin registrar nada"]',
  'Se descarta como reporte falso o improcedente','Desacuerdo técnico no es acoso; el uso del reporte como arma también se registra.'),
 ('examen-moderacion',3,'boolean','La prioridad de un reporte determina la severidad de la sanción.',
  '["Verdadero","Falso"]','Falso','La prioridad marca la urgencia de atención; la sanción se decide por norma y proporcionalidad.'),
 ('examen-moderacion',4,'case','Un reporte incluye amenazas reales hacia otro usuario. ¿Qué corresponde?',
  '["Prioridad crítica y escalado inmediato","Advertencia simple","Esperar más reportes","Cerrar el reporte como duplicado"]',
  'Prioridad crítica y escalado inmediato','Las amenazas son casos críticos que se escalan de inmediato.'),
 ('examen-moderacion',5,'multiple','¿Qué NO puede hacer NEXUS?',
  '["Decidir sanciones por sí mismo","Resumir un reporte","Sugerir prioridades","Detectar posibles duplicados"]',
  'Decidir sanciones por sí mismo','NEXUS asiste; la decisión siempre es del Staff autorizado.'),
 ('examen-etica',1,'multiple','Un usuario te pregunta quién lo reportó. ¿Qué haces?',
  '["No revelas la identidad del reportante","Le dices el nombre si insiste","Publicas el reporte","Le muestras la captura"]',
  'No revelas la identidad del reportante','La identidad del reportante y las evidencias son confidenciales.'),
 ('examen-etica',2,'boolean','Si te equivocas al sancionar, lo mejor es borrar el registro para evitar problemas.',
  '["Verdadero","Falso"]','Falso','El historial es inmutable: se revoca la medida y se documenta el error.'),
 ('examen-etica',3,'multiple','Primera infracción leve de spam. ¿Medida proporcional?',
  '["Advertencia","Suspensión de 30 días","Ban permanente","Silencio de 90 días"]',
  'Advertencia','La escala sube por reincidencia o gravedad; una primera falta leve se advierte.'),
 ('examen-etica',4,'case','Un amigo cercano incumple una norma clara. ¿Qué haces?',
  '["Escalas el caso a otro miembro del Staff","Lo dejas pasar","Le avisas para que borre la prueba","Lo sancionas más suave de lo normal"]',
  'Escalas el caso a otro miembro del Staff','Favorecer amigos es conflicto de interés y motivo de expulsión del Staff.'),
 ('examen-etica',5,'boolean','Puedes revisar el historial completo de cualquier usuario aunque no exista un reporte.',
  '["Verdadero","Falso"]','Falso','Rige el principio de menor privilegio: acceso justificado por un caso concreto.')
) AS v(eslug, position, kind, prompt, options, correct_answer, explanation)
JOIN public.staff_exams e ON e.slug = v.eslug;
