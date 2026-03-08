-- Remove anon direct SELECT on feature_flags base table.
-- Anon access goes through feature_flags_public view (security_invoker)
-- which has column-level grants excluding user_ids.
DROP POLICY IF EXISTS "Anon can read feature flags" ON public.feature_flags;