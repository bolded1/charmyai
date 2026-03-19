CREATE TABLE public.contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  organization_id UUID REFERENCES public.organizations(id),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'supplier' CHECK (type IN ('supplier', 'customer', 'both')),
  vat_number      TEXT,
  email           TEXT,
  phone           TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own contacts"
  ON public.contacts
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Workspace contacts access"
  ON public.contacts
  FOR ALL
  USING (
    organization_id IS NULL
    OR has_workspace_access(organization_id)
  );

CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contacts_org_id  ON public.contacts(organization_id);
