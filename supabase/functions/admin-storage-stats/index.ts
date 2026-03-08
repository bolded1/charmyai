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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify platform_admin
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

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Fetch all documents with file sizes and user info
    const { data: docs, error: docsError } = await adminClient
      .from("documents")
      .select("user_id, file_size, file_type, created_at");
    if (docsError) throw docsError;

    // Fetch all profiles for user names
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("user_id, full_name, first_name, last_name, email");

    // Fetch organizations
    const { data: orgs } = await adminClient
      .from("organizations")
      .select("id, name, owner_user_id");

    const profileMap = new Map<string, { name: string; email: string }>();
    (profiles || []).forEach(p => {
      const name = p.full_name || `${p.first_name || ""} ${p.last_name || ""}`.trim() || p.email || "Unknown";
      profileMap.set(p.user_id, { name, email: p.email || "" });
    });

    const orgMap = new Map<string, string>();
    (orgs || []).forEach(o => orgMap.set(o.owner_user_id, o.name));

    // Per-user storage
    const userStorage: Record<string, { bytes: number; docCount: number; fileTypes: Record<string, number> }> = {};
    let totalBytes = 0;

    for (const doc of docs || []) {
      if (!userStorage[doc.user_id]) {
        userStorage[doc.user_id] = { bytes: 0, docCount: 0, fileTypes: {} };
      }
      const size = doc.file_size || 0;
      userStorage[doc.user_id].bytes += size;
      userStorage[doc.user_id].docCount++;
      totalBytes += size;

      const ft = doc.file_type?.split("/")[1] || "other";
      userStorage[doc.user_id].fileTypes[ft] = (userStorage[doc.user_id].fileTypes[ft] || 0) + size;
    }

    // Build per-user breakdown
    const perUser = Object.entries(userStorage)
      .map(([userId, data]) => {
        const profile = profileMap.get(userId);
        return {
          userId,
          name: profile?.name || "Unknown",
          email: profile?.email || "",
          organization: orgMap.get(userId) || "—",
          bytes: data.bytes,
          docCount: data.docCount,
          fileTypes: data.fileTypes,
        };
      })
      .sort((a, b) => b.bytes - a.bytes);

    // File type totals
    const fileTypeTotals: Record<string, number> = {};
    for (const user of perUser) {
      for (const [ft, bytes] of Object.entries(user.fileTypes)) {
        fileTypeTotals[ft] = (fileTypeTotals[ft] || 0) + bytes;
      }
    }
    const fileTypeBreakdown = Object.entries(fileTypeTotals)
      .map(([name, bytes]) => ({ name, bytes }))
      .sort((a, b) => b.bytes - a.bytes);

    // Monthly upload volume (last 6 months)
    const uploadTrend: { month: string; bytes: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = d.toLocaleString("en", { month: "short", year: "2-digit" });

      let monthBytes = 0;
      let monthCount = 0;
      for (const doc of docs || []) {
        const cd = new Date(doc.created_at);
        if (cd.getFullYear() === year && cd.getMonth() === month) {
          monthBytes += doc.file_size || 0;
          monthCount++;
        }
      }
      uploadTrend.push({ month: label, bytes: monthBytes, count: monthCount });
    }

    return new Response(JSON.stringify({
      totalBytes,
      totalDocs: (docs || []).length,
      totalUsers: perUser.length,
      perUser,
      fileTypeBreakdown,
      uploadTrend,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
