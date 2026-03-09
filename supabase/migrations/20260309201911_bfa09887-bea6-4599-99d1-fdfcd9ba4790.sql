
-- Create firm role enum
CREATE TYPE public.firm_role AS ENUM ('firm_owner', 'firm_admin', 'accountant', 'staff');

-- Team members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  role firm_role NOT NULL DEFAULT 'staff',
  status text NOT NULL DEFAULT 'invited',
  invited_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(firm_org_id, email)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Firm owners/admins can manage team members
CREATE POLICY "Firm owners can manage team members"
ON public.team_members FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = team_members.firm_org_id
    AND owner_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = team_members.firm_org_id
    AND owner_user_id = auth.uid()
  )
);

-- Team members can view their own membership
CREATE POLICY "Users can view own membership"
ON public.team_members FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Platform admins can view all
CREATE POLICY "Platform admins can view all team members"
ON public.team_members FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Workspace access assignments for team members
CREATE TABLE public.team_workspace_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_member_id, workspace_id)
);

ALTER TABLE public.team_workspace_access ENABLE ROW LEVEL SECURITY;

-- Firm owners can manage workspace access
CREATE POLICY "Firm owners can manage workspace access"
ON public.team_workspace_access FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.organizations o ON o.id = tm.firm_org_id
    WHERE tm.id = team_workspace_access.team_member_id
    AND o.owner_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    JOIN public.organizations o ON o.id = tm.firm_org_id
    WHERE tm.id = team_workspace_access.team_member_id
    AND o.owner_user_id = auth.uid()
  )
);

-- Team members can view their own access
CREATE POLICY "Users can view own workspace access"
ON public.team_workspace_access FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.id = team_workspace_access.team_member_id
    AND tm.user_id = auth.uid()
  )
);

-- Update has_workspace_access to include team members
CREATE OR REPLACE FUNCTION public.has_workspace_access(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    -- Owner of this org
    SELECT 1 FROM public.organizations WHERE id = _org_id AND owner_user_id = _user_id
    UNION ALL
    -- Owner of parent org (accounting firm accessing client workspace)
    SELECT 1 FROM public.organizations child
    JOIN public.organizations parent ON parent.id = child.parent_org_id
    WHERE child.id = _org_id AND parent.owner_user_id = _user_id
    UNION ALL
    -- Team member with explicit workspace access
    SELECT 1 FROM public.team_workspace_access twa
    JOIN public.team_members tm ON tm.id = twa.team_member_id
    WHERE twa.workspace_id = _org_id
    AND tm.user_id = _user_id
    AND tm.status = 'active'
    UNION ALL
    -- Team member with firm_admin/firm_owner role has access to all firm workspaces
    SELECT 1 FROM public.team_members tm
    JOIN public.organizations child ON child.parent_org_id = tm.firm_org_id
    WHERE child.id = _org_id
    AND tm.user_id = _user_id
    AND tm.status = 'active'
    AND tm.role IN ('firm_owner', 'firm_admin')
  )
$$;
