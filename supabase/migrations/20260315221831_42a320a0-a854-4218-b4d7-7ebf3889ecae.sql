
-- Create document_requests table
CREATE TABLE public.document_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  firm_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  token text NOT NULL DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active',
  expires_at timestamp with time zone,
  upload_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  closed_at timestamp with time zone
);

-- Create document_request_uploads table
CREATE TABLE public.document_request_uploads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES public.document_requests(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  uploader_name text,
  uploader_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index on token for fast lookups
CREATE UNIQUE INDEX idx_document_requests_token ON public.document_requests(token);

-- Enable RLS
ALTER TABLE public.document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_request_uploads ENABLE ROW LEVEL SECURITY;

-- RLS policies for document_requests
CREATE POLICY "Firm owners can manage document requests"
  ON public.document_requests FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = document_requests.firm_org_id AND owner_user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = document_requests.firm_org_id AND owner_user_id = auth.uid()
  ));

CREATE POLICY "Firm admins can manage document requests"
  ON public.document_requests FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.firm_org_id = document_requests.firm_org_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
    AND tm.role IN ('firm_owner', 'firm_admin')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.team_members tm
    WHERE tm.firm_org_id = document_requests.firm_org_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
    AND tm.role IN ('firm_owner', 'firm_admin')
  ));

-- RLS policies for document_request_uploads
CREATE POLICY "Firm owners can view request uploads"
  ON public.document_request_uploads FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.document_requests dr
    JOIN public.organizations o ON o.id = dr.firm_org_id
    WHERE dr.id = document_request_uploads.request_id
    AND o.owner_user_id = auth.uid()
  ));

CREATE POLICY "Firm admins can view request uploads"
  ON public.document_request_uploads FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.document_requests dr
    JOIN public.team_members tm ON tm.firm_org_id = dr.firm_org_id
    WHERE dr.id = document_request_uploads.request_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
    AND tm.role IN ('firm_owner', 'firm_admin')
  ));
