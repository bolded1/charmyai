-- Recreate view as SECURITY DEFINER so non-admin users can still read feature flags
-- through the view (which masks user_ids), while the raw table is admin-only
DROP VIEW IF EXISTS public.feature_flags_public;

CREATE VIEW public.feature_flags_public
WITH (security_invoker = off) AS
  SELECT id, key, name, description, enabled, segment, created_at, updated_at,
    CASE WHEN public.has_role(auth.uid(), 'platform_admin') THEN user_ids ELSE NULL END AS user_ids
  FROM public.feature_flags;

-- Grant SELECT on the view to authenticated and anon roles
GRANT SELECT ON public.feature_flags_public TO authenticated, anon;
