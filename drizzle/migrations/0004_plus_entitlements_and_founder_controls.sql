CREATE OR REPLACE FUNCTION public.is_plus(_user_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id=_user_id AND plan='plus' AND status='active' AND (expires_at IS NULL OR expires_at>now())) $$;
REVOKE ALL ON FUNCTION public.is_plus(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_plus(uuid) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.sync_premium_role() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF TG_OP='DELETE' THEN DELETE FROM public.user_roles WHERE user_id=OLD.user_id AND role IN ('premium','plus'); RETURN OLD; END IF;
IF NEW.plan IN ('premium','plus') AND NEW.status='active' AND (NEW.expires_at IS NULL OR NEW.expires_at>now()) THEN
INSERT INTO public.user_roles(user_id,role) VALUES(NEW.user_id,'premium') ON CONFLICT DO NOTHING;
IF NEW.plan='plus' THEN INSERT INTO public.user_roles(user_id,role) VALUES(NEW.user_id,'plus') ON CONFLICT DO NOTHING; ELSE DELETE FROM public.user_roles WHERE user_id=NEW.user_id AND role='plus'; END IF;
ELSE DELETE FROM public.user_roles WHERE user_id=NEW.user_id AND role IN ('premium','plus'); END IF; RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.sync_premium_role() FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE FUNCTION public.founder_set_plus(_target uuid, _enabled boolean, _reason text DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE actor uuid:=auth.uid(); BEGIN
IF actor IS NULL OR NOT public.is_founder(actor) THEN RAISE EXCEPTION 'Solo el Founder puede gestionar Plus'; END IF;
IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=_target) THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
IF _enabled THEN
INSERT INTO public.subscriptions(user_id,plan,status,started_at,expires_at) VALUES(_target,'plus','active',now(),NULL) ON CONFLICT(user_id) DO UPDATE SET plan='plus',status='active',started_at=now(),expires_at=NULL,updated_at=now();
ELSE UPDATE public.subscriptions SET plan='premium',updated_at=now() WHERE user_id=_target AND plan='plus'; IF NOT FOUND THEN RAISE EXCEPTION 'El usuario no tiene Plus'; END IF; END IF;
INSERT INTO public.staff_actions(actor_id,action,target_user_id,reason,result) VALUES(actor,CASE WHEN _enabled THEN 'grant_premium'::public.staff_action_type ELSE 'revoke_premium'::public.staff_action_type END,_target,_reason,CASE WHEN _enabled THEN 'Plus concedido sin cobro' ELSE 'Plus retirado; Premium conservado' END);
INSERT INTO public.notifications(user_id,type,title,body,link) VALUES(_target,'premium_grant',CASE WHEN _enabled THEN 'Plus activado' ELSE 'Plus retirado' END,CASE WHEN _enabled THEN 'El Founder te ha concedido Plus sin cobro. Disfruta de todas sus ventajas.' ELSE 'Tu acceso vuelve a Premium; tus conversaciones y datos se conservan.' END,'/premium'); END $$;
REVOKE ALL ON FUNCTION public.founder_set_plus(uuid,boolean,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.founder_set_plus(uuid,boolean,text) TO authenticated;
CREATE TABLE public.nexus_preferences(user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,instructions text NOT NULL DEFAULT '', updated_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT instructions_length CHECK(char_length(instructions)<=2000));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.nexus_preferences TO authenticated;
GRANT ALL ON public.nexus_preferences TO service_role;
ALTER TABLE public.nexus_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_plus_preferences ON public.nexus_preferences FOR ALL TO authenticated USING(auth.uid()=user_id AND public.is_plus(auth.uid())) WITH CHECK(auth.uid()=user_id AND public.is_plus(auth.uid()));