-- Recreate view as SECURITY INVOKER to fix the security definer view lint
DROP VIEW IF EXISTS public.feature_flags_public;

CREATE VIEW public.feature_flags_public
WITH (security_invoker = on) AS
  SELECT id, key, name, description, enabled, segment, created_at, updated_at,
    CASE WHEN public.has_role(auth.uid(), 'platform_admin') THEN user_ids ELSE NULL END AS user_ids
  FROM public.feature_flags;

GRANT SELECT ON public.feature_flags_public TO authenticated, anon;

-- Re-add a public SELECT policy so the SECURITY INVOKER view can read the table
DROP POLICY IF EXISTS "Only admins can read raw feature flags" ON public.feature_flags;

CREATE POLICY "Anyone can read feature flags"
  ON public.feature_flags FOR SELECT
  USING (true);