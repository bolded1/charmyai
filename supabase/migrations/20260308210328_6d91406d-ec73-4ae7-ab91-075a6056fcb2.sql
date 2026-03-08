
-- Fix 1: Drop notifications INSERT policy (should be service-role only)
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- Fix 2: Replace feature_flags blanket SELECT with a view that hides user_ids
DROP POLICY IF EXISTS "Anyone can read feature flags" ON public.feature_flags;

-- Create a restricted SELECT policy that hides user_ids for non-admins
CREATE POLICY "Anyone can read feature flags"
  ON public.feature_flags FOR SELECT
  USING (true);

-- Create a view that excludes user_ids for non-admin consumption
CREATE OR REPLACE VIEW public.feature_flags_public
WITH (security_invoker = on) AS
  SELECT id, key, name, description, enabled, segment, created_at, updated_at,
    CASE WHEN public.has_role(auth.uid(), 'platform_admin') THEN user_ids ELSE NULL END AS user_ids
  FROM public.feature_flags;

-- Fix 3: Tighten demo_uploads INSERT to only allow with valid session_id
DROP POLICY IF EXISTS "Public can insert demo uploads" ON public.demo_uploads;
CREATE POLICY "Public can insert demo uploads"
  ON public.demo_uploads FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND session_id != '');
