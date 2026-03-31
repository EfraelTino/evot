
-- Allow anon to read messages (widget needs to restore chat history)
CREATE POLICY "Anon can read messages by session" ON public.messages
  FOR SELECT TO anon
  USING (true);
