-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view child organizations" ON public.organizations;

-- Recreate using a non-recursive security definer function
CREATE OR REPLACE FUNCTION public.is_parent_org_owner(_parent_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = _parent_org_id AND owner_user_id = _user_id
  )
$$;

-- Recreate the policy using the function
CREATE POLICY "Users can view child organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  parent_org_id IS NOT NULL AND public.is_parent_org_owner(parent_org_id, auth.uid())
);