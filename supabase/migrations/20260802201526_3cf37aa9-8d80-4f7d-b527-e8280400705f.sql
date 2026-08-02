
CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Nueva conversación',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;

ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ai conversations"
ON public.ai_conversations FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_ai_conversations_user ON public.ai_conversations(user_id, updated_at DESC);

ALTER TABLE public.chat_messages
  ADD COLUMN conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  ADD COLUMN image_url text;

CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);

CREATE OR REPLACE FUNCTION public.is_premium(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('premium','founder','admin')
  ) OR EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

CREATE POLICY "Users read own nexus images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'nexus-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own nexus images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'nexus-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own nexus images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'nexus-images' AND auth.uid()::text = (storage.foldername(name))[1]);
