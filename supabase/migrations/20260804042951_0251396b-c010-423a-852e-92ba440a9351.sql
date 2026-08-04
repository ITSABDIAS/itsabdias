
-- PATHS
CREATE TABLE public.academy_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '🎓',
  color text NOT NULL DEFAULT 'from-neon-purple to-neon-cyan',
  category text NOT NULL DEFAULT 'tecnologia',
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.academy_paths TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_paths TO authenticated;
GRANT ALL ON public.academy_paths TO service_role;
ALTER TABLE public.academy_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "paths public read" ON public.academy_paths FOR SELECT USING (is_published OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder') OR public.has_role(auth.uid(),'moderator'));
CREATE POLICY "paths staff write" ON public.academy_paths FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));

-- COURSES
CREATE TABLE public.academy_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid REFERENCES public.academy_paths(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  level text NOT NULL DEFAULT 'principiante',
  estimated_minutes int NOT NULL DEFAULT 60,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_nexus boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  tags text[] NOT NULL DEFAULT '{}',
  lessons_count int NOT NULL DEFAULT 0,
  students_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.academy_courses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_courses TO authenticated;
GRANT ALL ON public.academy_courses TO service_role;
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses public read" ON public.academy_courses FOR SELECT USING (is_published OR author_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));
CREATE POLICY "courses author insert" ON public.academy_courses FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));
CREATE POLICY "courses author update" ON public.academy_courses FOR UPDATE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder')) WITH CHECK (true);
CREATE POLICY "courses staff delete" ON public.academy_courses FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));

-- LESSONS
CREATE TABLE public.academy_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  position int NOT NULL DEFAULT 1,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  video_url text,
  resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  exercise text,
  tips text,
  common_mistakes text,
  summary text,
  duration_minutes int NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX academy_lessons_course_idx ON public.academy_lessons(course_id, position);
GRANT SELECT ON public.academy_lessons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_lessons TO authenticated;
GRANT ALL ON public.academy_lessons TO service_role;
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons public read" ON public.academy_lessons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.academy_courses c WHERE c.id = course_id AND (c.is_published OR c.author_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder')))
);
CREATE POLICY "lessons author write" ON public.academy_lessons FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.academy_courses c WHERE c.id = course_id AND (c.author_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder')))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.academy_courses c WHERE c.id = course_id AND (c.author_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder')))
);

-- ENROLLMENTS
CREATE TABLE public.academy_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  progress_percent int NOT NULL DEFAULT 0,
  last_lesson_id uuid,
  minutes_studied int NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_enrollments TO authenticated;
