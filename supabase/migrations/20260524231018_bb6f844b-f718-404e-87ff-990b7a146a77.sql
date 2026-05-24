
-- Add new app_role enum values (idempotent)
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ai_expert';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'verified';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'member';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ensure slug unique for upsert
CREATE UNIQUE INDEX IF NOT EXISTS ranks_slug_key ON public.ranks(slug);

-- Seed/refresh the rank catalog
INSERT INTO public.ranks (slug, name, description, color, icon, priority) VALUES
  ('founder',   'Founder',       'Creador y dueño de la comunidad ItsaBDias.', '#ff00aa', 'crown',     100),
  ('admin',     'Administrador', 'Equipo que mantiene el orden y soporte.',    '#a855f7', 'shield',    80),
  ('moderator', 'Moderador',     'Modera publicaciones y comentarios.',        '#3b82f6', 'gavel',     60),
  ('developer', 'Developer',     'Contribuye con código al ecosistema.',       '#22d3ee', 'code',      55),
  ('ai_expert', 'Experto IA',    'Experto en inteligencia artificial.',        '#10b981', 'brain',     50),
  ('premium',   'Premium',       'Miembro Premium del círculo interno.',       '#fbbf24', 'sparkles',  40),
  ('verified',  'Verificado',    'Cuenta verificada por el equipo.',           '#06b6d4', 'badge',     30),
  ('member',    'Miembro',       'Miembro de la comunidad.',                   '#94a3b8', 'user',      10)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  priority = EXCLUDED.priority;
