REVOKE EXECUTE ON FUNCTION public.is_founder(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_higher(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_moderator_or_higher(UUID) FROM anon;