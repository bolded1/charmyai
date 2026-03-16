/**
 * accounting-oauth — OAuth 2.0 connect/callback/disconnect for QuickBooks, Xero, FreshBooks
 *
 * Routes (via ?action= query param):
 *   GET ?action=connect&provider=quickbooks|xero|freshbooks&org_id=...&user_token=...
 *     → 302 to provider auth page
 *
 *   GET ?action=callback&provider=quickbooks|xero|freshbooks&code=...&state=...&realmId=...
 *     → exchanges code, stores tokens, 302 to /settings?tab=integrations&connected=<provider>
 *
 *   POST ?action=disconnect  body: { provider, org_id }
 *     → deletes the integration row
 *
 *   GET ?action=status
 *     → returns connected providers for the user
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PROVIDERS = {
  quickbooks: {
    authUrl: "https://appcenter.intuit.com/connect/oauth2",
    tokenUrl: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
    scope: "com.intuit.quickbooks.accounting",
    clientId: Deno.env.get("QUICKBOOKS_CLIENT_ID") ?? "",
    clientSecret: Deno.env.get("QUICKBOOKS_CLIENT_SECRET") ?? "",
  },
  xero: {
    authUrl: "https://login.xero.com/identity/connect/authorize",
    tokenUrl: "https://identity.xero.com/connect/token",
    scope: "accounting.transactions accounting.settings openid profile email offline_access",
    clientId: Deno.env.get("XERO_CLIENT_ID") ?? "",
    clientSecret: Deno.env.get("XERO_CLIENT_SECRET") ?? "",
  },
  freshbooks: {
    authUrl: "https://auth.freshbooks.com/oauth/authorize",
    tokenUrl: "https://api.freshbooks.com/auth/oauth/token",
    scope: "user:profile:read admin:all:legacy",
    clientId: Deno.env.get("FRESHBOOKS_CLIENT_ID") ?? "",
    clientSecret: Deno.env.get("FRESHBOOKS_CLIENT_SECRET") ?? "",
  },
} as const;

type Provider = keyof typeof PROVIDERS;

const CALLBACK_URL = `${SUPABASE_URL}/functions/v1/accounting-oauth`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const redirect = (url: string) =>
  new Response(null, { status: 302, headers: { Location: url } });

function adminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

function userClientFromToken(token: string) {
  return createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

// Build OAuth URL for a given provider
function buildAuthUrl(provider: Provider, state: string): string {
  const cfg = PROVIDERS[provider];
  const params = new URLSearchParams({
    client_id: cfg.clientId,
    response_type: "code",
    scope: cfg.scope,
    redirect_uri: `${CALLBACK_URL}?action=callback&provider=${provider}`,
    state,
  });
  return `${cfg.authUrl}?${params}`;
}

// Exchange auth code for tokens
async function exchangeCode(
  provider: Provider,
  code: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const cfg = PROVIDERS[provider];
  const credentials = btoa(`${cfg.clientId}:${cfg.clientSecret}`);
  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${CALLBACK_URL}?action=callback&provider=${provider}`,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${err}`);
  }
  return res.json();
}

// For Xero: fetch the first tenant ID after token exchange
async function xeroTenantId(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.xero.com/connections", {
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    const tenants = await res.json();
    return tenants[0]?.tenantId ?? null;
  } catch {
    return null;
  }
}

// For FreshBooks: fetch the account ID from user identity
async function freshbooksAccountId(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.freshbooks.com/auth/api/v1/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.response?.business_memberships?.[0]?.business?.account_id ?? null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "callback";

  // ── CONNECT: initiate OAuth flow ──────────────────────────────────────────
  if (action === "connect" && req.method === "GET") {
    const provider = url.searchParams.get("provider") as Provider | null;
    const orgId = url.searchParams.get("org_id") ?? "";
    const userToken = url.searchParams.get("user_token") ?? "";

    if (!provider || !(provider in PROVIDERS)) return json({ error: "Invalid provider" }, 400);
    if (!PROVIDERS[provider].clientId) return json({ error: `${provider} client ID not configured` }, 503);

    // State encodes org_id and user_token (base64) to survive the redirect round-trip
    const state = btoa(JSON.stringify({ org_id: orgId, user_token: userToken }));
    return redirect(buildAuthUrl(provider, state));
  }

  // ── CALLBACK: exchange code and store tokens ──────────────────────────────
  if (action === "callback" && req.method === "GET") {
    const provider = url.searchParams.get("provider") as Provider | null;
    const code = url.searchParams.get("code");
    const stateRaw = url.searchParams.get("state");
    // QuickBooks sends realmId as a separate param
    const qbRealmId = url.searchParams.get("realmId") ?? null;

    if (!provider || !(provider in PROVIDERS) || !code || !stateRaw) {
      return redirect(`/settings?tab=integrations&error=bad_callback`);
    }

    let state: { org_id: string; user_token: string };
    try {
      state = JSON.parse(atob(stateRaw));
    } catch {
      return redirect(`/settings?tab=integrations&error=bad_state`);
    }

    try {
      const tokens = await exchangeCode(provider, code);

      // Resolve realm/tenant/account ID
      let realmId: string | null = qbRealmId;
      if (provider === "xero") realmId = await xeroTenantId(tokens.access_token);
      if (provider === "freshbooks") realmId = await freshbooksAccountId(tokens.access_token);

      // Resolve the user via their token
      const userClient = userClientFromToken(state.user_token);
      const { data: { user }, error: authErr } = await userClient.auth.getUser();
      if (authErr || !user) return redirect(`/settings?tab=integrations&error=auth`);

      const expiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
      const admin = adminClient();

      await admin.from("accounting_integrations").upsert(
        {
          user_id: user.id,
          organization_id: state.org_id || null,
          provider,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expiry: expiry,
          realm_id: realmId,
          connected_at: new Date().toISOString(),
        },
        { onConflict: "user_id,organization_id,provider" }
      );

      // Redirect back to the app's settings page
      const appOrigin = Deno.env.get("APP_ORIGIN") ?? "https://app.charmy.ai";
      return redirect(`${appOrigin}/settings?tab=integrations&connected=${provider}`);
    } catch (err) {
      console.error("OAuth callback error:", err);
      return redirect(`/settings?tab=integrations&error=token_exchange`);
    }
  }

  // ── DISCONNECT ────────────────────────────────────────────────────────────
  if (action === "disconnect" && req.method === "POST") {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const userClient = userClientFromToken(token);
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const { provider, org_id } = await req.json();
    if (!provider) return json({ error: "provider required" }, 400);

    const admin = adminClient();
    const query = admin
      .from("accounting_integrations")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", provider);

    if (org_id) query.eq("organization_id", org_id);

    const { error } = await query;
    if (error) return json({ error: error.message }, 500);
    return json({ success: true });
  }

  // ── STATUS: list connected providers ─────────────────────────────────────
  if (action === "status" && req.method === "GET") {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const userClient = userClientFromToken(token);
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return json({ error: "Unauthorized" }, 401);

    const orgId = url.searchParams.get("org_id");
    const admin = adminClient();
    const query = admin
      .from("accounting_integrations")
      .select("provider, realm_id, connected_at, last_sync_at, last_sync_count")
      .eq("user_id", user.id);

    if (orgId) query.eq("organization_id", orgId);

    const { data, error } = await query;
    if (error) return json({ error: error.message }, 500);
    return json({ integrations: data ?? [] });
  }

  return json({ error: "Not found" }, 404);
});
