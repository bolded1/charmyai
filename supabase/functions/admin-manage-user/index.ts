import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const throwIfError = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

const unique = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

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
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user: caller },
    } = await callerClient.auth.getUser();

    if (!caller) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { data: hasRole, error: roleError } = await callerClient.rpc("has_role", {
      _user_id: caller.id,
      _role: "platform_admin",
    });
    throwIfError(roleError);

    if (!hasRole) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const body = await req.json();
    const { action, user_id } = body;

    if (!action) {
      return jsonResponse({ error: "action is required" }, 400);
    }

    const adminDbClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const adminAuthClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    switch (action) {
      case "change_role": {
        const { role } = body;
        if (!user_id || !role) {
          return jsonResponse({ error: "user_id and role are required" }, 400);
        }

        if (!["user", "moderator", "admin", "platform_admin"].includes(role)) {
          return jsonResponse({ error: "Invalid role" }, 400);
        }

        const { error: deleteRoleError } = await adminDbClient
          .from("user_roles")
          .delete()
          .eq("user_id", user_id);
        throwIfError(deleteRoleError);

        if (role !== "user") {
          const { error: insertRoleError } = await adminDbClient.from("user_roles").insert({
            user_id,
            role,
          });
          throwIfError(insertRoleError);
        }

        return jsonResponse({ success: true });
      }

      case "reset_password": {
        const { new_password } = body;
        if (!user_id || !new_password || new_password.length < 6) {
          return jsonResponse({ error: "Password must be at least 6 characters" }, 400);
        }

        const { error } = await adminAuthClient.auth.admin.updateUserById(user_id, {
          password: new_password,
        });
        throwIfError(error);

        return jsonResponse({ success: true });
      }

      case "toggle_status": {
        const { status } = body;
        if (!user_id || !["active", "inactive"].includes(status)) {
          return jsonResponse({ error: "user_id and status must be provided" }, 400);
        }

        const { error: profileError } = await adminDbClient
          .from("profiles")
          .update({ status })
          .eq("user_id", user_id);
        throwIfError(profileError);

        const { error: authError } = await adminAuthClient.auth.admin.updateUserById(user_id, {
          ban_duration: status === "inactive" ? "876600h" : "none",
        });
        throwIfError(authError);

        return jsonResponse({ success: true });
      }

      case "get_activity": {
        if (!user_id) {
          return jsonResponse({ error: "user_id is required" }, 400);
        }

        const [docs, expenses, income, exports] = await Promise.all([
          adminDbClient
            .from("documents")
            .select("id, file_name, status, created_at, updated_at")
            .eq("user_id", user_id)
            .order("created_at", { ascending: false })
            .limit(10),
          adminDbClient
            .from("expense_records")
            .select("id, supplier_name, total_amount, currency, created_at")
            .eq("user_id", user_id)
            .order("created_at", { ascending: false })
            .limit(10),
          adminDbClient
            .from("income_records")
            .select("id, customer_name, total_amount, currency, created_at")
            .eq("user_id", user_id)
            .order("created_at", { ascending: false })
            .limit(10),
          adminDbClient
            .from("export_history")
            .select("id, export_name, format, row_count, created_at")
            .eq("user_id", user_id)
            .order("created_at", { ascending: false })
            .limit(10),
        ]);

        throwIfError(docs.error);
        throwIfError(expenses.error);
        throwIfError(income.error);
        throwIfError(exports.error);

        return jsonResponse({
          documents: docs.data || [],
          expenses: expenses.data || [],
          income: income.data || [],
          exports: exports.data || [],
        });
      }

      case "bulk_notify": {
        const { user_ids, title, body: notifyBody } = body;
        if (!user_ids?.length || !title || !notifyBody) {
          return jsonResponse({ error: "user_ids, title, and body are required" }, 400);
        }

        const notifications = user_ids.map((uid: string) => ({
          user_id: uid,
          type: "announcement",
          title,
          body: notifyBody,
        }));

        const { error } = await adminDbClient.from("notifications").insert(notifications);
        throwIfError(error);

        return jsonResponse({ success: true, sent: notifications.length });
      }

      case "revoke_firm": {
        if (!user_id) {
          return jsonResponse({ error: "user_id is required" }, 400);
        }

        const { data: firmOrgs, error: firmOrgsError } = await adminDbClient
          .from("organizations")
          .select("id")
          .eq("owner_user_id", user_id)
          .eq("workspace_type", "accounting_firm");
        throwIfError(firmOrgsError);

        const firmIds = (firmOrgs || []).map((org: { id: string }) => org.id);

        if (firmIds.length > 0) {
          const { data: teamMembers, error: teamMembersError } = await adminDbClient
            .from("team_members")
            .select("id")
            .in("firm_org_id", firmIds);
          throwIfError(teamMembersError);

          const teamMemberIds = (teamMembers || []).map((member: { id: string }) => member.id);

          if (teamMemberIds.length > 0) {
            const { error: accessDeleteError } = await adminDbClient
              .from("team_workspace_access")
              .delete()
              .in("team_member_id", teamMemberIds);
            throwIfError(accessDeleteError);
          }

          const { error: childUpdateError } = await adminDbClient
            .from("organizations")
            .update({ parent_org_id: null, workspace_type: "standard" })
            .in("parent_org_id", firmIds);
          throwIfError(childUpdateError);

          const { error: teamDeleteError } = await adminDbClient
            .from("team_members")
            .delete()
            .in("firm_org_id", firmIds);
          throwIfError(teamDeleteError);

          const { error: orgUpdateError } = await adminDbClient
            .from("organizations")
            .update({ workspace_type: "standard", max_client_workspaces: 1 })
            .in("id", firmIds);
          throwIfError(orgUpdateError);
        }

        const { error: auditError } = await adminDbClient.from("audit_logs").insert({
          user_id: caller.id,
          action: "admin_revoke_firm",
          entity_type: "user",
          entity_id: user_id,
          details: `Revoked firm access for user, downgraded ${firmIds.length} firm(s) to standard`,
        });
        throwIfError(auditError);

        return jsonResponse({ success: true });
      }

      case "delete_user": {
        if (!user_id) {
          return jsonResponse({ error: "user_id is required" }, 400);
        }

        const [{ data: ownedOrgs, error: ownedOrgsError }, { data: userTickets, error: userTicketsError }, { data: userTeamMemberships, error: userTeamMembershipsError }, { data: userWebhooks, error: userWebhooksError }] = await Promise.all([
          adminDbClient
            .from("organizations")
            .select("id, workspace_type")
            .eq("owner_user_id", user_id),
          adminDbClient
            .from("support_tickets")
            .select("id")
            .eq("user_id", user_id),
          adminDbClient
            .from("team_members")
            .select("id")
            .eq("user_id", user_id),
          adminDbClient
            .from("webhook_endpoints")
            .select("id")
            .eq("user_id", user_id),
        ]);

        throwIfError(ownedOrgsError);
        throwIfError(userTicketsError);
        throwIfError(userTeamMembershipsError);
        throwIfError(userWebhooksError);

        const ownedOrgIds = (ownedOrgs || []).map((org: { id: string }) => org.id);
        const firmIds = (ownedOrgs || [])
          .filter((org: { workspace_type: string }) => org.workspace_type === "accounting_firm")
          .map((org: { id: string }) => org.id);

        let childOrgIds: string[] = [];
        if (firmIds.length > 0) {
          const { data: childOrgs, error: childOrgsError } = await adminDbClient
            .from("organizations")
            .select("id")
            .in("parent_org_id", firmIds);
          throwIfError(childOrgsError);
          childOrgIds = (childOrgs || []).map((org: { id: string }) => org.id);
        }

        const allOrgIds = unique([...ownedOrgIds, ...childOrgIds]);
        const directUserTicketIds = (userTickets || []).map((ticket: { id: string }) => ticket.id);
        const directUserTeamMemberIds = (userTeamMemberships || []).map((membership: { id: string }) => membership.id);
        const directUserWebhookIds = (userWebhooks || []).map((webhook: { id: string }) => webhook.id);

        let orgDocumentIds: string[] = [];
        let orgRequestIds: string[] = [];
        let orgConversationIds: string[] = [];
        let orgWebhookIds: string[] = [];
        let orgTeamMemberIds: string[] = [];

        if (allOrgIds.length > 0) {
          const [documentsResult, requestsResult, conversationsResult, webhooksResult, teamMembersResult] = await Promise.all([
            adminDbClient.from("documents").select("id").in("organization_id", allOrgIds),
            adminDbClient.from("document_requests").select("id").in("workspace_id", allOrgIds),
            adminDbClient.from("chat_conversations").select("id").in("organization_id", allOrgIds),
            adminDbClient.from("webhook_endpoints").select("id").in("organization_id", allOrgIds),
            adminDbClient.from("team_members").select("id").in("firm_org_id", allOrgIds),
          ]);

          throwIfError(documentsResult.error);
          throwIfError(requestsResult.error);
          throwIfError(conversationsResult.error);
          throwIfError(webhooksResult.error);
          throwIfError(teamMembersResult.error);

          orgDocumentIds = (documentsResult.data || []).map((row: { id: string }) => row.id);
          orgRequestIds = (requestsResult.data || []).map((row: { id: string }) => row.id);
          orgConversationIds = (conversationsResult.data || []).map((row: { id: string }) => row.id);
          orgWebhookIds = (webhooksResult.data || []).map((row: { id: string }) => row.id);
          orgTeamMemberIds = (teamMembersResult.data || []).map((row: { id: string }) => row.id);

          const { error: clearActiveOrgError } = await adminDbClient
            .from("profiles")
            .update({ active_organization_id: null })
            .in("active_organization_id", allOrgIds);
          throwIfError(clearActiveOrgError);
        }

        const allTeamMemberIds = unique([...directUserTeamMemberIds, ...orgTeamMemberIds]);
        const allWebhookIds = unique([...directUserWebhookIds, ...orgWebhookIds]);

        if (allTeamMemberIds.length > 0) {
          const { error } = await adminDbClient
            .from("team_workspace_access")
            .delete()
            .in("team_member_id", allTeamMemberIds);
          throwIfError(error);
        }

        if (allOrgIds.length > 0) {
          const { error } = await adminDbClient
            .from("team_workspace_access")
            .delete()
            .in("workspace_id", allOrgIds);
          throwIfError(error);
        }

        if (orgRequestIds.length > 0) {
          const { error } = await adminDbClient
            .from("document_request_uploads")
            .delete()
            .in("request_id", orgRequestIds);
          throwIfError(error);
        }

        if (orgDocumentIds.length > 0) {
          const { error } = await adminDbClient
            .from("document_request_uploads")
            .delete()
            .in("document_id", orgDocumentIds);
          throwIfError(error);
        }

        if (allWebhookIds.length > 0) {
          const { error } = await adminDbClient
            .from("webhook_deliveries")
            .delete()
            .in("webhook_endpoint_id", allWebhookIds);
          throwIfError(error);
        }

        if (orgConversationIds.length > 0) {
          const { error } = await adminDbClient
            .from("chat_messages")
            .delete()
            .in("conversation_id", orgConversationIds);
          throwIfError(error);
        }

        if (directUserTicketIds.length > 0) {
          const { error } = await adminDbClient
            .from("ticket_messages")
            .delete()
            .in("ticket_id", directUserTicketIds);
          throwIfError(error);
        }

        if (firmIds.length > 0) {
          const { error } = await adminDbClient
            .from("client_invitations")
            .delete()
            .in("firm_org_id", firmIds);
          throwIfError(error);
        }

        if (allOrgIds.length > 0) {
          const { error } = await adminDbClient
            .from("client_invitations")
            .delete()
            .in("workspace_id", allOrgIds);
          throwIfError(error);
        }

        if (firmIds.length > 0) {
          const { error } = await adminDbClient
            .from("document_requests")
            .delete()
            .in("firm_org_id", firmIds);
          throwIfError(error);
        }

        if (allOrgIds.length > 0) {
          const { error } = await adminDbClient
            .from("document_requests")
            .delete()
            .in("workspace_id", allOrgIds);
          throwIfError(error);
        }

        if (allOrgIds.length > 0) {
          const [expenseDelete, incomeDelete, exportDelete, accountingDelete, rulesDelete, contactsDelete, categoriesDelete, apiKeysDelete, promoDelete] = await Promise.all([
            adminDbClient.from("expense_records").delete().in("organization_id", allOrgIds),
            adminDbClient.from("income_records").delete().in("organization_id", allOrgIds),
            adminDbClient.from("export_history").delete().in("organization_id", allOrgIds),
            adminDbClient.from("accounting_integrations").delete().in("organization_id", allOrgIds),
            adminDbClient.from("auto_category_rules").delete().in("organization_id", allOrgIds),
            adminDbClient.from("contacts").delete().in("organization_id", allOrgIds),
            adminDbClient.from("expense_categories").delete().in("organization_id", allOrgIds),
            adminDbClient.from("integration_api_keys").delete().in("organization_id", allOrgIds),
            adminDbClient.from("promo_code_redemptions").delete().in("organization_id", allOrgIds),
          ]);

          throwIfError(expenseDelete.error);
          throwIfError(incomeDelete.error);
          throwIfError(exportDelete.error);
          throwIfError(accountingDelete.error);
          throwIfError(rulesDelete.error);
          throwIfError(contactsDelete.error);
          throwIfError(categoriesDelete.error);
          throwIfError(apiKeysDelete.error);
          throwIfError(promoDelete.error);

          const { error: documentsDeleteError } = await adminDbClient
            .from("documents")
            .delete()
            .in("organization_id", allOrgIds);
          throwIfError(documentsDeleteError);

          const [emailImportsDelete, webhooksDelete, conversationsDelete] = await Promise.all([
            adminDbClient.from("email_imports").delete().in("organization_id", allOrgIds),
            adminDbClient.from("webhook_endpoints").delete().in("organization_id", allOrgIds),
            adminDbClient.from("chat_conversations").delete().in("organization_id", allOrgIds),
          ]);

          throwIfError(emailImportsDelete.error);
          throwIfError(webhooksDelete.error);
          throwIfError(conversationsDelete.error);
        }

        if (allTeamMemberIds.length > 0) {
          const { error } = await adminDbClient
            .from("team_members")
            .delete()
            .in("id", allTeamMemberIds);
          throwIfError(error);
        }

        if (childOrgIds.length > 0) {
          const { error } = await adminDbClient
            .from("organizations")
            .delete()
            .in("id", childOrgIds);
          throwIfError(error);
        }

        const remainingOwnedOrgIds = ownedOrgIds.filter((id) => !childOrgIds.includes(id));
        if (remainingOwnedOrgIds.length > 0) {
          const { error } = await adminDbClient
            .from("organizations")
            .delete()
            .in("id", remainingOwnedOrgIds);
          throwIfError(error);
        }

        const [directDocumentsDelete, directExpensesDelete, directIncomeDelete, directExportsDelete, directRolesDelete, directNotificationsDelete, directFeedbackDelete, directTicketsDelete, directProfileDelete, directAccountingDelete, directRulesDelete, directContactsDelete, directCategoriesDelete, directApiKeysDelete, directWebhooksDelete] = await Promise.all([
          adminDbClient.from("documents").delete().eq("user_id", user_id),
          adminDbClient.from("expense_records").delete().eq("user_id", user_id),
          adminDbClient.from("income_records").delete().eq("user_id", user_id),
          adminDbClient.from("export_history").delete().eq("user_id", user_id),
          adminDbClient.from("user_roles").delete().eq("user_id", user_id),
          adminDbClient.from("notifications").delete().eq("user_id", user_id),
          adminDbClient.from("user_feedback").delete().eq("user_id", user_id),
          adminDbClient.from("support_tickets").delete().eq("user_id", user_id),
          adminDbClient.from("profiles").delete().eq("user_id", user_id),
          adminDbClient.from("accounting_integrations").delete().eq("user_id", user_id),
          adminDbClient.from("auto_category_rules").delete().eq("user_id", user_id),
          adminDbClient.from("contacts").delete().eq("user_id", user_id),
          adminDbClient.from("expense_categories").delete().eq("user_id", user_id),
          adminDbClient.from("integration_api_keys").delete().eq("user_id", user_id),
          adminDbClient.from("webhook_endpoints").delete().eq("user_id", user_id),
        ]);

        throwIfError(directDocumentsDelete.error);
        throwIfError(directExpensesDelete.error);
        throwIfError(directIncomeDelete.error);
        throwIfError(directExportsDelete.error);
        throwIfError(directRolesDelete.error);
        throwIfError(directNotificationsDelete.error);
        throwIfError(directFeedbackDelete.error);
        throwIfError(directTicketsDelete.error);
        throwIfError(directProfileDelete.error);
        throwIfError(directAccountingDelete.error);
        throwIfError(directRulesDelete.error);
        throwIfError(directContactsDelete.error);
        throwIfError(directCategoriesDelete.error);
        throwIfError(directApiKeysDelete.error);
        throwIfError(directWebhooksDelete.error);

        const { error: deleteAuthError } = await adminAuthClient.auth.admin.deleteUser(user_id);
        throwIfError(deleteAuthError);

        const { error: auditError } = await adminDbClient.from("audit_logs").insert({
          user_id: caller.id,
          action: "admin_delete_user",
          entity_type: "user",
          entity_id: user_id,
          details: "Permanently deleted user account and associated data",
        });
        throwIfError(auditError);

        return jsonResponse({ success: true });
      }

      default:
        return jsonResponse({ error: "Unknown action" }, 400);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});