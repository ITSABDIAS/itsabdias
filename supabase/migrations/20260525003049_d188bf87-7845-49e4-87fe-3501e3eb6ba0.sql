
-- Projects system
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 2000),
  image_url text,
  category text NOT NULL DEFAULT 'Otro',
  technologies text[] NOT NULL DEFAULT '{}',
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  link_url text,
  status text NOT NULL DEFAULT 'in_progress',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_select_all" ON public.projects FOR SELECT USING (true);
CREATE POLICY "projects_insert_own" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_update_own" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "projects_delete_own" ON public.projects FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER projects_touch BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_projects_user ON public.projects(user_id);
CREATE INDEX idx_projects_created ON public.projects(created_at DESC);

-- Project likes
CREATE TABLE public.project_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);
ALTER TABLE public.project_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_likes_select_all" ON public.project_likes FOR SELECT USING (true);
CREATE POLICY "project_likes_insert_auth" ON public.project_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "project_likes_delete_own" ON public.project_likes FOR DELETE USING (auth.uid() = user_id);

-- Project comments
CREATE TABLE public.project_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_comments_select_all" ON public.project_comments FOR SELECT USING (true);
CREATE POLICY "project_comments_insert_auth" ON public.project_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "project_comments_update_own" ON public.project_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "project_comments_delete_own" ON public.project_comments FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_project_comments_project ON public.project_comments(project_id);

-- Storage bucket for project images
INSERT INTO storage.buckets (id, name, public) VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "project_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'project-images');

CREATE POLICY "project_images_user_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "project_images_user_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "project_images_user_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-images' AND auth.uid()::text = (storage.foldername(name))[1]
  );
