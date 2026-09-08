DROP POLICY IF EXISTS "tickets_admin_update" ON public.help_tickets;
CREATE POLICY "tickets_staff_update" ON public.help_tickets
  FOR UPDATE TO authenticated
  USING (public.is_moderator_or_higher(auth.uid()))
  WITH CHECK (public.is_moderator_or_higher(auth.uid()));