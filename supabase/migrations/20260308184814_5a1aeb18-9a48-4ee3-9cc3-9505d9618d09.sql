INSERT INTO storage.buckets (id, name, public)
VALUES ('email-images', 'email-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can upload email images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'email-images');

CREATE POLICY "Public can read email images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'email-images');