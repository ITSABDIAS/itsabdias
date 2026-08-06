
-- Certificates: no public enumeration
DROP POLICY IF EXISTS "certificates public verify" ON public.academy_certificates;

CREATE POLICY "certificates owner read" ON public.academy_certificates
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_moderator_or_higher(auth.uid()));

-- Public verification only by exact code
CREATE OR REPLACE FUNCTION public.verify_certificate(_code text)
RETURNS TABLE(code text, issued_at timestamptz, username text, course_title text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT c.code, c.issued_at, p.username, co.title
  FROM public.academy_certificates c
  LEFT JOIN public.profiles p ON p.id = c.user_id
  LEFT JOIN public.academy_courses co ON co.id = c.course_id
  WHERE c.code = _code
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;

-- user_status: only owner and staff
DROP POLICY IF EXISTS "user_status_read_all" ON public.user_status;

CREATE POLICY "user_status owner or staff read" ON public.user_status
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_moderator_or_higher(auth.uid()));
