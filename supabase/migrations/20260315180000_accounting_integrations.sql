-- Stores OAuth tokens for connected accounting software per user/org
CREATE TABLE IF NOT EXISTS accounting_integrations (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id   uuid        REFERENCES organizations(id) ON DELETE CASCADE,
  provider          text        NOT NULL CHECK (provider IN ('quickbooks', 'xero', 'freshbooks')),
  access_token      text,
  refresh_token     text,
  token_expiry      timestamptz,
  realm_id          text,        -- QuickBooks realmId / Xero tenantId / FreshBooks accountId
  connected_at      timestamptz NOT NULL DEFAULT now(),
  last_sync_at      timestamptz,
  last_sync_count   int,
  UNIQUE (user_id, organization_id, provider)
);

ALTER TABLE accounting_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own accounting integrations"
  ON accounting_integrations FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
