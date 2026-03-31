
-- Add button_icon and position fields to bots
ALTER TABLE chatbot_redcuore.bots ADD COLUMN IF NOT EXISTS button_icon text DEFAULT 'chat';
ALTER TABLE chatbot_redcuore.bots ADD COLUMN IF NOT EXISTS position text DEFAULT 'right';

-- Update get_bot_config to include new fields
CREATE OR REPLACE FUNCTION chatbot_redcuore.get_bot_config(bot_uuid uuid)
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'chatbot_redcuore'
AS $$
  SELECT json_build_object(
    'id', id,
    'name', name,
    'color', color,
    'welcome_msg', welcome_msg,
    'webhook_url', webhook_url,
    'prompt', prompt,
    'logo_url', logo_url,
    'button_icon', COALESCE(button_icon, 'chat'),
    'position', COALESCE(position, 'right')
  )
  FROM chatbot_redcuore.bots
  WHERE id = bot_uuid;
$$;
