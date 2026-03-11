create table if not exists public.integration_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  organization_id uuid null references public.organizations(id) on delete cascade,
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  last_used_at timestamptz null,
  revoked_at timestamptz null,
  created_at timestamptz not null default now()
);

create unique index if not exists integration_api_keys_key_hash_idx
  on public.integration_api_keys (key_hash);

create index if not exists integration_api_keys_user_id_idx
  on public.integration_api_keys (user_id);

create table if not exists public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  organization_id uuid null references public.organizations(id) on delete cascade,
  target_url text not null,
  events text[] not null default array['*']::text[],
  signing_secret text not null,
  revoked_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists webhook_endpoints_user_id_idx
  on public.webhook_endpoints (user_id);

create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_endpoint_id uuid not null references public.webhook_endpoints(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  response_status integer null,
  response_body text null,
  attempted_at timestamptz not null default now()
);

create index if not exists webhook_deliveries_endpoint_idx
  on public.webhook_deliveries (webhook_endpoint_id, attempted_at desc);

alter table public.integration_api_keys enable row level security;
alter table public.webhook_endpoints enable row level security;
alter table public.webhook_deliveries enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'integration_api_keys' and policyname = 'Users can manage own integration api keys'
  ) then
    create policy "Users can manage own integration api keys"
      on public.integration_api_keys
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'webhook_endpoints' and policyname = 'Users can manage own webhook endpoints'
  ) then
    create policy "Users can manage own webhook endpoints"
      on public.webhook_endpoints
      for all
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'webhook_deliveries' and policyname = 'Users can read own webhook deliveries'
  ) then
    create policy "Users can read own webhook deliveries"
      on public.webhook_deliveries
      for select
      using (
        exists (
          select 1
          from public.webhook_endpoints we
          where we.id = webhook_endpoint_id
            and we.user_id = auth.uid()
        )
      );
  end if;
end $$;
