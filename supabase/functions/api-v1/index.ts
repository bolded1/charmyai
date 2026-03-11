import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

type AdminClient = any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-api-key, x-client-info, apikey, content-type, x-workspace-id, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

const encoder = new TextEncoder();

type AuthContext = {
  kind: "user" | "api_key";
  token: string | null;
  anonKey: string;
  supabaseUrl: string;
  admin: AdminClient;
  user: { id: string; email: string | null };
  apiKeyRecord: any | null;
  accessibleWorkspaces: any[];
  accessibleWorkspaceIds: Set<string>;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const html = (body: string, status = 200) =>
  new Response(body, {
    status,
    headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
  });

const badRequest = (message: string) => json({ error: message }, 400);
const unauthorized = () => json({ error: "Unauthorized" }, 401);
const forbidden = (message = "Forbidden") => json({ error: message }, 403);
const notFound = (message = "Not found") => json({ error: message }, 404);

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function isPrivateIpHost(hostname: string): boolean {
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) {
    const parts = hostname.split(".").map(Number);
    const [a, b] = parts;
    if (parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) return true;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168)
    );
  }

  const normalized = hostname.toLowerCase();
  return (
    normalized === "::1" ||
    normalized === "localhost" ||
    normalized.endsWith(".localhost") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80:")
  );
}

function validateWebhookTargetUrl(value: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return "target_url must be a valid URL";
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return "target_url must use http or https";
  }

  if (parsed.username || parsed.password) {
    return "target_url must not include embedded credentials";
  }

  if (isPrivateIpHost(parsed.hostname)) {
    return "target_url must not target localhost or a private network address";
  }

  return null;
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function randomToken(prefix: string, byteLength = 24) {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return `${prefix}${base64UrlEncode(bytes)}`;
}

async function sha256(value: string) {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function signPayload(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getPathParts(req: Request): string[] {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const fnIndex = parts.findIndex((part) => part === "api-v1");
  return fnIndex >= 0 ? parts.slice(fnIndex + 1) : [];
}

async function getAccessibleWorkspaces(admin: AdminClient, userId: string) {
  const { data: ownOrgs, error } = await admin
    .from("organizations")
    .select("*")
    .eq("owner_user_id", userId)
    .is("archived_at", null);
  if (error) throw error;

  const home = ownOrgs ?? [];
  const firm = home.find((org: any) => org.workspace_type === "accounting_firm");
  let clientOrgs: any[] = [];

  if (firm) {
    const { data: children, error: childError } = await admin
      .from("organizations")
      .select("*")
      .eq("parent_org_id", firm.id)
      .is("archived_at", null);
    if (childError) throw childError;
    clientOrgs = children ?? [];
  }

  const { data: memberships, error: membershipError } = await admin
    .from("team_members")
    .select("id, firm_org_id, role")
    .eq("user_id", userId)
    .eq("status", "active");
  if (membershipError) throw membershipError;

  const membershipRows = memberships ?? [];
  const membershipIds = membershipRows.map((row: any) => row.id);
  const firmAdminOrgIds = membershipRows
    .filter((row: any) => row.role === "firm_owner" || row.role === "firm_admin")
    .map((row: any) => row.firm_org_id);

  let teamAccessIds: string[] = [];
  if (membershipIds.length > 0) {
    const { data: workspaceAccess, error: workspaceAccessError } = await admin
      .from("team_workspace_access")
      .select("workspace_id")
      .in("team_member_id", membershipIds);
    if (workspaceAccessError) throw workspaceAccessError;
    teamAccessIds = (workspaceAccess ?? []).map((row: any) => row.workspace_id);
  }

  let teamExplicitOrgs: any[] = [];
  const explicitIds = Array.from(new Set(teamAccessIds));
  if (explicitIds.length > 0) {
    const { data: explicitOrgs, error: explicitError } = await admin
      .from("organizations")
      .select("*")
      .in("id", explicitIds)
      .is("archived_at", null);
    if (explicitError) throw explicitError;
    teamExplicitOrgs = explicitOrgs ?? [];
  }

  let teamFirmClientOrgs: any[] = [];
  const uniqueFirmAdminOrgIds = Array.from(new Set(firmAdminOrgIds));
  if (uniqueFirmAdminOrgIds.length > 0) {
    const { data: childAccessOrgs, error: childAccessError } = await admin
      .from("organizations")
      .select("*")
      .in("parent_org_id", uniqueFirmAdminOrgIds)
      .is("archived_at", null);
    if (childAccessError) throw childAccessError;
    teamFirmClientOrgs = childAccessOrgs ?? [];
  }

  const seen = new Set<string>();
  return [...home, ...clientOrgs, ...teamExplicitOrgs, ...teamFirmClientOrgs].filter((org: any) => {
    if (seen.has(org.id)) return false;
    seen.add(org.id);
    return true;
  });
}

async function getUserAuthContext(req: Request, admin: AdminClient, supabaseUrl: string, anonKey: string): Promise<AuthContext | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  if (token.startsWith("charmy_")) return null;

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) return null;

  const accessibleWorkspaces = await getAccessibleWorkspaces(admin, userData.user.id);
  return {
    kind: "user",
    token,
    anonKey,
    supabaseUrl,
    admin,
    user: { id: userData.user.id, email: userData.user.email ?? null },
    apiKeyRecord: null,
    accessibleWorkspaces,
    accessibleWorkspaceIds: new Set(accessibleWorkspaces.map((org: any) => org.id)),
  };
}

