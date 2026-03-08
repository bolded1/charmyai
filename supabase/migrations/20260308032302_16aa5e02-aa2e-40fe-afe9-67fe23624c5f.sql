
-- Create audit_logs table for tracking platform activity
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  user_email text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details text,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only platform admins can read audit logs
CREATE POLICY "Platform admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'platform_admin'));

-- Allow inserts from service role (edge functions) and authenticated users for their own actions
CREATE POLICY "System can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Index for performance
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs (user_id);
