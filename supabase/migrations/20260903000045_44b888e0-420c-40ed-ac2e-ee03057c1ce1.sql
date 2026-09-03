GRANT SELECT ON public.staff_exam_questions TO authenticated;
CREATE POLICY "admins read exam questions" ON public.staff_exam_questions
FOR SELECT TO authenticated
USING (public.is_admin_or_higher(auth.uid()));