
-- Drop the recursive policy
DROP POLICY IF EXISTS "Clients can view workspace via team access" ON public.organizations;

-- Create a security definer function to check client workspace access
CREATE OR REPLACE FUNCTION public.has_client_workspace_access(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_workspace_access twa
    JOIN public.team_members tm ON tm.id = twa.team_member_id
    WHERE twa.workspace_id = _org_id
    AND tm.user_id = _user_id
    AND tm.status = 'active'
  )
$$;

-- Recreate policy using the function
CREATE POLICY "Clients can view workspace via team access"
ON public.organizations
FOR SELECT
TO authenticated
USING (public.has_client_workspace_access(auth.uid(), id));
