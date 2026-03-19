-- Allow users to download documents from workspaces they have access to
CREATE POLICY "Users can view workspace document files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.documents d
    WHERE d.file_path = name
    AND d.organization_id IS NOT NULL
    AND public.has_workspace_access(auth.uid(), d.organization_id)
  )
);