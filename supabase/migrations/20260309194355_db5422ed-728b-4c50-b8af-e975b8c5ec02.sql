
-- 1. Add workspace columns to organizations
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS workspace_type text NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS parent_org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS max_client_workspaces integer NOT NULL DEFAULT 1;

-- 2. Add active_organization_id to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_organization_id uuid REFERENCES public.organizations(id);

-- 3. Add organization_id to all data tables
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.expense_records
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.income_records
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.expense_categories
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.auto_category_rules
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.export_history
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

ALTER TABLE public.chat_conversations
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- 4. Backfill organization_id from user_id -> organizations.owner_user_id
UPDATE public.documents d
SET organization_id = o.id
FROM public.organizations o
WHERE o.owner_user_id = d.user_id AND d.organization_id IS NULL;

UPDATE public.expense_records er
SET organization_id = o.id
FROM public.organizations o
WHERE o.owner_user_id = er.user_id AND er.organization_id IS NULL;

UPDATE public.income_records ir
SET organization_id = o.id
FROM public.organizations o
WHERE o.owner_user_id = ir.user_id AND ir.organization_id IS NULL;

UPDATE public.expense_categories ec
SET organization_id = o.id
FROM public.organizations o
WHERE o.owner_user_id = ec.user_id AND ec.organization_id IS NULL;

UPDATE public.auto_category_rules acr
SET organization_id = o.id
FROM public.organizations o
WHERE o.owner_user_id = acr.user_id AND acr.organization_id IS NULL;

UPDATE public.export_history eh
SET organization_id = o.id
FROM public.organizations o
WHERE o.owner_user_id = eh.user_id AND eh.organization_id IS NULL;

UPDATE public.chat_conversations cc
SET organization_id = o.id
FROM public.organizations o
WHERE o.owner_user_id = cc.user_id AND cc.organization_id IS NULL;

-- 5. Backfill active_organization_id in profiles
UPDATE public.profiles p
SET active_organization_id = o.id
FROM public.organizations o
WHERE o.owner_user_id = p.user_id AND p.active_organization_id IS NULL;

-- 6. Update handle_new_user to set active_organization_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _org_id uuid;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);

  -- Auto-create organization so import email is ready immediately
  INSERT INTO public.organizations (owner_user_id, name)
  VALUES (NEW.id, 'My Organization')
  RETURNING id INTO _org_id;

  -- Set active organization
  UPDATE public.profiles SET active_organization_id = _org_id WHERE user_id = NEW.id;

  RETURN NEW;
END;
$$;

-- 7. Create a function to check workspace access (for RLS)
CREATE OR REPLACE FUNCTION public.has_workspace_access(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    -- Owner of this org
    SELECT 1 FROM public.organizations WHERE id = _org_id AND owner_user_id = _user_id
    UNION ALL
    -- Owner of parent org (accounting firm accessing client workspace)
    SELECT 1 FROM public.organizations child
    JOIN public.organizations parent ON parent.id = child.parent_org_id
    WHERE child.id = _org_id AND parent.owner_user_id = _user_id
  )
$$;
