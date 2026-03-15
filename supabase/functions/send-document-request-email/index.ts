import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await adminClient.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { request_id } = await req.json();
    if (!request_id) {
      return new Response(JSON.stringify({ error: "request_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch document request
    const { data: docRequest, error: reqErr } = await adminClient
      .from("document_requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (reqErr || !docRequest) {
      return new Response(JSON.stringify({ error: "Request not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller has access to this firm
    const { data: firm } = await adminClient
      .from("organizations")
      .select("name, owner_user_id")
      .eq("id", docRequest.firm_org_id)
      .single();

    if (!firm) {
      return new Response(JSON.stringify({ error: "Firm not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check caller is firm owner or team member
    const isOwner = firm.owner_user_id === user.id;
    if (!isOwner) {
      const { data: teamMember } = await adminClient
        .from("team_members")
        .select("id")
        .eq("firm_org_id", docRequest.firm_org_id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (!teamMember) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Get workspace client contact email
    const { data: workspace } = await adminClient
      .from("organizations")
      .select("name, client_contact_email, client_contact_name")
      .eq("id", docRequest.workspace_id)
      .single();

    if (!workspace?.client_contact_email) {
      return new Response(
        JSON.stringify({ error: "No client contact email configured for this workspace" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build email
    const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY")?.trim();
    const MAILGUN_DOMAIN = Deno.env.get("MAILGUN_DOMAIN")?.trim();
    if (!MAILGUN_API_KEY) throw new Error("MAILGUN_API_KEY not configured");
    if (!MAILGUN_DOMAIN) throw new Error("MAILGUN_DOMAIN not configured");

    const uploadUrl = `https://charmy.net/request/${docRequest.token}`;
    const clientName = workspace.client_contact_name || workspace.name;
    const deadlineText = docRequest.expires_at
      ? `<p style="margin:0 0 16px;color:#555;font-size:14px;">Please submit your documents by <strong>${new Date(docRequest.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</strong>.</p>`
      : "";
    const descriptionText = docRequest.description
      ? `<p style="margin:0 0 16px;color:#555;font-size:14px;">${docRequest.description.replace(/\n/g, "<br>")}</p>`
      : "";

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#1E3A8A;padding:24px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">Document Request</h1>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px;color:#333;font-size:15px;">Hi ${clientName},</p>
      <p style="margin:0 0 16px;color:#555;font-size:14px;"><strong>${firm.name}</strong> is requesting documents from you:</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:0 0 16px;">
        <p style="margin:0 0 4px;color:#333;font-size:15px;font-weight:600;">${docRequest.title}</p>
        ${descriptionText}
        ${deadlineText}
      </div>
      <div style="text-align:center;margin:24px 0;">
        <a href="${uploadUrl}" style="display:inline-block;background:#1E3A8A;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:15px;font-weight:600;">Upload Documents</a>
      </div>
      <p style="margin:0;color:#999;font-size:12px;text-align:center;">Or copy this link: ${uploadUrl}</p>
    </div>
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#999;font-size:11px;text-align:center;">Sent by ${firm.name} via Charmy</p>
    </div>
  </div>
</body>
</html>`;

    // Send via Mailgun
    const form = new FormData();
    form.append("from", `${firm.name} <noreply@${MAILGUN_DOMAIN}>`);
    form.append("to", workspace.client_contact_email);
    form.append("subject", `Document request: ${docRequest.title}`);
    form.append("html", htmlBody);

    const endpoints = [
      `https://api.eu.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
      `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
    ];

    let response: Response | null = null;
    for (let idx = 0; idx < endpoints.length; idx++) {
      response = await fetch(endpoints[idx], {
        method: "POST",
        headers: { Authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}` },
        body: form,
      });
      if (response.ok) break;
      if (idx === 0 && [401, 403, 404].includes(response.status)) {
        await response.text();
        continue;
      }
      break;
    }

    if (!response?.ok) {
      const errText = await response?.text();
      console.error("Mailgun error:", errText);
      return new Response(JSON.stringify({ error: "Failed to send email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ success: true, sent_to: workspace.client_contact_email }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-document-request-email error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
