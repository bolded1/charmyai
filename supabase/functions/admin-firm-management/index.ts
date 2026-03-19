import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FIRM_PLAN_PRODUCT_ID = "prod_U7OoSyNLV7qab3";

const logStep = (step: string, details?: any) => {
  console.log(`[ADMIN-FIRM] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
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

    // Separate admin auth client for user management operations
    const adminAuthClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const { action } = body;
    logStep("Action received", { action });

    switch (action) {
      // ── List all firm accounts ──
      case "list_firms": {
        const { data: firms, error } = await adminClient
          .from("organizations")
          .select("*")
          .eq("workspace_type", "accounting_firm")
          .order("created_at", { ascending: false });
        if (error) throw error;

        // Enrich with owner info, workspace counts, payment status
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" }) : null;

        const enriched = await Promise.all(
          (firms || []).map(async (firm: any) => {
            // Owner profile
            const { data: profile } = await adminClient
              .from("profiles")
              .select("email, full_name, first_name, last_name, status, billing_setup_at")
              .eq("user_id", firm.owner_user_id)
              .maybeSingle();

            // Client workspace count
            const { count } = await adminClient
              .from("organizations")
              .select("id", { count: "exact", head: true })
              .eq("parent_org_id", firm.id)
              .eq("workspace_type", "client");

            // Check Stripe payment status
            let paymentStatus = "unknown";
            if (stripe && profile?.email) {
              try {
                const customers = await stripe.customers.list({ email: profile.email, limit: 1 });
                if (customers.data.length > 0) {
                  const sessions = await stripe.checkout.sessions.list({
                    customer: customers.data[0].id,
                    limit: 50,
                  });
                  for (const session of sessions.data) {
                    if (session.payment_status === "paid" && session.mode === "payment") {
                      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
                      for (const item of lineItems.data) {
                        const productId = typeof item.price?.product === "string" ? item.price.product : (item.price?.product as any)?.id;
                        if (productId === FIRM_PLAN_PRODUCT_ID) {
                          paymentStatus = "paid";
                          break;
                        }
                      }
                      if (paymentStatus === "paid") break;
                    }
                  }
                  if (paymentStatus !== "paid") paymentStatus = "unpaid";
                } else {
                  paymentStatus = "no_customer";
                }
              } catch (err) {
                logStep("Stripe check error", { error: String(err) });
                paymentStatus = "error";
              }
            }

            return {
              ...firm,
              owner_email: profile?.email || null,
              owner_name: profile?.full_name || `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim() || null,
              owner_status: profile?.status || "active",
              billing_setup_at: profile?.billing_setup_at || null,
              workspace_count: count || 0,
              payment_status: paymentStatus,
            };
          })
        );

        return new Response(JSON.stringify({ firms: enriched }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── List workspaces under a firm ──
      case "list_firm_workspaces": {
        const { org_id } = body;
        if (!org_id) throw new Error("org_id is required");

        const { data: workspaces, error } = await adminClient
          .from("organizations")
          .select("*")
          .eq("parent_org_id", org_id)
          .eq("workspace_type", "client")
          .order("created_at", { ascending: false });
        if (error) throw error;

        // Enrich with doc counts
        const enriched = await Promise.all(
          (workspaces || []).map(async (ws: any) => {
            const { count } = await adminClient
              .from("documents")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", ws.id);
            return { ...ws, doc_count: count || 0 };
          })
        );

        return new Response(JSON.stringify({ workspaces: enriched }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Adjust workspace limit ──
      case "adjust_workspace_limit": {
        const { org_id, new_limit } = body;
        if (!org_id || typeof new_limit !== "number" || new_limit < 1) {
          throw new Error("org_id and valid new_limit are required");
        }

        const { error } = await adminClient
          .from("organizations")
          .update({ max_client_workspaces: new_limit })
          .eq("id", org_id);
        if (error) throw error;

        // Audit log
        await adminClient.from("audit_logs").insert({
          action: "workspace_limit_changed",
          user_id: caller.id,
          user_email: caller.email,
          entity_type: "organization",
          entity_id: org_id,
          details: `Workspace limit changed to ${new_limit}`,
          metadata: { new_limit },
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Grant firm access (set workspace_type to accounting_firm) ──
      case "grant_firm_access": {
        const { org_id, max_workspaces } = body;
        if (!org_id) throw new Error("org_id is required");

        const { error } = await adminClient
          .from("organizations")
          .update({
            workspace_type: "accounting_firm",
            max_client_workspaces: max_workspaces || 10,
          })
          .eq("id", org_id);
        if (error) throw error;

        // Also set billing_setup_at on the owner's profile
        const { data: org } = await adminClient
          .from("organizations")
          .select("owner_user_id")
          .eq("id", org_id)
          .maybeSingle();

        if (org) {
          await adminClient
            .from("profiles")
            .update({ billing_setup_at: new Date().toISOString() })
            .eq("user_id", org.owner_user_id);
        }

        await adminClient.from("audit_logs").insert({
          action: "accountant_plan_activated",
          user_id: caller.id,
          user_email: caller.email,
          entity_type: "organization",
          entity_id: org_id,
          details: `Firm access granted with ${max_workspaces || 10} workspaces`,
          metadata: { max_workspaces: max_workspaces || 10 },
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Revoke firm access ──
      case "revoke_firm_access": {
        const { org_id } = body;
        if (!org_id) throw new Error("org_id is required");

        const { error } = await adminClient
          .from("organizations")
          .update({ workspace_type: "standard", max_client_workspaces: 1 })
          .eq("id", org_id);
        if (error) throw error;

        await adminClient.from("audit_logs").insert({
          action: "access_suspended",
          user_id: caller.id,
          user_email: caller.email,
          entity_type: "organization",
          entity_id: org_id,
          details: "Firm access revoked, downgraded to standard",
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Suspend/unsuspend firm owner ──
      case "toggle_firm_status": {
        const { user_id, status } = body;
        if (!user_id || !["active", "inactive"].includes(status)) {
          throw new Error("user_id and status (active/inactive) are required");
        }

        await adminClient.from("profiles").update({ status }).eq("user_id", user_id);

        if (status === "inactive") {
          await adminAuthClient.auth.admin.updateUserById(user_id, { ban_duration: "876600h" });
        } else {
          await adminAuthClient.auth.admin.updateUserById(user_id, { ban_duration: "none" });
        }

        await adminClient.from("audit_logs").insert({
          action: status === "inactive" ? "access_suspended" : "access_restored",
          user_id: caller.id,
          user_email: caller.email,
          entity_type: "user",
          entity_id: user_id,
          details: `Firm owner ${status === "inactive" ? "suspended" : "restored"}`,
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Archive a workspace ──
      case "archive_workspace": {
        const { org_id } = body;
        if (!org_id) throw new Error("org_id is required");

        const { error } = await adminClient
          .from("organizations")
          .update({ archived_at: new Date().toISOString() })
          .eq("id", org_id);
        if (error) throw error;

        await adminClient.from("audit_logs").insert({
          action: "workspace_archived",
          user_id: caller.id,
          user_email: caller.email,
          entity_type: "organization",
          entity_id: org_id,
          details: "Workspace archived by admin",
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Delete a workspace ──
      case "delete_workspace": {
        const { org_id } = body;
        if (!org_id) throw new Error("org_id is required");

        const { error } = await adminClient
          .from("organizations")
          .delete()
          .eq("id", org_id)
          .eq("workspace_type", "client");
        if (error) throw error;

        await adminClient.from("audit_logs").insert({
          action: "workspace_deleted",
          user_id: caller.id,
          user_email: caller.email,
          entity_type: "organization",
          entity_id: org_id,
          details: "Client workspace deleted by admin",
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Mark as paid (manual entitlement) ──
      case "mark_as_paid": {
        const { org_id } = body;
        if (!org_id) throw new Error("org_id is required");

        // Ensure it's set to accounting_firm with 10 workspaces
        const { error } = await adminClient
          .from("organizations")
          .update({ workspace_type: "accounting_firm", max_client_workspaces: 10 })
          .eq("id", org_id);
        if (error) throw error;

        // Set billing_setup_at
        const { data: org } = await adminClient
          .from("organizations")
          .select("owner_user_id")
          .eq("id", org_id)
          .maybeSingle();

        if (org) {
          await adminClient
            .from("profiles")
            .update({ billing_setup_at: new Date().toISOString() })
            .eq("user_id", org.owner_user_id);
        }

        await adminClient.from("audit_logs").insert({
          action: "accountant_plan_activated",
          user_id: caller.id,
          user_email: caller.email,
          entity_type: "organization",
          entity_id: org_id,
          details: "Manually marked as paid by admin",
          metadata: { manual: true },
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ── Delete entire firm account ──
      case "delete_firm": {
        const { org_id } = body;
        if (!org_id) throw new Error("org_id is required");

        // Verify it's an accounting_firm
        const { data: firmOrg, error: fErr } = await adminClient
          .from("organizations")
          .select("id, name, owner_user_id, workspace_type")
          .eq("id", org_id)
          .maybeSingle();
        if (fErr) throw fErr;
        if (!firmOrg || firmOrg.workspace_type !== "accounting_firm") {
          throw new Error("Organization is not an accounting firm");
        }

        // Delete all child client workspaces and their related data
        const { data: childOrgs } = await adminClient
          .from("organizations")
          .select("id")
          .eq("parent_org_id", org_id);

        const childIds = (childOrgs || []).map((c: any) => c.id);

        // Delete related data for child workspaces
        for (const childId of childIds) {
          await adminClient.from("documents").delete().eq("organization_id", childId);
          await adminClient.from("expense_records").delete().eq("organization_id", childId);
          await adminClient.from("income_records").delete().eq("organization_id", childId);
          await adminClient.from("expense_categories").delete().eq("organization_id", childId);
          await adminClient.from("export_history").delete().eq("organization_id", childId);
          await adminClient.from("auto_category_rules").delete().eq("organization_id", childId);
          await adminClient.from("email_imports").delete().eq("organization_id", childId);
          await adminClient.from("client_invitations").delete().eq("workspace_id", childId);
        }

        // Delete child orgs
        if (childIds.length > 0) {
          await adminClient.from("team_workspace_access").delete().in("workspace_id", childIds);
          await adminClient.from("organizations").delete().in("id", childIds);
        }

        // Delete firm-level data
        await adminClient.from("documents").delete().eq("organization_id", org_id);
        await adminClient.from("expense_records").delete().eq("organization_id", org_id);
        await adminClient.from("income_records").delete().eq("organization_id", org_id);
        await adminClient.from("expense_categories").delete().eq("organization_id", org_id);
        await adminClient.from("export_history").delete().eq("organization_id", org_id);
        await adminClient.from("auto_category_rules").delete().eq("organization_id", org_id);
        await adminClient.from("email_imports").delete().eq("organization_id", org_id);
        await adminClient.from("team_members").delete().eq("firm_org_id", org_id);
        await adminClient.from("client_invitations").delete().eq("firm_org_id", org_id);
        await adminClient.from("chat_conversations").delete().eq("organization_id", org_id);

        // Delete the firm org itself
        const { error: delErr } = await adminClient
          .from("organizations")
          .delete()
          .eq("id", org_id);
        if (delErr) throw delErr;

        await adminClient.from("audit_logs").insert({
          action: "firm_deleted",
          user_id: caller.id,
          user_email: caller.email,
          entity_type: "organization",
          entity_id: org_id,
          details: `Firm "${firmOrg.name}" and ${childIds.length} workspaces permanently deleted`,
          metadata: { firm_name: firmOrg.name, workspace_count: childIds.length },
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
    logStep("ERROR", { message: err.message });
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
