DROP VIEW IF EXISTS public.feature_flags_public;

CREATE VIEW public.feature_flags_public
WITH (security_invoker = true)
AS
SELECT
  id,
  key,
  name,
  description,
  enabled,
  segment,
  created_at,
  updated_at,
  CASE
    WHEN public.has_role(auth.uid(), 'platform_admin'::app_role)
    THEN user_ids
    ELSE '[]'::jsonb
  END AS user_ids
FROM public.feature_flags
WHERE enabled = true;

GRANT SELECT ON public.feature_flags_public TO authenticated;
GRANT SELECT ON public.feature_flags_public TO anon;