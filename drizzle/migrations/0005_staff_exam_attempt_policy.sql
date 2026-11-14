CREATE OR REPLACE FUNCTION public.staff_exam_policy(_uid uuid, _exam_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _plan text; _max int; _wait boolean; _used int; _last timestamptz; _next timestamptz;
BEGIN
  IF public.is_plus(_uid) THEN _plan := 'plus'; _max := 10; _wait := false;
  ELSIF public.is_premium(_uid) THEN _plan := 'premium'; _max := 2; _wait := false;
  ELSE _plan := 'free'; _max := 2; _wait := true; END IF;
  SELECT count(*), max(created_at) INTO _used, _last FROM public.staff_exam_attempts
    WHERE user_id = _uid AND exam_id = _exam_id AND NOT passed;
  IF _wait AND _used >= 1 AND _used < _max THEN _next := _last + interval '2 months'; END IF;
  RETURN jsonb_build_object('plan', _plan, 'max_attempts', _max, 'attempts_used', _used,
    'next_attempt_at', _next, 'can_attempt', _used < _max AND (_next IS NULL OR _next <= now()));
END; $$;
REVOKE ALL ON FUNCTION public.staff_exam_policy(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_exam_policy(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.staff_get_exam(_exam_id uuid)
 RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE _uid uuid := auth.uid(); _qs jsonb; _exam public.staff_exams; _pol jsonb;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  IF NOT public.is_moderator_or_higher(_uid)
     AND NOT EXISTS (SELECT 1 FROM public.staff_applications WHERE user_id = _uid AND status = 'accepted') THEN
    RAISE EXCEPTION 'Sin acceso';
  END IF;
  SELECT * INTO _exam FROM public.staff_exams WHERE id = _exam_id;
  IF _exam.id IS NULL THEN RAISE EXCEPTION 'Examen no encontrado'; END IF;
  _pol := public.staff_exam_policy(_uid, _exam_id);
  SELECT coalesce(jsonb_agg(jsonb_build_object('id', id, 'kind', kind, 'prompt', prompt, 'options', options) ORDER BY position), '[]'::jsonb)
    INTO _qs FROM public.staff_exam_questions WHERE exam_id = _exam_id;
  RETURN jsonb_build_object('exam', to_jsonb(_exam) || jsonb_build_object('max_attempts', _pol->'max_attempts'),
    'questions', _qs, 'attempts_used', _pol->'attempts_used', 'policy', _pol);
END; $function$;

CREATE OR REPLACE FUNCTION public.staff_submit_exam(_exam_id uuid, _answers jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE
  _uid uuid := auth.uid(); _exam public.staff_exams; _app public.staff_applications;
  _attempts int; _total int := 0; _ok int := 0; _score int; _passed boolean; _pol jsonb;
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
  _pol := public.staff_exam_policy(_uid, _exam_id);
  IF (_pol->>'attempts_used')::int >= (_pol->>'max_attempts')::int THEN
    RAISE EXCEPTION 'Ya no te quedan intentos para este examen.';
  END IF;
  IF NOT (_pol->>'can_attempt')::boolean THEN
    RAISE EXCEPTION 'Debes esperar hasta % para volver a intentarlo.', to_char((_pol->>'next_attempt_at')::timestamptz, 'DD/MM/YYYY');
  END IF;
  SELECT count(*) INTO _attempts FROM public.staff_exam_attempts WHERE user_id = _uid AND exam_id = _exam_id;

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
  PERFORM public.staff_program_log(_app.id, _uid, CASE WHEN _passed THEN 'exam_passed' ELSE 'exam_failed' END, _score::text || '%', _exam.title);
  PERFORM public.create_notification(_uid, 'staff_program',
    CASE WHEN _passed THEN 'Examen aprobado' ELSE 'Examen no aprobado' END,
    _exam.title || ' — puntuación: ' || _score || '%', '/academia-staff');
  IF (public.staff_program_progress(_uid) ->> 'training_complete')::boolean AND _app.phase = 'training' THEN
    UPDATE public.staff_applications SET phase = 'pending_evaluation' WHERE id = _app.id;
    PERFORM public.staff_program_log(_app.id, _uid, 'training_completed', 'pending_evaluation', NULL);
    PERFORM public.create_notification(_uid, 'staff_program', 'Formación completada',
      'Completaste la formación. Tu candidatura pasa a evaluación del Staff.', '/programa-staff');
  END IF;
  _pol := public.staff_exam_policy(_uid, _exam_id);
  RETURN jsonb_build_object('score', _score, 'passed', _passed, 'detail', _detail,
    'attempts_used', _pol->'attempts_used', 'policy', _pol);
END; $function$;