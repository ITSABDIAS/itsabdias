ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS equipped_avatar text;
CREATE OR REPLACE FUNCTION public.cosmetic_allowed(_uid uuid, _id text, _kind text) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE n int; lvl int; missions int; paid boolean;
BEGIN
 IF _id IS NULL THEN RETURN true; END IF;
 lvl := public.member_level(_uid);
 IF _id ~ '^(frame|bg)-[0-9]{1,3}$' THEN
 n := split_part(_id,'-',2)::int;
 RETURN n BETWEEN 1 AND 100 AND n <= lvl AND ((_kind='frame' AND split_part(_id,'-',1)='frame' AND n%10 IN (5,7)) OR (_kind='background' AND split_part(_id,'-',1)='bg' AND n%10 IN (0,2)));
 END IF;
 IF _kind='avatar' AND _id IN ('avatar-sentinel','avatar-pilot','avatar-prime') THEN
 RETURN lvl >= CASE _id WHEN 'avatar-sentinel' THEN 1 WHEN 'avatar-pilot' THEN 10 ELSE 30 END;
 END IF;
 SELECT EXISTS(SELECT 1 FROM public.subscriptions WHERE user_id=_uid AND plan IN ('premium','plus') AND status='active' AND (expires_at IS NULL OR expires_at>now())) INTO paid;
 IF _id IN ('membership-premium-banner','membership-premium-frame') THEN RETURN paid AND _kind=CASE WHEN _id LIKE '%banner' THEN 'background' ELSE 'frame' END; END IF;
 IF _id IN ('membership-plus-banner','membership-plus-frame') THEN RETURN public.is_plus(_uid) AND _kind=CASE WHEN _id LIKE '%banner' THEN 'background' ELSE 'frame' END; END IF;
 IF _id ~ '^pass-(free|elite)-(frame|bg|avatar)-[0-9]{1,2}$' THEN
 n := split_part(_id,'-',4)::int;
 SELECT count(*) INTO missions FROM public.mission_claims WHERE user_id=_uid;
 RETURN n BETWEEN 1 AND 10 AND missions >= n*2 AND (split_part(_id,'-',2)='free' OR paid) AND _kind=CASE split_part(_id,'-',3) WHEN 'bg' THEN 'background' ELSE split_part(_id,'-',3) END AND split_part(_id,'-',3)=CASE WHEN n%3=1 THEN 'avatar' WHEN n%3=2 THEN 'bg' ELSE 'frame' END;
 END IF;
 RETURN false;
END; $$;
REVOKE ALL ON FUNCTION public.cosmetic_allowed(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.cosmetic_allowed(uuid,text,text) TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.validate_cosmetics() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
 IF NEW.avatar_url IS DISTINCT FROM OLD.avatar_url AND NEW.avatar_url IS NOT NULL THEN RAISE EXCEPTION 'Las nuevas fotos se desbloquean con niveles y misiones'; END IF;
 IF NEW.banner_url IS DISTINCT FROM OLD.banner_url AND NEW.banner_url IS NOT NULL THEN RAISE EXCEPTION 'Los nuevos banners se desbloquean con niveles y misiones'; END IF;
 IF NEW.equipped_frame IS DISTINCT FROM OLD.equipped_frame AND NOT public.cosmetic_allowed(NEW.id,NEW.equipped_frame,'frame') THEN RAISE EXCEPTION 'Marco bloqueado'; END IF;
 IF NEW.equipped_background IS DISTINCT FROM OLD.equipped_background AND NOT public.cosmetic_allowed(NEW.id,NEW.equipped_background,'background') THEN RAISE EXCEPTION 'Banner bloqueado'; END IF;
 IF NEW.equipped_avatar IS DISTINCT FROM OLD.equipped_avatar AND NOT public.cosmetic_allowed(NEW.id,NEW.equipped_avatar,'avatar') THEN RAISE EXCEPTION 'Avatar bloqueado'; END IF;
 RETURN NEW;
END; $$;