async function getApiKeyAuthContext(req: Request, admin: AdminClient, supabaseUrl: string, anonKey: string): Promise<AuthContext | null> {
  const apiKey =
    req.headers.get("x-api-key") ||
    (req.headers.get("Authorization")?.startsWith("Bearer charmy_")
      ? req.headers.get("Authorization")!.replace("Bearer ", "")
      : null);

  if (!apiKey?.startsWith("charmy_")) return null;

  const hash = await sha256(apiKey);
  const prefix = apiKey.slice(0, 16);
  const { data: keyRecord, error } = await admin
    .from("integration_api_keys")
    .select("*")
    .eq("key_prefix", prefix)
    .eq("key_hash", hash)
    .is("revoked_at", null)
    .maybeSingle();

  if (error || !keyRecord) return null;

  await admin
    .from("integration_api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRecord.id);

  const accessibleWorkspaces = await getAccessibleWorkspaces(admin, keyRecord.user_id);
  const filteredWorkspaces = keyRecord.organization_id
    ? accessibleWorkspaces.filter((org: any) => org.id === keyRecord.organization_id)
    : accessibleWorkspaces;

  return {
    kind: "api_key",
    token: null,
    anonKey,
    supabaseUrl,
    admin,
    user: { id: keyRecord.user_id, email: null },
    apiKeyRecord: keyRecord,
    accessibleWorkspaces: filteredWorkspaces,
    accessibleWorkspaceIds: new Set(filteredWorkspaces.map((org: any) => org.id)),
  };
}

async function getAuthContext(req: Request): Promise<AuthContext | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } }) as AdminClient;

  return (
    await getUserAuthContext(req, admin, supabaseUrl, anonKey)
  ) ?? (
    await getApiKeyAuthContext(req, admin, supabaseUrl, anonKey)
  );
}

