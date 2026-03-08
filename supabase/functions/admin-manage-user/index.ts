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

    const body = await req.json();
    const { action, user_id } = body;

    if (!action || !user_id) {
      return new Response(JSON.stringify({ error: "action and user_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    switch (action) {
      case "change_role": {
        const { role } = body;
        if (!role) {
          return new Response(JSON.stringify({ error: "role is required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Delete existing roles for this user
        await adminClient.from("user_roles").delete().eq("user_id", user_id);

        // Insert new role (skip if "user" since that's the default)
        if (role !== "user") {
          const { error } = await adminClient.from("user_roles").insert({
            user_id,
            role,
          });
          if (error) throw error;
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "reset_password": {
        const { new_password } = body;
        if (!new_password || new_password.length < 6) {
          return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error } = await adminClient.auth.admin.updateUser(user_id, {
          password: new_password,
        });
        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "toggle_status": {
        const { status } = body; // "active" or "inactive"
        if (!["active", "inactive"].includes(status)) {
          return new Response(JSON.stringify({ error: "status must be active or inactive" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Update profile status
        const { error: profileError } = await adminClient.from("profiles")
          .update({ status })
          .eq("user_id", user_id);
        if (profileError) throw profileError;

        // Ban/unban in auth
        if (status === "inactive") {
          const { error } = await adminClient.auth.admin.updateUser(user_id, {
            ban_duration: "876600h", // ~100 years
          });
          if (error) throw error;
        } else {
          const { error } = await adminClient.auth.admin.updateUser(user_id, {
            ban_duration: "none",
          });
          if (error) throw error;
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_activity": {
        // Fetch recent activity across tables
        const [docs, expenses, income, exports] = await Promise.all([
          adminClient.from("documents").select("id, file_name, status, created_at, updated_at")
            .eq("user_id", user_id).order("created_at", { ascending: false }).limit(10),
          adminClient.from("expense_records").select("id, supplier_name, total_amount, currency, created_at")
            .eq("user_id", user_id).order("created_at", { ascending: false }).limit(10),
          adminClient.from("income_records").select("id, customer_name, total_amount, currency, created_at")
            .eq("user_id", user_id).order("created_at", { ascending: false }).limit(10),
          adminClient.from("export_history").select("id, export_name, format, row_count, created_at")
            .eq("user_id", user_id).order("created_at", { ascending: false }).limit(10),
        ]);

        return new Response(JSON.stringify({
          documents: docs.data || [],
          expenses: expenses.data || [],
          income: income.data || [],
          exports: exports.data || [],
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
