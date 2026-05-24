
-- Catálogo de rangos
CREATE TABLE IF NOT EXISTS public.ranks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#22d3ee',
  icon text,
  priority int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ranks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ranks_select_all" ON public.ranks
  FOR SELECT USING (true);

CREATE POLICY "ranks_founder_manage" ON public.ranks
  FOR ALL USING (public.has_role(auth.uid(), 'founder'))
  WITH CHECK (public.has_role(auth.uid(), 'founder'));

INSERT INTO public.ranks (slug, name, description, color, icon, priority) VALUES
  ('founder',   'Founder',       'Creador y dueño de la plataforma', '#ff00aa', 'crown',    100),
  ('admin',     'Administrador', 'Gestiona la comunidad y soporte',  '#a855f7', 'shield',    80),
  ('moderator', 'Moderador',     'Modera la comunidad',              '#3b82f6', 'gavel',     60),
  ('premium',   'Premium',       'Miembro premium con beneficios',   '#facc15', 'sparkles',  40),
  ('user',      'Miembro',       'Usuario estándar',                 '#22d3ee', 'user',      10)
ON CONFLICT (slug) DO NOTHING;

-- Suscripciones premium
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'inactive',
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subs_select_own_or_staff" ON public.subscriptions
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'founder')
  );

CREATE POLICY "subs_insert_own" ON public.subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "subs_update_staff" ON public.subscriptions
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'founder')
  );

CREATE TRIGGER subscriptions_touch_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Founders pueden gestionar roles
DROP POLICY IF EXISTS user_roles_admin_manage ON public.user_roles;
CREATE POLICY "user_roles_staff_manage" ON public.user_roles
  FOR ALL USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'founder')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'founder')
  );
