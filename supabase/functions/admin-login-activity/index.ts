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

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch login-related audit logs
    const { data: loginLogs, error: logsError } = await adminClient
      .from("audit_logs")
      .select("*")
      .in("action", ["user_login", "user_login_failed", "user_signup", "password_reset"])
      .order("created_at", { ascending: false })
      .limit(500);

    if (logsError) throw logsError;

    const logs = loginLogs || [];

    // Compute stats
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const totalLogins = logs.filter((l) => l.action === "user_login").length;
    const failedLogins = logs.filter((l) => l.action === "user_login_failed").length;
    const signups = logs.filter((l) => l.action === "user_signup").length;

    const recentFailed = logs.filter(
      (l) => l.action === "user_login_failed" && new Date(l.created_at) >= last24h
    ).length;

    // IP analysis
    const ipCounts: Record<string, { total: number; failed: number; emails: Set<string> }> = {};
    for (const log of logs) {
      const ip = log.ip_address || "unknown";
      if (!ipCounts[ip]) ipCounts[ip] = { total: 0, failed: 0, emails: new Set() };
      ipCounts[ip].total++;
      if (log.action === "user_login_failed") ipCounts[ip].failed++;
      if (log.user_email) ipCounts[ip].emails.add(log.user_email);
    }

    // Suspicious IPs: >3 failed attempts or attempts on >3 different accounts
    const suspiciousIps = Object.entries(ipCounts)
      .filter(([_, v]) => v.failed > 3 || v.emails.size > 3)
      .map(([ip, v]) => ({
        ip,
        totalAttempts: v.total,
        failedAttempts: v.failed,
        uniqueAccounts: v.emails.size,
      }))
      .sort((a, b) => b.failedAttempts - a.failedAttempts);

    // Daily trend (last 30 days)
    const dailyTrend: Record<string, { logins: number; failed: number; signups: number }> = {};
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    for (const log of logs) {
      if (new Date(log.created_at) < last30d) continue;
      const day = log.created_at.substring(0, 10);
      if (!dailyTrend[day]) dailyTrend[day] = { logins: 0, failed: 0, signups: 0 };
      if (log.action === "user_login") dailyTrend[day].logins++;
      if (log.action === "user_login_failed") dailyTrend[day].failed++;
      if (log.action === "user_signup") dailyTrend[day].signups++;
    }

    const trendData = Object.entries(dailyTrend)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, counts]) => ({ date, ...counts }));

    // Top failed accounts
    const failedByEmail: Record<string, number> = {};
    for (const log of logs.filter((l) => l.action === "user_login_failed")) {
      const email = log.user_email || "unknown";
      failedByEmail[email] = (failedByEmail[email] || 0) + 1;
    }
    const topFailedAccounts = Object.entries(failedByEmail)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([email, count]) => ({ email, failedAttempts: count }));

    // Recent events
    const recentEvents = logs.slice(0, 50).map((l) => ({
      id: l.id,
      action: l.action,
      email: l.user_email,
      ip: l.ip_address,
      timestamp: l.created_at,
      details: l.details,
    }));

    return new Response(JSON.stringify({
      stats: {
        totalLogins,
        failedLogins,
        signups,
        recentFailed24h: recentFailed,
        failureRate: totalLogins + failedLogins > 0
          ? Math.round((failedLogins / (totalLogins + failedLogins)) * 100)
          : 0,
      },
      suspiciousIps,
      trendData,
      topFailedAccounts,
      recentEvents,
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
