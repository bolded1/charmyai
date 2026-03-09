
-- Fix: Restrict raw feature_flags SELECT to platform_admin only
-- Regular users already read via feature_flags_public view
DROP POLICY IF EXISTS "Authenticated can read feature flags" ON public.feature_flags;
