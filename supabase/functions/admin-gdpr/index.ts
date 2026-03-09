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
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const caller = { id: claimsData.claims.sub as string, email: claimsData.claims.email as string };
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
      return new Response(JSON.stringify({ error: "action and user_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    switch (action) {
      case "export": {
        // Gather all user data across tables
        const [profile, documents, expenses, income, exports, notifications, categories, rules, auditLogs, org, tickets] = await Promise.all([
          adminClient.from("profiles").select("*").eq("user_id", user_id),
          adminClient.from("documents").select("*").eq("user_id", user_id),
          adminClient.from("expense_records").select("*").eq("user_id", user_id),
          adminClient.from("income_records").select("*").eq("user_id", user_id),
          adminClient.from("export_history").select("*").eq("user_id", user_id),
          adminClient.from("notifications").select("*").eq("user_id", user_id),
          adminClient.from("expense_categories").select("*").eq("user_id", user_id),
          adminClient.from("auto_category_rules").select("*").eq("user_id", user_id),
          adminClient.from("audit_logs").select("*").eq("user_id", user_id),
          adminClient.from("organizations").select("*").eq("owner_user_id", user_id),
          adminClient.from("support_tickets").select("*").eq("user_id", user_id),
        ]);

        // Get auth user info
        const { data: authUser } = await adminClient.auth.admin.getUserById(user_id);

        const exportData = {
          exported_at: new Date().toISOString(),
          user_id,
          auth: authUser?.user ? {
            email: authUser.user.email,
            created_at: authUser.user.created_at,
            last_sign_in_at: authUser.user.last_sign_in_at,
            email_confirmed_at: authUser.user.email_confirmed_at,
          } : null,
          profile: profile.data || [],
          organizations: org.data || [],
          documents: documents.data || [],
          expense_records: expenses.data || [],
          income_records: income.data || [],
          expense_categories: categories.data || [],
          auto_category_rules: rules.data || [],
          export_history: exports.data || [],
          notifications: notifications.data || [],
          audit_logs: auditLogs.data || [],
          support_tickets: tickets.data || [],
          summary: {
            documents_count: documents.data?.length || 0,
            expenses_count: expenses.data?.length || 0,
            income_count: income.data?.length || 0,
            notifications_count: notifications.data?.length || 0,
          },
        };

        // Log this export action
        await adminClient.from("audit_logs").insert({
          user_id: caller.id,
          user_email: caller.email,
          action: "gdpr_data_export",
          entity_type: "user",
          entity_id: user_id,
          details: `GDPR data export for user ${user_id}`,
        });

        return new Response(JSON.stringify(exportData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        // Delete all user data in order (respecting foreign keys)
        // 1. Records that reference documents
        await adminClient.from("expense_records").delete().eq("user_id", user_id);
        await adminClient.from("income_records").delete().eq("user_id", user_id);

        // 2. Documents
        const { data: userDocs } = await adminClient.from("documents").select("file_path").eq("user_id", user_id);
        await adminClient.from("documents").delete().eq("user_id", user_id);

        // 3. Delete files from storage
        if (userDocs && userDocs.length > 0) {
          const filePaths = userDocs.map((d) => d.file_path).filter(Boolean);
          if (filePaths.length > 0) {
            await adminClient.storage.from("documents").remove(filePaths);
          }
        }

        // 4. Other user data
        await Promise.all([
          adminClient.from("export_history").delete().eq("user_id", user_id),
          adminClient.from("notifications").delete().eq("user_id", user_id),
          adminClient.from("expense_categories").delete().eq("user_id", user_id),
          adminClient.from("auto_category_rules").delete().eq("user_id", user_id),
          adminClient.from("support_tickets").delete().eq("user_id", user_id),
          adminClient.from("user_roles").delete().eq("user_id", user_id),
        ]);

        // 5. Organization + email imports
        const { data: orgs } = await adminClient.from("organizations").select("id").eq("owner_user_id", user_id);
        if (orgs && orgs.length > 0) {
          for (const org of orgs) {
            await adminClient.from("email_imports").delete().eq("organization_id", org.id);
          }
          await adminClient.from("organizations").delete().eq("owner_user_id", user_id);
        }

        // 6. Profile
        await adminClient.from("profiles").delete().eq("user_id", user_id);

        // 7. Anonymize audit logs (keep for compliance but remove PII)
        await adminClient.from("audit_logs").update({
          user_email: "[deleted]",
          ip_address: null,
          details: "[user data deleted per GDPR request]",
        }).eq("user_id", user_id);

        // 8. Delete auth user
        const { error: authError } = await adminClient.auth.admin.deleteUser(user_id);
        if (authError) throw authError;

        // Log deletion
        await adminClient.from("audit_logs").insert({
          user_id: caller.id,
          user_email: caller.email,
          action: "gdpr_data_deletion",
          entity_type: "user",
          entity_id: user_id,
          details: `GDPR data deletion completed for user ${user_id}`,
        });

        return new Response(JSON.stringify({ success: true, message: "All user data has been permanently deleted." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action. Use 'export' or 'delete'." }), {
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
