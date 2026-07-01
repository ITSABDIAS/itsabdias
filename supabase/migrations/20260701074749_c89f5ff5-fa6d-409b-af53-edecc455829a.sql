
-- Tutorials system
CREATE TABLE IF NOT EXISTS public.tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'principiante' CHECK (level IN ('principiante','intermedio','avanzado')),
  read_minutes INTEGER NOT NULL DEFAULT 5,
  tags TEXT[] NOT NULL DEFAULT '{}',
  cover_url TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  views_count INTEGER NOT NULL DEFAULT 0,
  likes_count INTEGER NOT NULL DEFAULT 0,
  saves_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category, slug)
);
CREATE INDEX IF NOT EXISTS tutorials_category_idx ON public.tutorials(category);
CREATE INDEX IF NOT EXISTS tutorials_created_idx ON public.tutorials(created_at DESC);
CREATE INDEX IF NOT EXISTS tutorials_views_idx ON public.tutorials(views_count DESC);

GRANT SELECT ON public.tutorials TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tutorials TO authenticated;
GRANT ALL ON public.tutorials TO service_role;

ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tutorials are viewable by everyone (not hidden)" ON public.tutorials
  FOR SELECT USING (is_hidden = FALSE OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));
CREATE POLICY "Authors can insert their own tutorials" ON public.tutorials
  FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));
CREATE POLICY "Authors or admins can update tutorials" ON public.tutorials
  FOR UPDATE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));
CREATE POLICY "Authors or admins can delete tutorials" ON public.tutorials
  FOR DELETE TO authenticated USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));

CREATE TRIGGER tutorials_touch BEFORE UPDATE ON public.tutorials
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Likes
CREATE TABLE IF NOT EXISTS public.tutorial_likes (
  tutorial_id UUID NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tutorial_id, user_id)
);
GRANT SELECT ON public.tutorial_likes TO anon, authenticated;
GRANT INSERT, DELETE ON public.tutorial_likes TO authenticated;
GRANT ALL ON public.tutorial_likes TO service_role;
ALTER TABLE public.tutorial_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes viewable by everyone" ON public.tutorial_likes FOR SELECT USING (true);
CREATE POLICY "Users manage own likes" ON public.tutorial_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own likes" ON public.tutorial_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Saves
CREATE TABLE IF NOT EXISTS public.tutorial_saves (
  tutorial_id UUID NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tutorial_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.tutorial_saves TO authenticated;
GRANT ALL ON public.tutorial_saves TO service_role;
ALTER TABLE public.tutorial_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own saves" ON public.tutorial_saves FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own saves" ON public.tutorial_saves FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own saves" ON public.tutorial_saves FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Comments
CREATE TABLE IF NOT EXISTS public.tutorial_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID NOT NULL REFERENCES public.tutorials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tutorial_comments_tutorial_idx ON public.tutorial_comments(tutorial_id, created_at DESC);
GRANT SELECT ON public.tutorial_comments TO anon, authenticated;
GRANT INSERT, DELETE ON public.tutorial_comments TO authenticated;
GRANT ALL ON public.tutorial_comments TO service_role;
ALTER TABLE public.tutorial_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments viewable by everyone" ON public.tutorial_comments FOR SELECT USING (true);
CREATE POLICY "Users insert own comments" ON public.tutorial_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users or admins delete comments" ON public.tutorial_comments FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'founder'));

-- Counter triggers
CREATE OR REPLACE FUNCTION public.tutorial_likes_counter() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN UPDATE public.tutorials SET likes_count = likes_count+1 WHERE id = NEW.tutorial_id; RETURN NEW; END IF;
  IF TG_OP='DELETE' THEN UPDATE public.tutorials SET likes_count = GREATEST(0,likes_count-1) WHERE id = OLD.tutorial_id; RETURN OLD; END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER tutorial_likes_counter_trg AFTER INSERT OR DELETE ON public.tutorial_likes FOR EACH ROW EXECUTE FUNCTION public.tutorial_likes_counter();

CREATE OR REPLACE FUNCTION public.tutorial_saves_counter() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN UPDATE public.tutorials SET saves_count = saves_count+1 WHERE id = NEW.tutorial_id; RETURN NEW; END IF;
  IF TG_OP='DELETE' THEN UPDATE public.tutorials SET saves_count = GREATEST(0,saves_count-1) WHERE id = OLD.tutorial_id; RETURN OLD; END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER tutorial_saves_counter_trg AFTER INSERT OR DELETE ON public.tutorial_saves FOR EACH ROW EXECUTE FUNCTION public.tutorial_saves_counter();

CREATE OR REPLACE FUNCTION public.tutorial_comments_counter() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_OP='INSERT' THEN UPDATE public.tutorials SET comments_count = comments_count+1 WHERE id = NEW.tutorial_id; RETURN NEW; END IF;
  IF TG_OP='DELETE' THEN UPDATE public.tutorials SET comments_count = GREATEST(0,comments_count-1) WHERE id = OLD.tutorial_id; RETURN OLD; END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER tutorial_comments_counter_trg AFTER INSERT OR DELETE ON public.tutorial_comments FOR EACH ROW EXECUTE FUNCTION public.tutorial_comments_counter();

-- View counter RPC (safe, rate not enforced)
CREATE OR REPLACE FUNCTION public.increment_tutorial_view(_id UUID) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.tutorials SET views_count = views_count+1 WHERE id = _id;
END; $$;
GRANT EXECUTE ON FUNCTION public.increment_tutorial_view(UUID) TO anon, authenticated;
