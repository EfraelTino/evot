
-- Create workspaces table
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Create workspace_members table
CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Add workspace_id and logo_url to bots
ALTER TABLE public.bots ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE;
ALTER TABLE public.bots ADD COLUMN logo_url text;

-- Security definer function to check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  ) OR EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = _workspace_id AND owner_id = _user_id
  );
$$;

-- Security definer function to check workspace ownership
CREATE OR REPLACE FUNCTION public.is_workspace_owner(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspaces
    WHERE id = _workspace_id AND owner_id = _user_id
  );
$$;

-- Workspaces RLS
CREATE POLICY "Owner can do everything on workspaces" ON public.workspaces
  FOR ALL TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Members can view workspaces" ON public.workspaces
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), id));

-- Workspace members RLS
CREATE POLICY "Owner can manage members" ON public.workspace_members
  FOR ALL TO authenticated
  USING (public.is_workspace_owner(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_owner(auth.uid(), workspace_id));

CREATE POLICY "Members can view own membership" ON public.workspace_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Update bots RLS: keep existing policies for bots without workspace, add workspace-based access
CREATE POLICY "Workspace members can view bots" ON public.bots
  FOR SELECT TO authenticated
  USING (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can update bots" ON public.bots
  FOR UPDATE TO authenticated
  USING (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id));

-- Update get_bot_config to include logo_url
CREATE OR REPLACE FUNCTION public.get_bot_config(bot_uuid uuid)
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
    'prompt', prompt,
    'logo_url', logo_url
  )
  FROM public.bots
  WHERE id = bot_uuid;
$$;
