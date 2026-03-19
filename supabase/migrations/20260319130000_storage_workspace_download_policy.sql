-- Allow workspace members to download document files stored in their organization
-- This fixes downloads for files uploaded via document requests (requests/...) and
-- email imports (org_owner_id/...) where the storage path doesn't start with the
-- downloading user's ID.
CREATE POLICY "Users can view workspace document files"
ON storage.objects FOR SELECT
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
