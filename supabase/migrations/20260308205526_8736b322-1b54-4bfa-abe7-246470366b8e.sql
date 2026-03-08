
-- Fix 1: Ticket attachments - drop overpermissive policies and add path-based ownership
DROP POLICY IF EXISTS "Users can view own ticket attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload ticket attachments" ON storage.objects;

CREATE POLICY "Users can view own ticket attachments"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'ticket-attachments' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.has_role(auth.uid(), 'platform_admin')
    )
  );

CREATE POLICY "Users can upload ticket attachments"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'ticket-attachments' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Fix 2: Drop overpermissive audit_logs INSERT policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
