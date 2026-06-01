
-- Fix 1: Restrict subscription self-activation
DROP POLICY IF EXISTS subs_insert_own ON public.subscriptions;
CREATE POLICY subs_insert_own ON public.subscriptions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND status IN ('inactive', 'pending')
    AND plan IN ('free', 'premium')
  );

-- Also restrict regular users from elevating their own subscription via UPDATE.
-- Only staff (existing subs_update_staff policy) should be able to flip status to active.
-- (No user-owned UPDATE policy exists, so nothing to drop here.)

-- Fix 2: Prevent ticket owners from writing admin-only fields
DROP POLICY IF EXISTS tickets_update_own ON public.help_tickets;
CREATE POLICY tickets_update_own ON public.help_tickets
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND status = (SELECT status FROM public.help_tickets t WHERE t.id = help_tickets.id)
    AND admin_response IS NOT DISTINCT FROM (SELECT admin_response FROM public.help_tickets t WHERE t.id = help_tickets.id)
  );
