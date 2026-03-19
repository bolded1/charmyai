-- Add storage limit tracking to organizations (default 1 GB = 1073741824 bytes)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS storage_limit_bytes bigint NOT NULL DEFAULT 1073741824;

-- Add purchased storage tracking
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS storage_purchased_bytes bigint NOT NULL DEFAULT 0;

-- Function to calculate current storage usage for an organization
CREATE OR REPLACE FUNCTION public.get_org_storage_usage(_org_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(file_size), 0)::bigint
  FROM public.documents
  WHERE organization_id = _org_id
$$;

-- Function to check if org has storage space available
CREATE OR REPLACE FUNCTION public.check_storage_available(_org_id uuid, _file_size bigint DEFAULT 0)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    SELECT COALESCE(SUM(file_size), 0) + _file_size
    FROM public.documents
    WHERE organization_id = _org_id
  ) <= (
    SELECT storage_limit_bytes + storage_purchased_bytes
    FROM public.organizations
    WHERE id = _org_id
  )
$$;