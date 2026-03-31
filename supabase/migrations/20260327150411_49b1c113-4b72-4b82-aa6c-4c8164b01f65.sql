
-- Create bots table
CREATE TABLE public.bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  site_url TEXT,
  prompt TEXT,
  color TEXT DEFAULT '#7C3AED',
  welcome_msg TEXT DEFAULT 'Hola, ¿en qué puedo ayudarte?',
  webhook_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID REFERENCES public.bots(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_messages_bot_session ON public.messages (bot_id, session_id, created_at);
CREATE INDEX idx_bots_user_id ON public.bots (user_id);

-- Enable RLS
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS: Authenticated users can CRUD their own bots
CREATE POLICY "Users can view own bots"
  ON public.bots FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create bots"
  ON public.bots FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own bots"
  ON public.bots FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own bots"
  ON public.bots FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS: Anon can read limited bot config (for bot.js widget)
CREATE POLICY "Anon can read bot config"
  ON public.bots FOR SELECT
  TO anon
  USING (true);

-- RLS: Messages - authenticated users can read messages of their bots
CREATE POLICY "Users can view messages of own bots"
  ON public.messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bots
      WHERE bots.id = messages.bot_id
      AND bots.user_id = auth.uid()
    )
  );

-- RLS: Anon can insert messages (from bot.js widget)
CREATE POLICY "Anon can insert messages"
  ON public.messages FOR INSERT
  TO anon
  WITH CHECK (true);

-- RLS: Authenticated can insert messages too
CREATE POLICY "Authenticated can insert messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create a function to get public bot config (without exposing prompt/webhook)
CREATE OR REPLACE FUNCTION public.get_bot_config(bot_uuid UUID)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'id', id,
    'name', name,
    'color', color,
    'welcome_msg', welcome_msg
  )
  FROM public.bots
  WHERE id = bot_uuid;
$$;
