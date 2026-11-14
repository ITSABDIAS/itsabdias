ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS equipped_frame text, ADD COLUMN IF NOT EXISTS equipped_background text;

CREATE OR REPLACE FUNCTION public.member_level(_uid uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT coalesce((SELECT max(l) FROM generate_series(1,100) l
    WHERE round(40 * power(greatest(l-1,0), 1.6)) <= coalesce((SELECT xp FROM public.hunter_xp WHERE user_id = _uid), 0)), 1)
$$;
REVOKE ALL ON FUNCTION public.member_level(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.member_level(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.validate_cosmetics()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _lvl int; _need int;
BEGIN
  IF NEW.equipped_frame IS DISTINCT FROM OLD.equipped_frame AND NEW.equipped_frame IS NOT NULL THEN
    IF NEW.equipped_frame !~ '^frame-[0-9]{1,3}$' THEN RAISE EXCEPTION 'Marco no válido'; END IF;
    _need := substring(NEW.equipped_frame from '[0-9]+')::int;
    _lvl := public.member_level(NEW.id);
    IF _need > _lvl THEN RAISE EXCEPTION 'Necesitas el nivel % para usar este marco', _need; END IF;
  END IF;
  IF NEW.equipped_background IS DISTINCT FROM OLD.equipped_background AND NEW.equipped_background IS NOT NULL THEN
    IF NEW.equipped_background !~ '^bg-[0-9]{1,3}$' THEN RAISE EXCEPTION 'Fondo no válido'; END IF;
    _need := substring(NEW.equipped_background from '[0-9]+')::int;
    _lvl := public.member_level(NEW.id);
    IF _need > _lvl THEN RAISE EXCEPTION 'Necesitas el nivel % para usar este fondo', _need; END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS profiles_validate_cosmetics ON public.profiles;
CREATE TRIGGER profiles_validate_cosmetics BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_cosmetics();