
-- Create ticket_messages table for threaded conversations
CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'user',
  body text NOT NULL,
  attachments jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages on their own tickets
CREATE POLICY "Users can view own ticket messages"
  ON public.ticket_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE id = ticket_messages.ticket_id AND user_id = auth.uid()
    )
  );

-- Users can insert messages on their own tickets
CREATE POLICY "Users can insert own ticket messages"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    sender_role = 'user' AND
    EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE id = ticket_messages.ticket_id AND user_id = auth.uid()
    )
  );

-- Platform admins can view all messages
CREATE POLICY "Platform admins can view all ticket messages"
  ON public.ticket_messages FOR SELECT
  USING (has_role(auth.uid(), 'platform_admin'::app_role));

-- Platform admins can insert messages on any ticket
CREATE POLICY "Platform admins can insert ticket messages"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    sender_role = 'admin' AND
    has_role(auth.uid(), 'platform_admin'::app_role)
  );

-- Enable realtime for ticket messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;

-- Storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('ticket-attachments', 'ticket-attachments', false, 10485760);

-- Storage policies: users can upload to their ticket folders
CREATE POLICY "Users can upload ticket attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ticket-attachments' AND
    auth.uid() IS NOT NULL
  );

-- Users can view attachments from their own tickets
CREATE POLICY "Users can view own ticket attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ticket-attachments' AND
    auth.uid() IS NOT NULL
  );

-- Admins can view all ticket attachments
CREATE POLICY "Admins can view all ticket attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ticket-attachments' AND
    has_role(auth.uid(), 'platform_admin'::app_role)
  );

-- Admins can upload ticket attachments
CREATE POLICY "Admins can upload ticket attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ticket-attachments' AND
    has_role(auth.uid(), 'platform_admin'::app_role)
  );
