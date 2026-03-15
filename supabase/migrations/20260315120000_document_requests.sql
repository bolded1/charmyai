-- Document Requests: allows accounting firms to generate a shareable upload link
-- so clients can upload documents directly into a workspace without a Charmy account.

create table if not exists public.document_requests (
  id uuid primary key default gen_random_uuid(),
  firm_org_id uuid not null references public.organizations(id) on delete cascade,
  workspace_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  title text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'closed')),
  expires_at timestamptz,
  upload_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create index if not exists document_requests_firm_org_id_idx
  on public.document_requests (firm_org_id);

create index if not exists document_requests_workspace_id_idx
  on public.document_requests (workspace_id);

create index if not exists document_requests_token_idx
  on public.document_requests (token);

create table if not exists public.document_request_uploads (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.document_requests(id) on delete cascade,
  document_id uuid not null references public.documents(id) on delete cascade,
  uploader_name text,
  uploader_email text,
  created_at timestamptz not null default now()
);

create index if not exists document_request_uploads_request_id_idx
  on public.document_request_uploads (request_id);

alter table public.document_requests enable row level security;
alter table public.document_request_uploads enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'document_requests' and policyname = 'Firm members can manage own requests'
  ) then
    create policy "Firm members can manage own requests"
      on public.document_requests
      for all
      using (created_by = auth.uid())
      with check (created_by = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'document_request_uploads' and policyname = 'Firm members can view uploads for own requests'
  ) then
    create policy "Firm members can view uploads for own requests"
      on public.document_request_uploads
      for select
      using (
        request_id in (
          select id from public.document_requests where created_by = auth.uid()
        )
      );
  end if;
end $$;
