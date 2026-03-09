-- Allow clients with workspace access to view the workspace organization
CREATE POLICY "Clients can view workspace via team access"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.team_workspace_access twa
    JOIN public.team_members tm ON tm.id = twa.team_member_id
    WHERE twa.workspace_id = organizations.id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  )
);