
-- Allow organization owners to delete their own client workspaces
CREATE POLICY "Users can delete own client organizations"
ON public.organizations FOR DELETE
TO authenticated
USING (owner_user_id = auth.uid() AND workspace_type = 'client');

-- Allow users to view client orgs they have access to (via parent)
CREATE POLICY "Users can view child organizations"
ON public.organizations FOR SELECT
TO authenticated
USING (
  parent_org_id IN (
    SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()
  )
);
