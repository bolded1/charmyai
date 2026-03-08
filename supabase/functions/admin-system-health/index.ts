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

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Table row counts
    const tables = ["profiles", "documents", "expense_records", "income_records", "organizations", "notifications", "audit_logs", "support_tickets", "export_history", "feature_flags", "scheduled_jobs"];
    const tableCounts: Record<string, number> = {};
    for (const table of tables) {
      const { count } = await adminClient.from(table).select("*", { count: "exact", head: true });
      tableCounts[table] = count || 0;
    }

    // Storage buckets
    const { data: buckets } = await adminClient.storage.listBuckets();
    const bucketInfo = [];
    for (const bucket of buckets || []) {
      const { data: files } = await adminClient.storage.from(bucket.name).list("", { limit: 1000 });
      bucketInfo.push({
        name: bucket.name,
        fileCount: files?.length || 0,
        public: bucket.public,
      });
    }

    // Recent errors from audit logs
    const { data: recentErrors } = await adminClient
      .from("audit_logs")
      .select("action, details, created_at, user_email")
      .in("action", ["document_failed", "extraction_error", "system_error"])
      .order("created_at", { ascending: false })
      .limit(20);

    // Auth user count
    const { data: authData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });
    const totalAuthUsers = (authData as any)?.total || tableCounts["profiles"];

    // Scheduled jobs status
    const { data: jobs } = await adminClient
      .from("scheduled_jobs")
      .select("id, name, enabled, last_run_at, last_status, cron_expression");

    // Recent job failures
    const { data: jobFailures } = await adminClient
      .from("job_run_history")
      .select("job_id, status, error_message, started_at")
      .eq("status", "failed")
      .order("started_at", { ascending: false })
      .limit(10);

    // Documents processed last 24h
    const last24h = new Date(Date.now() - 86400000).toISOString();
    const { count: docsProcessed24h } = await adminClient
      .from("documents")
      .select("*", { count: "exact", head: true })
      .gte("created_at", last24h);

    // Feature flags active count
    const { count: activeFlags } = await adminClient
      .from("feature_flags")
      .select("*", { count: "exact", head: true })
      .eq("enabled", true);

    return new Response(JSON.stringify({
      database: {
        tableCounts,
        totalAuthUsers,
      },
      storage: {
        buckets: bucketInfo,
      },
      activity: {
        docsProcessed24h: docsProcessed24h || 0,
        recentErrors: recentErrors || [],
        activeFeatureFlags: activeFlags || 0,
      },
      jobs: {
        list: jobs || [],
        recentFailures: jobFailures || [],
      },
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
