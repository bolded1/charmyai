import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function sendBroadcast(adminClient: any, broadcast: any) {
  const { title, body, link, segment, role_filter } = broadcast;
  let userIds: string[] = [];

  if (segment === "role" && role_filter) {
    if (role_filter === "user") {
      const { data: allProfiles } = await adminClient.from("profiles").select("user_id");
      const { data: roledUsers } = await adminClient.from("user_roles").select("user_id");
      const roledSet = new Set((roledUsers || []).map((r: any) => r.user_id));
      userIds = (allProfiles || []).filter((p: any) => !roledSet.has(p.user_id)).map((p: any) => p.user_id);
    } else {
      const { data: roles } = await adminClient.from("user_roles").select("user_id").eq("role", role_filter);
      userIds = (roles || []).map((r: any) => r.user_id);
    }
  } else if (segment === "active") {
    const { data: profiles } = await adminClient.from("profiles").select("user_id").eq("status", "active");
    userIds = (profiles || []).map((p: any) => p.user_id);
  } else if (segment === "inactive") {
    const { data: profiles } = await adminClient.from("profiles").select("user_id").eq("status", "inactive");
    userIds = (profiles || []).map((p: any) => p.user_id);
  } else {
    const { data: profiles } = await adminClient.from("profiles").select("user_id");
    userIds = (profiles || []).map((p: any) => p.user_id);
  }

  if (userIds.length === 0) return 0;

  const notifications = userIds.map((user_id: string) => ({
    user_id,
    type: "announcement",
    title,
    body,
    link: link || null,
  }));

  let inserted = 0;
  for (let i = 0; i < notifications.length; i += 500) {
    const batch = notifications.slice(i, i + 500);
    const { error } = await adminClient.from("notifications").insert(batch);
    if (error) throw error;
    inserted += batch.length;
  }

  return inserted;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if this is a cron trigger (process scheduled broadcasts)
    const url = new URL(req.url);
    if (url.searchParams.get("cron") === "true") {
      const now = new Date().toISOString();
      const { data: pending } = await adminClient
        .from("broadcast_history")
        .select("*")
        .eq("status", "scheduled")
        .lte("scheduled_at", now);

      let processed = 0;
      for (const broadcast of pending || []) {
        try {
          const sent = await sendBroadcast(adminClient, broadcast);
          await adminClient.from("broadcast_history")
            .update({ status: "sent", sent_count: sent })
            .eq("id", broadcast.id);
          processed++;
        } catch {
          await adminClient.from("broadcast_history")
            .update({ status: "failed" })
            .eq("id", broadcast.id);
        }
      }

      return new Response(JSON.stringify({ processed }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Manual send — verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: hasRole } = await callerClient.rpc("has_role", {
      _user_id: caller.id, _role: "platform_admin",
    });
    if (!hasRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, body, link, segment, role_filter, scheduled_at } = await req.json();

    if (!title || !body) {
      return new Response(JSON.stringify({ error: "title and body are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Schedule for later
    if (scheduled_at) {
      await adminClient.from("broadcast_history").insert({
        title, body, link: link || null,
        segment: segment || "all", role_filter: role_filter || null,
        sent_count: 0, sent_by: caller.id,
        scheduled_at, status: "scheduled",
      });

      return new Response(JSON.stringify({ success: true, scheduled: true, scheduled_at }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send immediately
    const inserted = await sendBroadcast(adminClient, { title, body, link, segment, role_filter });

    await adminClient.from("broadcast_history").insert({
      title, body, link: link || null,
      segment: segment || "all", role_filter: role_filter || null,
      sent_count: inserted, sent_by: caller.id, status: "sent",
    });

    return new Response(JSON.stringify({ success: true, sent: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
