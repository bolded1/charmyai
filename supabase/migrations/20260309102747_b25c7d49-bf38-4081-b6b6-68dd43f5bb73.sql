
-- Allow reading demo uploads by session_id for anonymous users
CREATE POLICY "Public can read own demo uploads"
  ON public.demo_uploads
  FOR SELECT
  TO anon, authenticated
  USING (true);
