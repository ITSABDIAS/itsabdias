
CREATE POLICY user_roles_select_public_badges
ON public.user_roles
FOR SELECT
USING (role IN ('founder','admin','moderator','developer','ai_expert','verified'));
