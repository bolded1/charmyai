
CREATE TABLE public.broadcast_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  link text,
  segment text NOT NULL DEFAULT 'all',
  role_filter text,
  sent_count integer NOT NULL DEFAULT 0,
  sent_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.broadcast_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage broadcast history"
  ON public.broadcast_history
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));
