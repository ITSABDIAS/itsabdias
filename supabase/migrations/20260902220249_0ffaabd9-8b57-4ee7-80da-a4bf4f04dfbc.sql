-- 1) academy_courses: mirror ownership check in WITH CHECK
DROP POLICY IF EXISTS "courses author update" ON public.academy_courses;
CREATE POLICY "courses author update"
ON public.academy_courses
FOR UPDATE
TO authenticated
USING (
  author_id = auth.uid()
  OR public.has_role(auth.uid(),'admin'::app_role)
  OR public.has_role(auth.uid(),'founder'::app_role)
)
WITH CHECK (
  author_id = auth.uid()
  OR public.has_role(auth.uid(),'admin'::app_role)
  OR public.has_role(auth.uid(),'founder'::app_role)
);

-- 2) help_tickets: enforce immutability of status/admin_response via trigger
CREATE OR REPLACE FUNCTION public.help_tickets_guard_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.is_admin_or_higher(auth.uid()) THEN
    RETURN NEW;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.admin_response IS DISTINCT FROM OLD.admin_response
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'No puedes modificar el estado ni la respuesta del staff';
  END IF;
  RETURN NEW;
END; $$;

REVOKE EXECUTE ON FUNCTION public.help_tickets_guard_update() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS help_tickets_guard ON public.help_tickets;
CREATE TRIGGER help_tickets_guard
BEFORE UPDATE ON public.help_tickets
FOR EACH ROW EXECUTE FUNCTION public.help_tickets_guard_update();

DROP POLICY IF EXISTS "tickets_update_own" ON public.help_tickets;
CREATE POLICY "tickets_update_own"
ON public.help_tickets
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);