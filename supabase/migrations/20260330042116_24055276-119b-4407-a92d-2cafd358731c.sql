CREATE OR REPLACE FUNCTION chatbot_redcuore.get_bot_config(bot_uuid uuid)
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT json_build_object(
    'id', id,
    'name', name,
    'color', color,
    'welcome_msg', welcome_msg,
    'webhook_url', webhook_url,
    'prompt', prompt
  )
  FROM chatbot_redcuore.bots
  WHERE id = bot_uuid;
$$;