ALTER TYPE public.staff_action_type ADD VALUE IF NOT EXISTS 'assign_developer';
ALTER TYPE public.staff_action_type ADD VALUE IF NOT EXISTS 'remove_developer';
ALTER TYPE public.staff_action_type ADD VALUE IF NOT EXISTS 'assign_ai_expert';
ALTER TYPE public.staff_action_type ADD VALUE IF NOT EXISTS 'remove_ai_expert';
ALTER TYPE public.staff_action_type ADD VALUE IF NOT EXISTS 'assign_member';
ALTER TYPE public.staff_action_type ADD VALUE IF NOT EXISTS 'remove_member';