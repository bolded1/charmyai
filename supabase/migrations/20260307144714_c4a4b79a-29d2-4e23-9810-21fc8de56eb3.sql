
-- Organizations table
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  import_email_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  owner_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organizations_import_email_token_key UNIQUE (import_email_token)
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own organizations" ON public.organizations
  FOR SELECT TO authenticated USING (owner_user_id = auth.uid());

CREATE POLICY "Users can insert own organizations" ON public.organizations
  FOR INSERT TO authenticated WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can update own organizations" ON public.organizations
  FOR UPDATE TO authenticated USING (owner_user_id = auth.uid());

-- Email imports audit table
CREATE TABLE public.email_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  sender_email text,
  sender_name text,
  recipient_address text,
  subject text,
  message_id text,
  received_at timestamptz NOT NULL DEFAULT now(),
  attachment_count integer NOT NULL DEFAULT 0,
  processed_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'processing',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own email imports" ON public.email_imports
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()));

-- Add source tracking to documents
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'upload',
  ADD COLUMN IF NOT EXISTS email_import_id uuid REFERENCES public.email_imports(id) ON DELETE SET NULL;

-- Index for fast token lookup
CREATE INDEX idx_organizations_import_email_token ON public.organizations(import_email_token);

-- Index for email dedup
CREATE UNIQUE INDEX idx_email_imports_message_id ON public.email_imports(message_id) WHERE message_id IS NOT NULL;
