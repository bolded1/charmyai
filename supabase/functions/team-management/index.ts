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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: authUser }, error: authError } = await userClient.auth.getUser();
    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = authUser.id;

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const body = await req.json();
    const { action } = body;

    // Get the user's firm org
    const { data: firmOrg } = await adminClient
      .from("organizations")
      .select("id, name, workspace_type")
      .eq("owner_user_id", userId)
      .eq("workspace_type", "accounting_firm")
      .maybeSingle();

    if (!firmOrg && action !== "get_my_membership") {
      return new Response(
        JSON.stringify({ error: "Only accounting firm owners can manage teams" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (action) {
      case "list_members": {
        const { data: members, error } = await adminClient
          .from("team_members")
          .select("*")
          .eq("firm_org_id", firmOrg!.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Get workspace access for each member
        const memberIds = (members || []).map((m: any) => m.id);
        const { data: accessData } = await adminClient
          .from("team_workspace_access")
          .select("team_member_id, workspace_id")
          .in("team_member_id", memberIds.length > 0 ? memberIds : ["00000000-0000-0000-0000-000000000000"]);

        // Get profiles for user_ids
        const userIds = (members || []).filter((m: any) => m.user_id).map((m: any) => m.user_id);
        const { data: profiles } = await adminClient
          .from("profiles")
          .select("user_id, full_name, first_name, last_name, avatar_url")
          .in("user_id", userIds.length > 0 ? userIds : ["00000000-0000-0000-0000-000000000000"]);

        const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        const accessMap = new Map<string, string[]>();
        (accessData || []).forEach((a: any) => {
          const list = accessMap.get(a.team_member_id) || [];
          list.push(a.workspace_id);
          accessMap.set(a.team_member_id, list);
        });

        const enrichedMembers = (members || []).map((m: any) => ({
          ...m,
          profile: profileMap.get(m.user_id) || null,
          workspace_ids: accessMap.get(m.id) || [],
        }));

        return new Response(JSON.stringify({ members: enrichedMembers }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "invite_member": {
        const { email, role, workspace_ids } = body;
        if (!email || !role) {
          return new Response(JSON.stringify({ error: "Email and role are required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Check if user already exists in auth
        const { data: existingUsers } = await adminClient.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(
          (u: any) => u.email?.toLowerCase() === email.toLowerCase()
        );

        const { data: member, error: insertError } = await adminClient
          .from("team_members")
          .insert({
            firm_org_id: firmOrg!.id,
            email: email.toLowerCase().trim(),
            role,
            status: existingUser ? "active" : "invited",
            user_id: existingUser?.id || null,
            invited_by: userId,
            accepted_at: existingUser ? new Date().toISOString() : null,
          })
          .select()
          .single();

        if (insertError) {
          if (insertError.code === "23505") {
            return new Response(JSON.stringify({ error: "This email is already on your team" }), {
              status: 409,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          throw insertError;
        }

        // Assign workspaces if provided
        if (workspace_ids && workspace_ids.length > 0 && member) {
          const accessRows = workspace_ids.map((wsId: string) => ({
            team_member_id: member.id,
            workspace_id: wsId,
          }));
          await adminClient.from("team_workspace_access").insert(accessRows);
        }

        // Log audit
        await adminClient.from("audit_logs").insert({
          user_id: userId,
          action: "team_member_invited",
          entity_type: "team_member",
          entity_id: member?.id,
          details: `Invited ${email} as ${role} to ${firmOrg!.name}`,
        });

        return new Response(JSON.stringify({ member }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_member": {
        const { member_id, role: newRole, workspace_ids: newWsIds } = body;
        if (!member_id) {
          return new Response(JSON.stringify({ error: "member_id required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        if (newRole) {
          await adminClient
            .from("team_members")
            .update({ role: newRole })
            .eq("id", member_id)
            .eq("firm_org_id", firmOrg!.id);
        }

        if (newWsIds !== undefined) {
          // Replace all workspace access
          await adminClient
            .from("team_workspace_access")
            .delete()
            .eq("team_member_id", member_id);

          if (newWsIds.length > 0) {
            const accessRows = newWsIds.map((wsId: string) => ({
              team_member_id: member_id,
              workspace_id: wsId,
            }));
            await adminClient.from("team_workspace_access").insert(accessRows);
          }
        }

        await adminClient.from("audit_logs").insert({
          user_id: userId,
          action: "team_member_updated",
          entity_type: "team_member",
          entity_id: member_id,
          details: `Updated team member role/access`,
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "remove_member": {
        const { member_id } = body;
        if (!member_id) {
          return new Response(JSON.stringify({ error: "member_id required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: removedMember } = await adminClient
          .from("team_members")
          .select("email")
          .eq("id", member_id)
          .eq("firm_org_id", firmOrg!.id)
          .single();

        await adminClient
          .from("team_members")
          .delete()
          .eq("id", member_id)
          .eq("firm_org_id", firmOrg!.id);

        await adminClient.from("audit_logs").insert({
          user_id: userId,
          action: "team_member_removed",
          entity_type: "team_member",
          entity_id: member_id,
          details: `Removed ${removedMember?.email || "member"} from team`,
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "suspend_member": {
        const { member_id } = body;
        await adminClient
          .from("team_members")
          .update({ status: "suspended" })
          .eq("id", member_id)
          .eq("firm_org_id", firmOrg!.id);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "activate_member": {
        const { member_id } = body;
        await adminClient
          .from("team_members")
          .update({ status: "active", accepted_at: new Date().toISOString() })
          .eq("id", member_id)
          .eq("firm_org_id", firmOrg!.id);

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
  } catch (err: any) {
    console.error("team-management error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
