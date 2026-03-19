
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'supplier',
  vat_number TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contacts" ON public.contacts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view org contacts" ON public.contacts
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT id FROM public.organizations WHERE owner_user_id = auth.uid()
    UNION
    SELECT firm_org_id FROM public.team_members WHERE user_id = auth.uid() AND status = 'active'
  ));

CREATE POLICY "Users can insert own contacts" ON public.contacts
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own contacts" ON public.contacts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own contacts" ON public.contacts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
