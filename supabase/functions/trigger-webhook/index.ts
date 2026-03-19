import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const encoder = new TextEncoder();

async function signPayload(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: { user }, error: userError } = await admin.auth.getUser(token);
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { event, payload = {} } = body;
  if (!event || typeof event !== "string") {
    return new Response(JSON.stringify({ error: "event is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch all active webhook endpoints for this user
  const { data: endpoints, error: epError } = await admin
    .from("webhook_endpoints")
    .select("*")
    .eq("user_id", user.id)
    .is("revoked_at", null);

  if (epError || !endpoints || endpoints.length === 0) {
    return new Response(JSON.stringify({ dispatched: 0, total: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Filter to endpoints that subscribe to this event
  const matching = endpoints.filter(
    (ep: any) => ep.events.includes("*") || ep.events.includes(event),
  );

  const timestamp = Math.floor(Date.now() / 1000);
  let dispatched = 0;

  for (const endpoint of matching) {
    const eventPayload = { event, timestamp, data: payload };
    const serialized = JSON.stringify(eventPayload);
    const signature = await signPayload(endpoint.signing_secret, serialized);

    let responseStatus: number | null = null;
    let responseBody: string | null = null;

    try {
      const res = await fetch(endpoint.target_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Charmy-Signature": `sha256=${signature}`,
          "X-Charmy-Event": event,
          "X-Charmy-Timestamp": String(timestamp),
        },
        body: serialized,
        signal: AbortSignal.timeout(10_000),
      });
      responseStatus = res.status;
      responseBody = (await res.text()).slice(0, 1000);
    } catch (err: any) {
      responseBody = err?.message ?? "fetch error";
    }

    await admin.from("webhook_deliveries").insert({
      webhook_endpoint_id: endpoint.id,
      event_type: event,
      payload: eventPayload,
      response_status: responseStatus,
      response_body: responseBody,
      attempted_at: new Date().toISOString(),
    });

    if (responseStatus && responseStatus >= 200 && responseStatus < 300) {
      dispatched++;
    }
  }

  return new Response(
    JSON.stringify({ dispatched, total: matching.length }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