async function resolveWorkspaceId(req: Request, auth: AuthContext) {
  const url = new URL(req.url);
  const requestedId =
    req.headers.get("x-workspace-id") ||
    url.searchParams.get("workspace_id");

  if (requestedId) {
    if (!auth.accessibleWorkspaceIds.has(requestedId)) throw new Error("WORKSPACE_FORBIDDEN");
    return requestedId;
  }

  if (auth.apiKeyRecord?.organization_id) return auth.apiKeyRecord.organization_id;

  const { data: profile, error } = await auth.admin
    .from("profiles")
    .select("active_organization_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (error) throw error;

  const activeId = profile?.active_organization_id ?? null;
  if (activeId && auth.accessibleWorkspaceIds.has(activeId)) return activeId;
  return null;
}

async function getDocumentForUser(auth: AuthContext, documentId: string) {
  const { data, error } = await auth.admin
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  if (data.organization_id && !auth.accessibleWorkspaceIds.has(data.organization_id)) throw new Error("WORKSPACE_FORBIDDEN");
  return data;
}

async function invokeExtractDocument(auth: AuthContext, documentId: string) {
  if (!auth.token) {
    return { ok: false, status: 400, payload: { error: "Extraction requires bearer-token auth in v1" } };
  }

  const res = await fetch(`${auth.supabaseUrl}/functions/v1/extract-document`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`,
      apikey: auth.anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ documentId }),
  });

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  return {
    ok: res.ok,
    status: res.status,
    payload: payload ?? (res.ok ? { success: true } : { error: "Extraction failed" }),
  };
}

async function dispatchWebhooks(auth: AuthContext, event: string, organizationId: string | null, payload: Record<string, unknown>) {
  const { data: endpoints, error } = await auth.admin
    .from("webhook_endpoints")
    .select("*")
    .eq("user_id", auth.user.id)
    .is("revoked_at", null);
  if (error) throw error;

  const targets = (endpoints ?? []).filter((endpoint: any) => {
    const events = Array.isArray(endpoint.events) ? endpoint.events : [];
    const eventMatch = events.includes(event) || events.includes("*");
    const workspaceMatch = !endpoint.organization_id || endpoint.organization_id === organizationId;
    return eventMatch && workspaceMatch;
  });

  const createdAt = new Date().toISOString();

  for (const endpoint of targets) {
    const body = JSON.stringify({
      id: crypto.randomUUID(),
      type: event,
      created_at: createdAt,
      organization_id: organizationId,
      data: payload,
    });

    const signature = await signPayload(endpoint.signing_secret, body);
    let responseStatus: number | null = null;
    let responseBody: string | null = null;

    try {
      const response = await fetch(endpoint.target_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-charmy-event": event,
          "x-charmy-signature": signature,
        },
        body,
      });
      responseStatus = response.status;
      responseBody = (await response.text()).slice(0, 5000);
    } catch (error) {
      responseBody = String(error);
    }

    await auth.admin.from("webhook_deliveries").insert({
      webhook_endpoint_id: endpoint.id,
      event_type: event,
      payload: JSON.parse(body),
      response_status: responseStatus,
      response_body: responseBody,
      attempted_at: createdAt,
    });
  }
}

function buildOpenApi(req: Request) {
  const baseUrl = `${new URL(req.url).origin}/functions/v1/api-v1`;
  return {
    openapi: "3.1.0",
    info: {
      title: "Charmy API",
      version: "1.0.0",
      description: "External integration API for Charmy.",
    },
    servers: [{ url: baseUrl }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer" },
        apiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" },
      },
    },
    security: [{ bearerAuth: [] }, { apiKeyAuth: [] }],
    paths: {
      "/workspaces": { get: { summary: "List accessible workspaces" } },
      "/documents": { get: { summary: "List documents" } },
      "/documents/upload": { post: { summary: "Upload a document" } },
      "/documents/{id}": {
        get: { summary: "Get a document" },
        patch: { summary: "Update a document" },
      },
      "/documents/{id}/download": { get: { summary: "Create a signed file download URL" } },
      "/documents/{id}/extract": { post: { summary: "Trigger extraction" } },
      "/documents/{id}/approve": { post: { summary: "Approve a document" } },
      "/exports": { get: { summary: "List exports" } },
      "/api-keys": {
        get: { summary: "List API keys" },
        post: { summary: "Create API key" },
      },
      "/api-keys/{id}": { delete: { summary: "Revoke API key" } },
      "/webhooks": {
        get: { summary: "List webhooks" },
        post: { summary: "Create webhook endpoint" },
      },
      "/webhooks/{id}": { delete: { summary: "Delete webhook endpoint" } },
      "/webhooks/{id}/test": { post: { summary: "Send a test webhook" } },
    },
  };
}

function buildSwaggerHtml(req: Request) {
  const specUrl = `${new URL(req.url).origin}/functions/v1/api-v1/openapi.json`;
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Charmy API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>body{margin:0;background:#fafafa}#swagger-ui{max-width:1200px;margin:0 auto}</style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: ${JSON.stringify(specUrl)},
        dom_id: '#swagger-ui'
      });
    </script>
  </body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const path = getPathParts(req);

    if (req.method === "GET" && path[0] === "openapi.json") {
      return json(buildOpenApi(req));
    }

    if (req.method === "GET" && path[0] === "docs") {
      return html(buildSwaggerHtml(req));
    }

    const auth = await getAuthContext(req);
    if (!auth) return unauthorized();

    const url = new URL(req.url);

    if (req.method === "GET" && path[0] === "workspaces" && path.length === 1) {
      return json({ data: auth.accessibleWorkspaces });
    }

    if (req.method === "GET" && path[0] === "api-keys" && path.length === 1) {
      if (auth.kind !== "user") return forbidden("API key management requires bearer auth");
      const { data, error } = await auth.admin
        .from("integration_api_keys")
        .select("id, name, organization_id, key_prefix, last_used_at, created_at, revoked_at")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ data });
    }

    if (req.method === "POST" && path[0] === "api-keys" && path.length === 1) {
      if (auth.kind !== "user") return forbidden("API key management requires bearer auth");
      const body = await req.json().catch(() => null);
      const name = body?.name?.trim();
      if (!name) return badRequest("name is required");

      const workspaceId = body?.workspace_id ?? null;
      if (workspaceId && !auth.accessibleWorkspaceIds.has(workspaceId)) return forbidden("Workspace not accessible");

      const rawKey = randomToken("charmy_");
      const keyPrefix = rawKey.slice(0, 16);
      const keyHash = await sha256(rawKey);

      const { data, error } = await auth.admin
        .from("integration_api_keys")
        .insert({
          user_id: auth.user.id,
          organization_id: workspaceId,
          name,
          key_prefix: keyPrefix,
          key_hash: keyHash,
        })
        .select("id, name, organization_id, key_prefix, created_at")
        .single();
      if (error) throw error;

      return json({ data, api_key: rawKey }, 201);
    }

    if (req.method === "DELETE" && path[0] === "api-keys" && path.length === 2) {
      if (auth.kind !== "user") return forbidden("API key management requires bearer auth");
      const { error } = await auth.admin
        .from("integration_api_keys")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", path[1])
        .eq("user_id", auth.user.id);
      if (error) throw error;
      return json({ success: true });
    }

    if (req.method === "GET" && path[0] === "webhooks" && path.length === 1) {
      if (auth.kind !== "user") return forbidden("Webhook management requires bearer auth");
      const { data, error } = await auth.admin
        .from("webhook_endpoints")
        .select("id, organization_id, target_url, events, created_at, revoked_at")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return json({ data });
    }

    if (req.method === "POST" && path[0] === "webhooks" && path.length === 1) {
      if (auth.kind !== "user") return forbidden("Webhook management requires bearer auth");
      const body = await req.json().catch(() => null);
      const targetUrl = body?.target_url?.trim();
      if (!targetUrl) return badRequest("target_url is required");
      const targetUrlError = validateWebhookTargetUrl(targetUrl);
      if (targetUrlError) return badRequest(targetUrlError);

      const events = Array.isArray(body?.events) && body.events.length > 0 ? body.events : ["*"];
      const workspaceId = body?.workspace_id ?? null;
      if (workspaceId && !auth.accessibleWorkspaceIds.has(workspaceId)) return forbidden("Workspace not accessible");

      const signingSecret = randomToken("whsec_");
      const { data, error } = await auth.admin
        .from("webhook_endpoints")
        .insert({
          user_id: auth.user.id,
          organization_id: workspaceId,
          target_url: targetUrl,
          events,
          signing_secret: signingSecret,
        })
        .select("id, organization_id, target_url, events, created_at")
        .single();
      if (error) throw error;

      return json({ data, signing_secret: signingSecret }, 201);
    }

    if (req.method === "DELETE" && path[0] === "webhooks" && path.length === 2) {
      if (auth.kind !== "user") return forbidden("Webhook management requires bearer auth");
      const { error } = await auth.admin
        .from("webhook_endpoints")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", path[1])
        .eq("user_id", auth.user.id);
      if (error) throw error;
      return json({ success: true });
    }

    if (req.method === "POST" && path[0] === "webhooks" && path[2] === "test") {
      if (auth.kind !== "user") return forbidden("Webhook management requires bearer auth");
      const { data: endpoint, error } = await auth.admin
        .from("webhook_endpoints")
        .select("*")
        .eq("id", path[1])
        .eq("user_id", auth.user.id)
        .is("revoked_at", null)
        .maybeSingle();
      if (error) throw error;
      if (!endpoint) return notFound("Webhook endpoint not found");

      await dispatchWebhooks(auth, "webhook.test", endpoint.organization_id, {
        endpoint_id: endpoint.id,
        message: "This is a test webhook from Charmy API v1.",
      });

      return json({ success: true });
    }

    if (req.method === "GET" && path[0] === "documents" && path.length === 1) {
      const workspaceId = await resolveWorkspaceId(req, auth);
      const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);
      const status = url.searchParams.get("status");

      let query = auth.admin
        .from("documents")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (workspaceId) query = query.eq("organization_id", workspaceId);
      if (status && status !== "all") query = query.eq("status", status);

      const { data, error } = await query;
      if (error) throw error;
      return json({ data });
    }

    if (req.method === "GET" && path[0] === "documents" && path.length === 2) {
      const document = await getDocumentForUser(auth, path[1]);
      if (!document) return notFound("Document not found");
      return json({ data: document });
    }

    if (req.method === "GET" && path[0] === "documents" && path[2] === "download") {
      const document = await getDocumentForUser(auth, path[1]);
      if (!document) return notFound("Document not found");

      const expiresIn = Math.min(Number(url.searchParams.get("expires_in") ?? "3600"), 86400);
      const { data, error } = await auth.admin.storage
        .from("documents")
        .createSignedUrl(document.file_path, expiresIn);
      if (error) throw error;

      return json({
        data: {
          document_id: document.id,
          signed_url: data.signedUrl,
          expires_in: expiresIn,
        },
      });
    }

    if (req.method === "POST" && path[0] === "documents" && path[1] === "upload") {
      const contentType = req.headers.get("content-type") ?? "";
      let fileName = "";
      let fileType = "";
      let fileBytes: Uint8Array | null = null;
      let requestedWorkspaceId: string | null = null;
      let documentType: string | null = null;
      let runExtract = false;

      if (contentType.includes("multipart/form-data")) {
        const form = await req.formData();
        const formFile = form.get("file");
        if (!(formFile instanceof File)) return badRequest("file is required");

        fileName = formFile.name;
        fileType = formFile.type || "application/octet-stream";
        fileBytes = new Uint8Array(await formFile.arrayBuffer());
        requestedWorkspaceId = (form.get("workspace_id") as string | null) ?? null;
        documentType = (form.get("document_type") as string | null) ?? null;
        runExtract = String(form.get("extract") ?? "false").toLowerCase() === "true";
      } else {
        const body = await req.json().catch(() => null);
        if (!body?.file_name || !body?.content_base64) {
          return badRequest("file_name and content_base64 are required");
        }
        fileName = body.file_name;
        fileType = body.file_type ?? "application/octet-stream";
        fileBytes = Uint8Array.from(atob(body.content_base64), (c) => c.charCodeAt(0));
        requestedWorkspaceId = body.workspace_id ?? null;
        documentType = body.document_type ?? null;
        runExtract = body.extract === true;
      }

      if (!fileBytes) return badRequest("Invalid file payload");
      if (runExtract && !auth.token) {
        return badRequest("extract=true requires bearer-token auth in v1");
      }
      if (requestedWorkspaceId && !auth.accessibleWorkspaceIds.has(requestedWorkspaceId)) return forbidden("Workspace not accessible");

      const workspaceId = requestedWorkspaceId ?? await resolveWorkspaceId(req, auth);
      const filePath = `${auth.user.id}/${Date.now()}-${sanitizeFileName(fileName)}`;

      const { error: uploadError } = await auth.admin.storage
        .from("documents")
        .upload(filePath, fileBytes, {
          contentType: fileType,
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const initialStatus = runExtract ? "processing" : "needs_review";
      const { data: inserted, error: insertError } = await auth.admin
        .from("documents")
        .insert({
          user_id: auth.user.id,
          organization_id: workspaceId,
          file_name: fileName,
          file_path: filePath,
          file_type: fileType,
          file_size: fileBytes.byteLength,
          document_type: documentType,
          status: initialStatus,
          source: "api",
        })
        .select("*")
        .single();
      if (insertError) throw insertError;

      await dispatchWebhooks(auth, "document.uploaded", inserted.organization_id, { document: inserted });

      if (runExtract) {
        const extractResult = await invokeExtractDocument(auth, inserted.id);
        const refreshed = await getDocumentForUser(auth, inserted.id);

        if (extractResult.ok && refreshed) {
          await dispatchWebhooks(auth, "document.extracted", refreshed.organization_id, { document: refreshed });
        }

        return json(
          { data: refreshed ?? inserted, extraction: extractResult.payload },
          extractResult.ok ? 201 : extractResult.status,
        );
      }

      return json({ data: inserted }, 201);
    }

    if (req.method === "POST" && path[0] === "documents" && path[2] === "extract") {
      const document = await getDocumentForUser(auth, path[1]);
      if (!document) return notFound("Document not found");
      if (!auth.token) {
        return badRequest("Extraction requires bearer-token auth in v1");
      }

      const { error: updateError } = await auth.admin
        .from("documents")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", document.id);
      if (updateError) throw updateError;

      const extractResult = await invokeExtractDocument(auth, document.id);
      const refreshed = await getDocumentForUser(auth, document.id);
      if (extractResult.ok && refreshed) {
        await dispatchWebhooks(auth, "document.extracted", refreshed.organization_id, { document: refreshed });
      }

      return json(
        { data: refreshed ?? document, extraction: extractResult.payload },
        extractResult.ok ? 200 : extractResult.status,
      );
    }

    if (req.method === "PATCH" && path[0] === "documents" && path.length === 2) {
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== "object") return badRequest("Invalid JSON body");

      const document = await getDocumentForUser(auth, path[1]);
      if (!document) return notFound("Document not found");

      const allowedFields = new Set([
        "document_type",
        "supplier_name",
        "customer_name",
        "invoice_number",
        "invoice_date",
        "due_date",
        "currency",
        "net_amount",
        "vat_amount",
        "total_amount",
        "vat_number",
        "category",
        "ocr_text",
        "user_corrections",
        "status",
      ]);

      const updates = Object.fromEntries(Object.entries(body).filter(([key]) => allowedFields.has(key)));

      const { data, error } = await auth.admin
        .from("documents")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", document.id)
        .select("*")
        .single();
      if (error) throw error;

      return json({ data });
    }

    if (req.method === "POST" && path[0] === "documents" && path[2] === "approve") {
      const document = await getDocumentForUser(auth, path[1]);
      if (!document) return notFound("Document not found");

      if (document.status !== "approved" && document.status !== "exported") {
        const { error: updateError } = await auth.admin
          .from("documents")
          .update({ status: "approved", updated_at: new Date().toISOString() })
          .eq("id", document.id);
        if (updateError) throw updateError;
      }

      const isIncome = document.document_type === "sales_invoice";
      const table = isIncome ? "income_records" : "expense_records";
      const { data: existingRecord } = await auth.admin
        .from(table)
        .select("*")
        .eq("document_id", document.id)
        .maybeSingle();

      let record = existingRecord;
      if (!record) {
        const payload = isIncome
          ? {
              user_id: auth.user.id,
              organization_id: document.organization_id,
              document_id: document.id,
              customer_name: document.customer_name || document.supplier_name || "Unknown",
              invoice_number: document.invoice_number,
              invoice_date: document.invoice_date || new Date().toISOString().split("T")[0],
              due_date: document.due_date,
              currency: document.currency || "EUR",
              net_amount: document.net_amount || 0,
              vat_amount: document.vat_amount || 0,
              total_amount: document.total_amount || 0,
              vat_number: document.vat_number,
              category: document.category,
            }
          : {
              user_id: auth.user.id,
              organization_id: document.organization_id,
              document_id: document.id,
              supplier_name: document.supplier_name || document.customer_name || "Unknown",
              invoice_number: document.invoice_number,
              invoice_date: document.invoice_date || new Date().toISOString().split("T")[0],
              due_date: document.due_date,
              currency: document.currency || "EUR",
              net_amount: document.net_amount || 0,
              vat_amount: document.vat_amount || 0,
              total_amount: document.total_amount || 0,
              vat_number: document.vat_number,
              category: document.category,
            };

        const { data: insertedRecord, error: insertError } = await auth.admin
          .from(table)
          .insert(payload as any)
          .select("*")
          .single();
        if (insertError) throw insertError;
        record = insertedRecord;
      }

      const refreshed = await getDocumentForUser(auth, document.id);
      if (refreshed) {
        await dispatchWebhooks(auth, "document.approved", refreshed.organization_id, {
          document: refreshed,
          record_type: isIncome ? "income" : "expense",
          record,
        });
      }

      return json({
        data: refreshed ?? document,
        record_type: isIncome ? "income" : "expense",
        record,
      });
    }

    if (req.method === "GET" && path[0] === "exports" && path.length === 1) {
      const workspaceId = await resolveWorkspaceId(req, auth);
      const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 100);

      let query = auth.admin
        .from("export_history")
        .select("*")
        .eq("user_id", auth.user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (workspaceId) query = query.eq("organization_id", workspaceId);

      const { data, error } = await query;
      if (error) throw error;
      return json({ data });
    }

    return notFound("API endpoint not found");
  } catch (error) {
    if (error instanceof Error && error.message === "WORKSPACE_FORBIDDEN") {
      return forbidden("Workspace not accessible");
    }
    console.error("[api-v1] error", error);
    return json({ error: "Internal server error" }, 500);
  }
});
