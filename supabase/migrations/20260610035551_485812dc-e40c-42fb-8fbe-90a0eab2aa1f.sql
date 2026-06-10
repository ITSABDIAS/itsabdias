
-- ============================================================
-- 1. Direct messaging: conversations + messages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  last_message_preview text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conv_user_order CHECK (user1_id < user2_id),
  CONSTRAINT conv_unique_pair UNIQUE (user1_id, user2_id)
);

GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conv_select_own" ON public.conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "conv_insert_own" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "conv_update_own" ON public.conversations
  FOR UPDATE TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE TABLE IF NOT EXISTS public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (length(content) BETWEEN 1 AND 4000),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS dm_conv_created_idx ON public.direct_messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS dm_recipient_unread_idx ON public.direct_messages (recipient_id) WHERE read_at IS NULL;

GRANT SELECT, INSERT, UPDATE ON public.direct_messages TO authenticated;
GRANT ALL ON public.direct_messages TO service_role;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dm_select_participant" ON public.direct_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "dm_insert_sender" ON public.direct_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND sender_id <> recipient_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (
          (c.user1_id = sender_id AND c.user2_id = recipient_id)
          OR (c.user2_id = sender_id AND c.user1_id = recipient_id)
        )
    )
  );

-- Recipient can mark as read (sets read_at). Restrict to read flag only.
CREATE POLICY "dm_update_read" ON public.direct_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Helper: get-or-create conversation between two users
CREATE OR REPLACE FUNCTION public.get_or_create_conversation(_other uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  u1 uuid;
  u2 uuid;
  cid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _other IS NULL OR _other = uid THEN RAISE EXCEPTION 'Invalid recipient'; END IF;
  IF uid < _other THEN u1 := uid; u2 := _other; ELSE u1 := _other; u2 := uid; END IF;

  SELECT id INTO cid FROM public.conversations WHERE user1_id = u1 AND user2_id = u2;
  IF cid IS NULL THEN
    INSERT INTO public.conversations (user1_id, user2_id) VALUES (u1, u2) RETURNING id INTO cid;
  END IF;
  RETURN cid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(uuid) TO authenticated;

-- Trigger: on new dm, update conversation + create notification
CREATE OR REPLACE FUNCTION public.after_dm_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name text;
BEGIN
  UPDATE public.conversations
    SET last_message_at = NEW.created_at,
        last_message_preview = left(NEW.content, 120)
    WHERE id = NEW.conversation_id;

  SELECT username INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    NEW.recipient_id,
    'message',
    'Nuevo mensaje',
    COALESCE(sender_name, 'Alguien') || ': ' || left(NEW.content, 80),
    '/messages'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_dm_insert ON public.direct_messages;
CREATE TRIGGER trg_after_dm_insert
  AFTER INSERT ON public.direct_messages
  FOR EACH ROW EXECUTE FUNCTION public.after_dm_insert();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER TABLE public.direct_messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;

-- ============================================================
-- 2. Premium sync: subscriptions <-> user_roles
-- ============================================================
CREATE OR REPLACE FUNCTION public.sync_premium_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.user_roles WHERE user_id = OLD.user_id AND role = 'premium'::app_role;
    RETURN OLD;
  END IF;

  IF NEW.plan = 'premium' AND NEW.status = 'active' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'premium'::app_role)
    ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = NEW.user_id AND role = 'premium'::app_role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_premium_role ON public.subscriptions;
CREATE TRIGGER trg_sync_premium_role
  AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.sync_premium_role();

-- Activate founder's premium subscription and backfill role
INSERT INTO public.subscriptions (user_id, plan, status, started_at, expires_at)
VALUES ('399c84d4-4438-49a4-8558-0e1b56ec76b5', 'premium', 'active', now(), NULL)
ON CONFLICT (user_id) DO UPDATE SET plan = 'premium', status = 'active', expires_at = NULL;

INSERT INTO public.user_roles (user_id, role)
VALUES ('399c84d4-4438-49a4-8558-0e1b56ec76b5', 'premium'::app_role)
ON CONFLICT DO NOTHING;
