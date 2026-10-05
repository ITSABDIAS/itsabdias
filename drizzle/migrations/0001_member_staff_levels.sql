ALTER TABLE public.hunter_xp ADD COLUMN IF NOT EXISTS staff_xp integer NOT NULL DEFAULT 0;
ALTER TABLE public.hunter_xp ADD COLUMN IF NOT EXISTS last_daily date;
ALTER TABLE public.hunter_xp ADD COLUMN IF NOT EXISTS streak integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.staff_add_xp(_uid uuid, _xp integer) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO hunter_xp(user_id, staff_xp) VALUES (_uid, greatest(_xp,0))
  ON CONFLICT (user_id) DO UPDATE SET staff_xp = hunter_xp.staff_xp + greatest(_xp,0), updated_at = now();
$$;
REVOKE EXECUTE ON FUNCTION public.staff_add_xp(uuid,integer) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.xp_on_activity() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner uuid;
BEGIN
  IF TG_TABLE_NAME = 'posts' THEN PERFORM hunter_add_xp(NEW.user_id, 10);
  ELSIF TG_TABLE_NAME = 'comments' THEN PERFORM hunter_add_xp(NEW.user_id, 3);
  ELSIF TG_TABLE_NAME = 'project_comments' THEN PERFORM hunter_add_xp(NEW.user_id, 3);
  ELSIF TG_TABLE_NAME = 'projects' THEN PERFORM hunter_add_xp(NEW.user_id, 40);
  ELSIF TG_TABLE_NAME = 'academy_lesson_progress' THEN PERFORM hunter_add_xp(NEW.user_id, 15);
  ELSIF TG_TABLE_NAME = 'academy_certificates' THEN PERFORM hunter_add_xp(NEW.user_id, 150);
  ELSIF TG_TABLE_NAME = 'tutorials' THEN IF NEW.author_id IS NOT NULL THEN PERFORM hunter_add_xp(NEW.author_id, 30); END IF;
  ELSIF TG_TABLE_NAME = 'likes' THEN
    SELECT user_id INTO owner FROM posts WHERE id = NEW.post_id;
    IF owner IS NOT NULL AND owner <> NEW.user_id THEN PERFORM hunter_add_xp(owner, 2); END IF;
  ELSIF TG_TABLE_NAME = 'project_likes' THEN
    SELECT user_id INTO owner FROM projects WHERE id = NEW.project_id;
    IF owner IS NOT NULL AND owner <> NEW.user_id THEN PERFORM hunter_add_xp(owner, 3); END IF;
  ELSIF TG_TABLE_NAME = 'report_actions' THEN IF NEW.staff_id IS NOT NULL THEN PERFORM staff_add_xp(NEW.staff_id, 15); END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.xp_on_activity() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER xp_posts AFTER INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.xp_on_activity();
CREATE TRIGGER xp_comments AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.xp_on_activity();
CREATE TRIGGER xp_project_comments AFTER INSERT ON public.project_comments FOR EACH ROW EXECUTE FUNCTION public.xp_on_activity();
CREATE TRIGGER xp_projects AFTER INSERT ON public.projects FOR EACH ROW EXECUTE FUNCTION public.xp_on_activity();
CREATE TRIGGER xp_lessons AFTER INSERT ON public.academy_lesson_progress FOR EACH ROW EXECUTE FUNCTION public.xp_on_activity();
CREATE TRIGGER xp_certs AFTER INSERT ON public.academy_certificates FOR EACH ROW EXECUTE FUNCTION public.xp_on_activity();
CREATE TRIGGER xp_tutorials AFTER INSERT ON public.tutorials FOR EACH ROW EXECUTE FUNCTION public.xp_on_activity();
CREATE TRIGGER xp_likes AFTER INSERT ON public.likes FOR EACH ROW EXECUTE FUNCTION public.xp_on_activity();
CREATE TRIGGER xp_project_likes AFTER INSERT ON public.project_likes FOR EACH ROW EXECUTE FUNCTION public.xp_on_activity();
CREATE TRIGGER xp_report_actions AFTER INSERT ON public.report_actions FOR EACH ROW EXECUTE FUNCTION public.xp_on_activity();

CREATE OR REPLACE FUNCTION public.xp_on_staff_review() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_TABLE_NAME = 'bug_reports' AND OLD.reviewed_by IS NULL AND NEW.reviewed_by IS NOT NULL THEN
    PERFORM staff_add_xp(NEW.reviewed_by, 10);
  ELSIF TG_TABLE_NAME = 'help_tickets' AND OLD.admin_response IS NULL AND NEW.admin_response IS NOT NULL AND auth.uid() IS NOT NULL AND auth.uid() <> NEW.user_id THEN
    PERFORM staff_add_xp(auth.uid(), 12);
  END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.xp_on_staff_review() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER xp_bug_review AFTER UPDATE ON public.bug_reports FOR EACH ROW EXECUTE FUNCTION public.xp_on_staff_review();
CREATE TRIGGER xp_ticket_answer AFTER UPDATE ON public.help_tickets FOR EACH ROW EXECUTE FUNCTION public.xp_on_staff_review();

CREATE OR REPLACE FUNCTION public.claim_daily_xp() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r hunter_xp; s int; reward int;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Inicia sesión'; END IF;
  INSERT INTO hunter_xp(user_id) VALUES (auth.uid()) ON CONFLICT DO NOTHING;
  SELECT * INTO r FROM hunter_xp WHERE user_id = auth.uid() FOR UPDATE;
  IF r.last_daily = current_date THEN RAISE EXCEPTION 'Ya reclamaste hoy'; END IF;
  s := CASE WHEN r.last_daily = current_date - 1 THEN r.streak + 1 ELSE 1 END;
  reward := 20 + least(s, 30) * 5;
  UPDATE hunter_xp SET xp = xp + reward, last_daily = current_date, streak = s, updated_at = now() WHERE user_id = auth.uid();
  RETURN jsonb_build_object('reward', reward, 'streak', s);
END $$;
REVOKE EXECUTE ON FUNCTION public.claim_daily_xp() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_daily_xp() TO authenticated;