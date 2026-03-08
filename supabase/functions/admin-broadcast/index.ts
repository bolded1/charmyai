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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is platform_admin
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: hasRole } = await callerClient.rpc("has_role", {
      _user_id: caller.id,
      _role: "platform_admin",
    });
    if (!hasRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, body, link, segment, role_filter } = await req.json();

    if (!title || !body) {
      return new Response(JSON.stringify({ error: "title and body are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get target user IDs based on segment
    let userIds: string[] = [];

    if (segment === "role" && role_filter) {
      // Filter by role
      if (role_filter === "user") {
        // Users with no role entry (default "user" role)
        const { data: allProfiles } = await adminClient.from("profiles").select("user_id");
        const { data: roledUsers } = await adminClient.from("user_roles").select("user_id");
        const roledSet = new Set((roledUsers || []).map((r) => r.user_id));
        userIds = (allProfiles || []).filter((p) => !roledSet.has(p.user_id)).map((p) => p.user_id);
      } else {
        const { data: roles } = await adminClient.from("user_roles").select("user_id").eq("role", role_filter);
        userIds = (roles || []).map((r) => r.user_id);
      }
    } else if (segment === "active") {
      const { data: profiles } = await adminClient.from("profiles").select("user_id").eq("status", "active");
      userIds = (profiles || []).map((p) => p.user_id);
    } else if (segment === "inactive") {
      const { data: profiles } = await adminClient.from("profiles").select("user_id").eq("status", "inactive");
      userIds = (profiles || []).map((p) => p.user_id);
    } else {
      // All users
      const { data: profiles } = await adminClient.from("profiles").select("user_id");
      userIds = (profiles || []).map((p) => p.user_id);
    }

    if (userIds.length === 0) {
      return new Response(JSON.stringify({ error: "No users match the selected segment", sent: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Batch insert notifications
    const notifications = userIds.map((user_id) => ({
      user_id,
      type: "announcement",
      title,
      body,
      link: link || null,
    }));

    // Insert in batches of 500
    let inserted = 0;
    for (let i = 0; i < notifications.length; i += 500) {
      const batch = notifications.slice(i, i + 500);
      const { error } = await adminClient.from("notifications").insert(batch);
      if (error) throw error;
      inserted += batch.length;
    }

    // Log to broadcast_history
    await adminClient.from("broadcast_history").insert({
      title,
      body,
      link: link || null,
      segment: segment || "all",
      role_filter: role_filter || null,
      sent_count: inserted,
      sent_by: caller.id,
    });

    return new Response(JSON.stringify({ success: true, sent: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
