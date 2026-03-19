/**
 * accounting-sync — Push expense/income records to QuickBooks, Xero, or FreshBooks
 *
 * POST /accounting-sync
 * Headers: Authorization: Bearer <user_token>
 * Body: {
 *   provider: "quickbooks" | "xero" | "freshbooks",
 *   org_id?: string,
 *   type: "expenses" | "income",
 *   records: Array<{
 *     invoice_date: string, due_date: string,
 *     supplier_name?: string, customer_name?: string,
 *     invoice_number?: string, currency: string,
 *     net_amount: number, vat_amount: number, total_amount: number,
 *     category?: string
 *   }>
 * }
 * Returns: { synced: number, skipped: number, errors: string[] }
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function adminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

function userClientFromToken(token: string) {
  return createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

// ── Token refresh helpers ─────────────────────────────────────────────────

async function refreshQuickBooksToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  const clientId = Deno.env.get("QUICKBOOKS_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("QUICKBOOKS_CLIENT_SECRET") ?? "";
  const credentials = btoa(`${clientId}:${clientSecret}`);
  try {
    const res = await fetch("https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${credentials}` },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function refreshXeroToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  const clientId = Deno.env.get("XERO_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("XERO_CLIENT_SECRET") ?? "";
  const credentials = btoa(`${clientId}:${clientSecret}`);
  try {
    const res = await fetch("https://identity.xero.com/connect/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${credentials}` },
      body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function refreshFreshBooksToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> {
  const clientId = Deno.env.get("FRESHBOOKS_CLIENT_ID") ?? "";
  const clientSecret = Deno.env.get("FRESHBOOKS_CLIENT_SECRET") ?? "";
  try {
    const res = await fetch("https://api.freshbooks.com/auth/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grant_type: "refresh_token", refresh_token: refreshToken, client_id: clientId, client_secret: clientSecret }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

// Ensure we have a valid access token, refreshing if needed
async function ensureToken(integration: any, provider: string, admin: ReturnType<typeof adminClient>): Promise<string | null> {
  const expiry = integration.token_expiry ? new Date(integration.token_expiry) : null;
  const needsRefresh = !expiry || expiry.getTime() - Date.now() < 5 * 60 * 1000; // refresh if < 5m left

  if (!needsRefresh) return integration.access_token;

  let refreshed: { access_token: string; refresh_token: string; expires_in: number } | null = null;
  if (provider === "quickbooks") refreshed = await refreshQuickBooksToken(integration.refresh_token);
  else if (provider === "xero") refreshed = await refreshXeroToken(integration.refresh_token);
  else if (provider === "freshbooks") refreshed = await refreshFreshBooksToken(integration.refresh_token);

  if (!refreshed) return null;

  await admin.from("accounting_integrations").update({
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    token_expiry: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
  }).eq("id", integration.id);

  return refreshed.access_token;
}

// ── QuickBooks push ───────────────────────────────────────────────────────

async function pushQuickBooks(
  accessToken: string,
  realmId: string,
  type: "expenses" | "income",
  records: any[]
): Promise<{ synced: number; errors: string[] }> {
  const base = `https://quickbooks.api.intuit.com/v3/company/${realmId}`;
  const errors: string[] = [];
  let synced = 0;

  for (const r of records) {
    try {
      let body: any;
      if (type === "expenses") {
        // Create a Bill
        body = {
          Line: [{
            Amount: Number(r.net_amount ?? 0),
            DetailType: "AccountBasedExpenseLineDetail",
            AccountBasedExpenseLineDetail: {
              AccountRef: { name: r.category || "Uncategorized Expense" },
            },
          }],
          VendorRef: { name: r.supplier_name || "Unknown Supplier" },
          TxnDate: r.invoice_date || undefined,
          DueDate: r.due_date || undefined,
          DocNumber: r.invoice_number || undefined,
          CurrencyRef: { value: r.currency || "USD" },
          TotalAmt: Number(r.total_amount ?? 0),
        };
        const res = await fetch(`${base}/bill`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.text();
          errors.push(`Bill for ${r.supplier_name}: ${err.slice(0, 200)}`);
        } else { synced++; }
      } else {
        // Create an Invoice
        body = {
          Line: [{
            Amount: Number(r.net_amount ?? 0),
            DetailType: "SalesItemLineDetail",
            SalesItemLineDetail: { ItemRef: { name: "Services" } },
          }],
          CustomerRef: { name: r.customer_name || "Unknown Customer" },
          TxnDate: r.invoice_date || undefined,
          DueDate: r.due_date || undefined,
          DocNumber: r.invoice_number || undefined,
          CurrencyRef: { value: r.currency || "USD" },
        };
        const res = await fetch(`${base}/invoice`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.text();
          errors.push(`Invoice for ${r.customer_name}: ${err.slice(0, 200)}`);
        } else { synced++; }
      }
    } catch (e: any) {
      errors.push(e.message);
    }
  }

  return { synced, errors };
}

// ── Xero push ─────────────────────────────────────────────────────────────

async function pushXero(
  accessToken: string,
  tenantId: string,
  type: "expenses" | "income",
  records: any[]
): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;

  const invoices = records.map((r) => ({
    Type: type === "expenses" ? "ACCPAY" : "ACCREC",
    Contact: { Name: type === "expenses" ? (r.supplier_name || "Unknown") : (r.customer_name || "Unknown") },
    Date: r.invoice_date || undefined,
    DueDate: r.due_date || undefined,
    InvoiceNumber: r.invoice_number || undefined,
    CurrencyCode: r.currency || "USD",
    LineItems: [
      {
        Description: r.category || (type === "expenses" ? "Expense" : "Income"),
        Quantity: 1,
        UnitAmount: Number(r.net_amount ?? 0),
        TaxAmount: Number(r.vat_amount ?? 0),
        LineAmount: Number(r.net_amount ?? 0),
      },
    ],
    SubTotal: Number(r.net_amount ?? 0),
    TotalTax: Number(r.vat_amount ?? 0),
    Total: Number(r.total_amount ?? 0),
    Status: "DRAFT",
  }));

  // Xero allows batch of up to 50 invoices per call
  const BATCH = 50;
  for (let i = 0; i < invoices.length; i += BATCH) {
    const batch = invoices.slice(i, i + BATCH);
    try {
      const res = await fetch("https://api.xero.com/api.xro/2.0/Invoices", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Xero-Tenant-Id": tenantId,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ Invoices: batch }),
      });
      const data = await res.json();
      if (!res.ok) {
        errors.push(`Xero batch ${Math.floor(i / BATCH) + 1}: ${JSON.stringify(data).slice(0, 300)}`);
      } else {
        synced += data.Invoices?.length ?? batch.length;
      }
    } catch (e: any) {
      errors.push(e.message);
    }
  }

  return { synced, errors };
}

// ── FreshBooks push ───────────────────────────────────────────────────────

async function pushFreshBooks(
  accessToken: string,
  accountId: string,
  type: "expenses" | "income",
  records: any[]
): Promise<{ synced: number; errors: string[] }> {
  const errors: string[] = [];
  let synced = 0;
  const base = `https://api.freshbooks.com/accounting/account/${accountId}`;

  for (const r of records) {
    try {
      if (type === "expenses") {
        const res = await fetch(`${base}/expenses/expenses`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            expense: {
              amount: { amount: String(r.total_amount ?? 0), code: r.currency || "USD" },
              vendor: r.supplier_name || "",
              notes: r.category || "",
              date: r.invoice_date || "",
            },
          }),
        });
        if (!res.ok) {
          const err = await res.text();
          errors.push(`Expense ${r.supplier_name}: ${err.slice(0, 200)}`);
        } else { synced++; }
      } else {
        // FreshBooks needs a client first; we create a draft invoice without one
        const res = await fetch(`${base}/invoices/invoices`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            invoice: {
              invoice_number: r.invoice_number || "",
              create_date: r.invoice_date || "",
              due_date: r.due_date || "",
              currency_code: r.currency || "USD",
              lines: [{
                type: 0,
                description: r.category || "Service",
                unit_cost: { amount: String(r.net_amount ?? 0), code: r.currency || "USD" },
                qty: 1,
              }],
            },
          }),
        });
        if (!res.ok) {
          const err = await res.text();
          errors.push(`Invoice ${r.invoice_number}: ${err.slice(0, 200)}`);
        } else { synced++; }
      }
    } catch (e: any) {
      errors.push(e.message);
    }
  }

  return { synced, errors };
}

// ── Main handler ──────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return json({ error: "Unauthorized" }, 401);

  const userClient = userClientFromToken(token);
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return json({ error: "Unauthorized" }, 401);

  let body: any;
  try { body = await req.json(); }
  catch { return json({ error: "Invalid JSON" }, 400); }

  const { provider, org_id, type, records } = body;
  if (!provider || !type || !Array.isArray(records)) return json({ error: "provider, type, records required" }, 400);
  if (!["quickbooks", "xero", "freshbooks"].includes(provider)) return json({ error: "Invalid provider" }, 400);
  if (!["expenses", "income"].includes(type)) return json({ error: "type must be expenses or income" }, 400);
  if (records.length === 0) return json({ synced: 0, skipped: 0, errors: [] });

  const admin = adminClient();

  // Load the stored integration
  const query = admin
    .from("accounting_integrations")
    .select("*")
    .eq("user_id", user.id)
    .eq("provider", provider)
    .maybeSingle();

  if (org_id) (query as any).eq("organization_id", org_id);

  const { data: integration, error: integErr } = await query;
  if (integErr) return json({ error: integErr.message }, 500);
  if (!integration) return json({ error: `${provider} is not connected` }, 404);

  const accessToken = await ensureToken(integration, provider, admin);
  if (!accessToken) return json({ error: "Token refresh failed — please reconnect" }, 401);

  const realmId = integration.realm_id ?? "";

  let result: { synced: number; errors: string[] };
  if (provider === "quickbooks") result = await pushQuickBooks(accessToken, realmId, type, records);
  else if (provider === "xero") result = await pushXero(accessToken, realmId, type, records);
  else result = await pushFreshBooks(accessToken, realmId, type, records);

  // Update last sync metadata
  await admin.from("accounting_integrations").update({
    last_sync_at: new Date().toISOString(),
    last_sync_count: result.synced,
  }).eq("id", integration.id);

  return json({
    synced: result.synced,
    skipped: records.length - result.synced - result.errors.length,
    errors: result.errors,
  });
});
