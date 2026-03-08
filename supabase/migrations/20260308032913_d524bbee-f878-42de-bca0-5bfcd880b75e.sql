CREATE POLICY "Platform admins can access all document files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  public.has_role(auth.uid(), 'platform_admin'::public.app_role)
);