-- Remove the open SELECT policy so non-admins cannot query the raw table
DROP POLICY IF EXISTS "Anyone can read feature flags" ON public.feature_flags;

-- Only platform admins can SELECT from the raw feature_flags table
-- Regular users/app code must use the feature_flags_public view
CREATE POLICY "Only admins can read raw feature flags"
  ON public.feature_flags FOR SELECT
  USING (has_role(auth.uid(), 'platform_admin'));
