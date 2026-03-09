
-- Add 'client' to firm_role enum
ALTER TYPE public.firm_role ADD VALUE IF NOT EXISTS 'client';

-- Create client_invitations table
CREATE TABLE public.client_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  firm_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, client_email)
);

-- Add client_contact_name and client_contact_email to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS client_contact_name text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS client_contact_email text;

-- Enable RLS
ALTER TABLE public.client_invitations ENABLE ROW LEVEL SECURITY;

-- RLS: Firm owners can manage invitations for their firm's workspaces
CREATE POLICY "Firm owners can manage client invitations"
ON public.client_invitations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = client_invitations.firm_org_id
    AND owner_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = client_invitations.firm_org_id
    AND owner_user_id = auth.uid()
  )
);

-- Team members with firm_admin role can also manage invitations
CREATE POLICY "Firm admins can manage client invitations"
ON public.client_invitations
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.firm_org_id = client_invitations.firm_org_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
    AND tm.role IN ('firm_owner', 'firm_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.firm_org_id = client_invitations.firm_org_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
    AND tm.role IN ('firm_owner', 'firm_admin')
  )
);

-- Public read for token-based lookup (for invitation acceptance page)
CREATE POLICY "Anyone can read invitation by token"
ON public.client_invitations
FOR SELECT
TO anon, authenticated
USING (true);

-- Platform admins can view all
CREATE POLICY "Platform admins can view all client invitations"
ON public.client_invitations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'));

-- Index for token lookup
CREATE INDEX idx_client_invitations_token ON public.client_invitations(token);
CREATE INDEX idx_client_invitations_workspace ON public.client_invitations(workspace_id);