GRANT ALL ON public.academy_enrollments TO service_role;
ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enroll own" ON public.academy_enrollments FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- LESSON PROGRESS
CREATE TABLE public.academy_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.academy_lessons(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_lesson_progress TO authenticated;
GRANT ALL ON public.academy_lesson_progress TO service_role;
ALTER TABLE public.academy_lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lesson progress own" ON public.academy_lesson_progress FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- CERTIFICATES
CREATE TABLE public.academy_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
GRANT SELECT ON public.academy_certificates TO anon;
GRANT SELECT ON public.academy_certificates TO authenticated;
GRANT ALL ON public.academy_certificates TO service_role;
ALTER TABLE public.academy_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certificates public verify" ON public.academy_certificates FOR SELECT USING (true);

-- updated_at triggers
CREATE TRIGGER academy_paths_updated BEFORE UPDATE ON public.academy_paths FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER academy_courses_updated BEFORE UPDATE ON public.academy_courses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER academy_lessons_updated BEFORE UPDATE ON public.academy_lessons FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER academy_enrollments_updated BEFORE UPDATE ON public.academy_enrollments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- lessons_count maintenance
CREATE OR REPLACE FUNCTION public.academy_sync_lessons_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.academy_courses c
     SET lessons_count = (SELECT count(*) FROM public.academy_lessons l WHERE l.course_id = c.id)
   WHERE c.id = COALESCE(NEW.course_id, OLD.course_id);
  RETURN NULL;
END; $$;
CREATE TRIGGER academy_lessons_count AFTER INSERT OR DELETE ON public.academy_lessons
FOR EACH ROW EXECUTE FUNCTION public.academy_sync_lessons_count();

-- students_count maintenance
CREATE OR REPLACE FUNCTION public.academy_sync_students_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.academy_courses c
     SET students_count = (SELECT count(*) FROM public.academy_enrollments e WHERE e.course_id = c.id)
   WHERE c.id = COALESCE(NEW.course_id, OLD.course_id);
  RETURN NULL;
END; $$;
CREATE TRIGGER academy_students_count AFTER INSERT OR DELETE ON public.academy_enrollments
FOR EACH ROW EXECUTE FUNCTION public.academy_sync_students_count();

-- complete a lesson, recompute progress, issue certificate
CREATE OR REPLACE FUNCTION public.academy_complete_lesson(_lesson_id uuid, _minutes int DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _course uuid;
  _total int;
  _done int;
  _pct int;
  _code text;
  _completed boolean := false;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'No autenticado'; END IF;
  SELECT course_id INTO _course FROM public.academy_lessons WHERE id = _lesson_id;
  IF _course IS NULL THEN RAISE EXCEPTION 'Lección no encontrada'; END IF;

  INSERT INTO public.academy_lesson_progress (user_id, course_id, lesson_id)
  VALUES (_uid, _course, _lesson_id)
  ON CONFLICT (user_id, lesson_id) DO NOTHING;

  SELECT count(*) INTO _total FROM public.academy_lessons WHERE course_id = _course;
  SELECT count(*) INTO _done FROM public.academy_lesson_progress WHERE course_id = _course AND user_id = _uid;
  _pct := CASE WHEN _total = 0 THEN 0 ELSE LEAST(100, ROUND(_done::numeric * 100 / _total)) END;

  INSERT INTO public.academy_enrollments (user_id, course_id, progress_percent, last_lesson_id, minutes_studied, completed_at)
  VALUES (_uid, _course, _pct, _lesson_id, GREATEST(_minutes,0), CASE WHEN _pct >= 100 THEN now() ELSE NULL END)
  ON CONFLICT (user_id, course_id) DO UPDATE
    SET progress_percent = _pct,
        last_lesson_id = _lesson_id,
        minutes_studied = public.academy_enrollments.minutes_studied + GREATEST(_minutes,0),
        completed_at = CASE WHEN _pct >= 100 THEN COALESCE(public.academy_enrollments.completed_at, now()) ELSE NULL END;

  IF _pct >= 100 THEN
    _completed := true;
    SELECT code INTO _code FROM public.academy_certificates WHERE user_id = _uid AND course_id = _course;
    IF _code IS NULL THEN
      _code := 'ITSA-' || upper(substr(encode(gen_random_bytes(6),'hex'),1,10));
      INSERT INTO public.academy_certificates (user_id, course_id, code) VALUES (_uid, _course, _code)
      ON CONFLICT (user_id, course_id) DO NOTHING;
    END IF;
  END IF;

  RETURN jsonb_build_object('progress', _pct, 'completed', _completed, 'certificate', _code);
END; $$;
GRANT EXECUTE ON FUNCTION public.academy_complete_lesson(uuid, int) TO authenticated;

-- enroll helper
CREATE OR REPLACE FUNCTION public.academy_enroll(_course_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.academy_enrollments (user_id, course_id)
  VALUES (auth.uid(), _course_id)
  ON CONFLICT (user_id, course_id) DO NOTHING;
$$;
GRANT EXECUTE ON FUNCTION public.academy_enroll(uuid) TO authenticated;

-- seed learning paths
INSERT INTO public.academy_paths (slug, title, description, icon, color, category, sort_order) VALUES
('programacion','Programación','Desde tu primera línea de código hasta aplicaciones completas.','💻','from-neon-cyan to-neon-blue','programacion',1),
('ia','Inteligencia Artificial','LLMs, prompts, agentes y visión por computador explicados de verdad.','🤖','from-neon-purple to-neon-pink','ai',2),
('roblox','Roblox Studio','Lua, DataStores, RemoteEvents y sistemas de juego profesionales.','🎮','from-neon-red to-neon-orange','roblox',3),
('hardware','Hardware','CPU, GPU, builds, cuellos de botella y optimización real.','🖥','from-neon-blue to-neon-cyan','hardware',4),
('gamedev','Desarrollo de Videojuegos','Unity, Unreal y Godot: del prototipo al juego publicado.','🕹','from-neon-green to-neon-cyan','gamedev',5),
('electricidad','Electricidad y Electrónica','Circuitos, Arduino, sensores y seguridad eléctrica.','⚡','from-neon-yellow to-neon-orange','electricidad',6),
('software','Software e Ingeniería','APIs, bases de datos, arquitectura y DevOps.','🧩','from-neon-purple to-neon-blue','software',7),
('tecnologia','Tecnología','Tendencias, gadgets, ciberseguridad y el futuro.','🌐','from-neon-cyan to-neon-purple','tecnologia',8)
ON CONFLICT (slug) DO NOTHING;
