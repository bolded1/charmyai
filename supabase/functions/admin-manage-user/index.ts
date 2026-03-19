import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

      case "bulk_notify": {
        const { user_ids, title, body: notifyBody } = body;
        if (!user_ids || !title || !notifyBody) {
          return new Response(JSON.stringify({ error: "user_ids, title, and body are required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const notifications = user_ids.map((uid: string) => ({
          user_id: uid,
          type: "announcement",
          title,
          body: notifyBody,
        }));

        const { error: insertError } = await adminClient.from("notifications").insert(notifications);
        if (insertError) throw insertError;

        return new Response(JSON.stringify({ success: true, sent: notifications.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "revoke_firm": {
        // Downgrade all firm orgs owned by this user to standard
        const { data: firmOrgs } = await adminClient
          .from("organizations")
          .select("id")
          .eq("owner_user_id", user_id)
          .eq("workspace_type", "accounting_firm");

        if (firmOrgs && firmOrgs.length > 0) {
          const firmIds = firmOrgs.map((o: any) => o.id);

          // Remove child workspace links
          await adminClient
            .from("organizations")
            .update({ parent_org_id: null, workspace_type: "standard" })
            .in("parent_org_id", firmIds);

          // Remove team members
          await adminClient
            .from("team_members")
            .delete()
            .in("firm_org_id", firmIds);

          // Downgrade firm orgs to standard
          await adminClient
            .from("organizations")
            .update({ workspace_type: "standard", max_client_workspaces: 1 })
            .in("id", firmIds);
        }

        // Audit
        await adminClient.from("audit_logs").insert({
          user_id: caller.id,
          action: "admin_revoke_firm",
          entity_type: "user",
          entity_id: user_id,
          details: `Revoked firm access for user, downgraded ${firmOrgs?.length || 0} firm(s) to standard`,
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete_user": {
        // Delete all organizations owned by this user (cascades via RLS/FK)
        const { data: userOrgs } = await adminClient
          .from("organizations")
          .select("id, workspace_type, parent_org_id")
          .eq("owner_user_id", user_id);

        if (userOrgs) {
          // First delete child workspaces of any firm orgs
          const firmIds = userOrgs.filter((o: any) => o.workspace_type === "accounting_firm").map((o: any) => o.id);
          if (firmIds.length > 0) {
            // Get child workspace ids
            const { data: childOrgs } = await adminClient
              .from("organizations")
              .select("id")
              .in("parent_org_id", firmIds);
            const childIds = (childOrgs || []).map((o: any) => o.id);

            // Delete data in child workspaces
            for (const cid of childIds) {
              await Promise.all([
                adminClient.from("documents").delete().eq("organization_id", cid),
                adminClient.from("expense_records").delete().eq("organization_id", cid),
                adminClient.from("income_records").delete().eq("organization_id", cid),
                adminClient.from("export_history").delete().eq("organization_id", cid),
              ]);
            }

            // Delete team members and workspace access
            await adminClient.from("team_members").delete().in("firm_org_id", firmIds);

            // Delete child orgs
            if (childIds.length > 0) {
              await adminClient.from("organizations").delete().in("id", childIds);
            }
          }

          // Delete all user's own org data
          const allOrgIds = userOrgs.map((o: any) => o.id);
          for (const oid of allOrgIds) {
            await Promise.all([
              adminClient.from("documents").delete().eq("organization_id", oid),
              adminClient.from("expense_records").delete().eq("organization_id", oid),
              adminClient.from("income_records").delete().eq("organization_id", oid),
              adminClient.from("export_history").delete().eq("organization_id", oid),
            ]);
          }

          // Delete organizations
          await adminClient.from("organizations").delete().in("id", allOrgIds);
        }

        // Delete user data without org
        await Promise.all([
          adminClient.from("documents").delete().eq("user_id", user_id),
          adminClient.from("expense_records").delete().eq("user_id", user_id),
          adminClient.from("income_records").delete().eq("user_id", user_id),
          adminClient.from("export_history").delete().eq("user_id", user_id),
          adminClient.from("user_roles").delete().eq("user_id", user_id),
          adminClient.from("profiles").delete().eq("user_id", user_id),
          adminClient.from("notifications").delete().eq("user_id", user_id),
          adminClient.from("support_tickets").delete().eq("user_id", user_id),
          adminClient.from("user_feedback").delete().eq("user_id", user_id),
        ]);

        // Delete auth user
        const { error: deleteErr } = await adminClient.auth.admin.deleteUser(user_id);
        if (deleteErr) throw deleteErr;

        // Audit
        await adminClient.from("audit_logs").insert({
          user_id: caller.id,
          action: "admin_delete_user",
          entity_type: "user",
          entity_id: user_id,
          details: `Permanently deleted user account and all associated data`,
        });

        return new Response(JSON.stringify({ success: true }), {
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
