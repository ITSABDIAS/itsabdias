
-- Roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "user_roles_select_all" ON public.user_roles
  FOR SELECT USING (true);

CREATE POLICY "user_roles_admin_manage" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add ticket status, admin response, updated_at
ALTER TABLE public.help_tickets
  ADD COLUMN status TEXT NOT NULL DEFAULT 'open',
  ADD COLUMN admin_response TEXT,
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Allow admins to update any ticket
CREATE POLICY "tickets_admin_update" ON public.help_tickets
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Bio on profile
ALTER TABLE public.profiles
  ADD COLUMN bio TEXT;

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER tickets_touch_updated
BEFORE UPDATE ON public.help_tickets
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
