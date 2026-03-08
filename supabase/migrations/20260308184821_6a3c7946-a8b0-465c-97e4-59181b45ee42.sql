DROP POLICY "Admins can upload email images" ON storage.objects;

CREATE POLICY "Admins can upload email images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'email-images' AND public.has_role(auth.uid(), 'platform_admin'));