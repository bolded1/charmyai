-- Fix: Restrict anonymous access to user_ids column on feature_flags table

-- 1. Drop the overly permissive open SELECT policy
DROP POLICY IF EXISTS "Anyone can read feature flags" ON public.feature_flags;

-- 2. Authenticated users can read all feature flag columns
CREATE POLICY "Authenticated can read feature flags"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (true);

-- 3. Anonymous users can read feature flags rows (for public feature toggling)
CREATE POLICY "Anon can read feature flags"
  ON public.feature_flags FOR SELECT
  TO anon
  USING (true);

-- 4. Restrict anon role to non-sensitive columns only (exclude user_ids)
REVOKE SELECT ON public.feature_flags FROM anon;
GRANT SELECT (id, key, name, description, enabled, segment, created_at, updated_at) ON public.feature_flags TO anon;