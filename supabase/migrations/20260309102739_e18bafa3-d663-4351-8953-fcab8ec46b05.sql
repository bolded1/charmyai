
-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Public can insert demo uploads" ON public.demo_uploads;

CREATE POLICY "Public can insert demo uploads"
  ON public.demo_uploads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK ((session_id IS NOT NULL) AND (session_id <> ''::text));
