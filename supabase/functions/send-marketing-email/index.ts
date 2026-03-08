import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "platform_admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, htmlBody, testEmail, segment, roleFilter } = await req.json();
    if (!subject || !htmlBody) {
      return new Response(JSON.stringify({ error: "subject and htmlBody required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MAILGUN_API_KEY = Deno.env.get("MAILGUN_API_KEY")?.trim();
    const MAILGUN_DOMAIN = Deno.env.get("MAILGUN_DOMAIN")?.trim();
    if (!MAILGUN_API_KEY) throw new Error("MAILGUN_API_KEY not configured");
    if (!MAILGUN_DOMAIN) throw new Error("MAILGUN_DOMAIN not configured");

    // Build recipient list based on segment/filters
    let recipients: string[] = [];
    if (testEmail) {
      recipients = [testEmail];
    } else {
      let query = supabase.from("profiles").select("email, status, user_id");

      // Segment filter
      if (segment === "active" || !segment || segment === "all") {
        query = query.eq("status", "active");
      } else if (segment === "inactive") {
        query = query.eq("status", "inactive");
      }
      // "all_statuses" = no status filter

      const { data: profiles, error: profileErr } = await query;
      if (profileErr) throw profileErr;

      let filteredProfiles = (profiles || []).filter((p) => p.email);

      // Role filter
      if (roleFilter && roleFilter !== "all") {
        const { data: roleUsers, error: roleErr } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", roleFilter);
        if (roleErr) throw roleErr;
        const roleUserIds = new Set((roleUsers || []).map((r) => r.user_id));
        filteredProfiles = filteredProfiles.filter((p) => roleUserIds.has(p.user_id));
      }

      recipients = filteredProfiles.map((p) => p.email).filter(Boolean) as string[];
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: "No recipients found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send via Mailgun
    const batchSize = 1000;
    let totalSent = 0;
    let errors: string[] = [];

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const recipientVariables: Record<string, Record<string, string>> = {};
      batch.forEach((email) => {
        recipientVariables[email] = { email };
      });

      const form = new FormData();
      form.append("from", `Charmy <noreply@${MAILGUN_DOMAIN}>`);
      form.append("to", batch.join(","));
      form.append("subject", subject);
      form.append("html", htmlBody);
      form.append("recipient-variables", JSON.stringify(recipientVariables));

      const endpoints = [
        `https://api.eu.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
        `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
      ];

      let response: Response | null = null;

      for (let idx = 0; idx < endpoints.length; idx++) {
        const endpoint = endpoints[idx];
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
          },
          body: form,
        });

        if (response.ok) break;

        const shouldTryNextEndpoint = idx === 0 && [401, 403, 404].includes(response.status);
        if (shouldTryNextEndpoint) {
          await response.text();
          continue;
        }

        break;
      }

      if (!response) {
        throw new Error("Mailgun request failed before getting a response");
      }

      if (response.ok) {
        totalSent += batch.length;
      } else {
        const errText = await response.text();
        console.error("Mailgun send error:", response.status, errText);
        errors.push(`Batch ${i / batchSize + 1}: HTTP ${response.status} ${errText}`);
      }
    }

    // Log campaign (skip for test emails)
    if (!testEmail) {
      await supabase.from("email_campaigns").insert({
        subject,
        html_body: htmlBody,
        segment: segment || "all",
        role_filter: roleFilter || null,
        status: totalSent > 0 ? "sent" : "failed",
        recipient_count: recipients.length,
        sent_count: totalSent,
        error_count: errors.length,
        errors: errors.length > 0 ? errors : [],
        sent_by: userId,
        sent_at: new Date().toISOString(),
      });
    }

    const allFailed = totalSent === 0 && errors.length > 0;

    return new Response(
      JSON.stringify({
        success: !allFailed,
        sent: totalSent,
        total: recipients.length,
        error: allFailed ? "Mailgun rejected the request. Check MAILGUN_API_KEY / MAILGUN_DOMAIN pairing." : undefined,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: allFailed ? 502 : 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("send-marketing-email error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
