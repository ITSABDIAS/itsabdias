
DROP TRIGGER IF EXISTS trg_projects_check_ranks ON public.projects;
DROP FUNCTION IF EXISTS public.projects_after_insert_check_ranks();
