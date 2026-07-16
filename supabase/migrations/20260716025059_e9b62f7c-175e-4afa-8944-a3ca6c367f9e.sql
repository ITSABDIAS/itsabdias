
-- ============ NEWS SYSTEM ============
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  cover_url TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  scheduled_at TIMESTAMPTZ,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  views_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.news TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO authenticated;
GRANT ALL ON public.news TO service_role;

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- Public can read only published, non-hidden, not-scheduled-in-future
CREATE POLICY "news_public_read" ON public.news FOR SELECT
  USING (
    is_hidden = false
    AND (scheduled_at IS NULL OR scheduled_at <= now())
    AND published_at <= now()
  );

CREATE POLICY "news_admin_read_all" ON public.news FOR SELECT TO authenticated
  USING (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "news_admin_insert" ON public.news FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "news_admin_update" ON public.news FOR UPDATE TO authenticated
  USING (public.is_admin_or_higher(auth.uid()))
  WITH CHECK (public.is_admin_or_higher(auth.uid()));

CREATE POLICY "news_admin_delete" ON public.news FOR DELETE TO authenticated
  USING (public.is_admin_or_higher(auth.uid()));

CREATE TRIGGER news_touch_updated_at
  BEFORE UPDATE ON public.news
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX news_published_idx ON public.news (published_at DESC) WHERE is_hidden = false;
CREATE INDEX news_category_idx ON public.news (category);

-- RPC to increment view count safely
CREATE OR REPLACE FUNCTION public.increment_news_view(_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.news SET views_count = views_count + 1 WHERE id = _id;
END; $$;
