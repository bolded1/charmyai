
-- Notifications table for document lifecycle, due dates, team events
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'document_processed', 'document_needs_review', 'invoice_due_soon', 'invoice_overdue', 'team_joined', 'export_ready'
  title TEXT NOT NULL,
  body TEXT,
  link TEXT, -- relative URL to navigate to
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Allow inserts from service role / triggers
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Auto-create notification when document status changes to 'processed'
CREATE OR REPLACE FUNCTION public.notify_document_processed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status = 'processing' AND NEW.status = 'processed' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.user_id,
      'document_processed',
      'Document ready for review',
      '"' || NEW.file_name || '" has been processed and is ready for your review.',
      '/app/documents'
    );
  END IF;

  -- Low confidence notification
  IF NEW.status = 'processed' AND NEW.confidence_score IS NOT NULL AND NEW.confidence_score < 0.7 THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.user_id,
      'document_needs_review',
      'Document needs attention',
      '"' || NEW.file_name || '" was processed with low confidence (' || ROUND(NEW.confidence_score::numeric * 100) || '%). Please review the extracted data.',
      '/app/documents'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_document_processed
  AFTER UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_document_processed();

-- Auto-create notification when document is approved
CREATE OR REPLACE FUNCTION public.notify_document_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM 'approved' AND NEW.status = 'approved' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.user_id,
      'document_approved',
      'Document approved',
      '"' || NEW.file_name || '" has been approved and added to your records.',
      '/app/expenses'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_document_approved
  AFTER UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_document_approved();
