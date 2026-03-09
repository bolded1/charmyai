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
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action } = body;

    // Actions that don't require auth (token-based)
    if (action === "lookup_invitation") {
      const { token } = body;
      if (!token) {
        return new Response(JSON.stringify({ error: "Token required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: invitation, error } = await adminClient
        .from("client_invitations")
        .select("id, client_name, client_email, status, expires_at, workspace_id, firm_org_id")
        .eq("token", token)
        .maybeSingle();

      if (error || !invitation) {
        return new Response(JSON.stringify({ error: "Invitation not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get workspace and firm names
      const { data: workspace } = await adminClient
        .from("organizations")
        .select("name")
        .eq("id", invitation.workspace_id)
        .single();

      const { data: firm } = await adminClient
        .from("organizations")
        .select("name")
        .eq("id", invitation.firm_org_id)
        .single();

      // Get inviter name
      const { data: inviterProfile } = await adminClient
        .from("profiles")
        .select("first_name, last_name, full_name")
        .eq("user_id", (await adminClient
          .from("client_invitations")
          .select("invited_by")
          .eq("token", token)
          .single()).data?.invited_by || "")
        .maybeSingle();

      const inviterName = inviterProfile?.full_name ||
        [inviterProfile?.first_name, inviterProfile?.last_name].filter(Boolean).join(" ") ||
        "Your accountant";

      return new Response(JSON.stringify({
        invitation: {
          ...invitation,
          workspace_name: workspace?.name || "Unknown",
          firm_name: firm?.name || "Unknown",
          inviter_name: inviterName,
          is_expired: new Date(invitation.expires_at) < new Date(),
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "accept_invitation") {
      const { token, first_name, last_name, password } = body;
      if (!token || !first_name || !last_name || !password) {
        return new Response(JSON.stringify({ error: "All fields are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (password.length < 8) {
        return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get the invitation
      const { data: invitation, error: invError } = await adminClient
        .from("client_invitations")
        .select("*")
        .eq("token", token)
        .eq("status", "pending")
        .maybeSingle();

      if (invError || !invitation) {
        return new Response(JSON.stringify({ error: "Invalid or already used invitation" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (new Date(invitation.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "This invitation has expired. Please ask your accountant to resend it." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if user already exists
      const { data: existingUsers } = await adminClient.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(
        (u: any) => u.email?.toLowerCase() === invitation.client_email.toLowerCase()
      );

      let userId: string;

      if (existingUser) {
        // User already has an account - just link them
        userId = existingUser.id;
      } else {
        // Create new user account with auto-confirm
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email: invitation.client_email,
          password,
          email_confirm: true,
          user_metadata: {
            first_name,
            last_name,
          },
        });

        if (createError) {
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        userId = newUser.user.id;

        // Wait a moment for the trigger to create profile + org
        await new Promise((r) => setTimeout(r, 1000));

        // Update the profile with names
        await adminClient
          .from("profiles")
          .update({
            first_name,
            last_name,
            full_name: `${first_name} ${last_name}`,
            onboarding_completed_at: new Date().toISOString(),
            billing_setup_at: new Date().toISOString(),
          })
          .eq("user_id", userId);
      }

      // Create team member record with 'client' role
      const { data: existingMember } = await adminClient
        .from("team_members")
        .select("id")
        .eq("firm_org_id", invitation.firm_org_id)
        .eq("email", invitation.client_email.toLowerCase())
        .maybeSingle();

      let teamMemberId: string;

      if (existingMember) {
        teamMemberId = existingMember.id;
        await adminClient
          .from("team_members")
          .update({
            user_id: userId,
            status: "active",
            role: "client",
            accepted_at: new Date().toISOString(),
          })
          .eq("id", existingMember.id);
      } else {
        const { data: newMember } = await adminClient
          .from("team_members")
          .insert({
            firm_org_id: invitation.firm_org_id,
            email: invitation.client_email.toLowerCase(),
            role: "client",
            status: "active",
            user_id: userId,
            invited_by: invitation.invited_by,
            accepted_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        teamMemberId = newMember!.id;
      }

      // Grant workspace access
      const { data: existingAccess } = await adminClient
        .from("team_workspace_access")
        .select("id")
        .eq("team_member_id", teamMemberId)
        .eq("workspace_id", invitation.workspace_id)
        .maybeSingle();

      if (!existingAccess) {
        await adminClient
          .from("team_workspace_access")
          .insert({
            team_member_id: teamMemberId,
            workspace_id: invitation.workspace_id,
          });
      }

      // Set the client's active organization to the workspace
      await adminClient
        .from("profiles")
        .update({ active_organization_id: invitation.workspace_id })
        .eq("user_id", userId);

      // Mark invitation as accepted
      await adminClient
        .from("client_invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      // Audit log
      await adminClient.from("audit_logs").insert({
        user_id: userId,
        action: "client_invitation_accepted",
        entity_type: "client_invitation",
        entity_id: invitation.id,
        details: `Client ${invitation.client_email} accepted invitation for workspace`,
      });

      return new Response(JSON.stringify({ success: true, user_id: userId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticated actions require auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const tokenStr = authHeader.replace("Bearer ", "");
    const { data: { user: callerUser }, error: callerError } = await adminClient.auth.getUser(tokenStr);
    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = callerUser.id;

    // Get firm org
    const { data: firmOrg } = await adminClient
      .from("organizations")
      .select("id, name")
      .eq("owner_user_id", userId)
      .eq("workspace_type", "accounting_firm")
      .maybeSingle();

    // Also check if user is a firm_admin team member
    let firmOrgId = firmOrg?.id;
    let firmName = firmOrg?.name;
    if (!firmOrgId) {
      const { data: membership } = await adminClient
        .from("team_members")
        .select("firm_org_id")
        .eq("user_id", userId)
        .eq("status", "active")
        .in("role", ["firm_owner", "firm_admin"])
        .maybeSingle();
      if (membership) {
        firmOrgId = membership.firm_org_id;
        const { data: fOrg } = await adminClient
          .from("organizations")
          .select("name")
          .eq("id", firmOrgId)
          .single();
        firmName = fOrg?.name;
      }
    }

    if (!firmOrgId) {
      return new Response(JSON.stringify({ error: "Only accounting firms can manage client invitations" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    switch (action) {
      case "send_invitation": {
        const { workspace_id, client_name, client_email } = body;
        if (!workspace_id || !client_name || !client_email) {
          return new Response(JSON.stringify({ error: "Workspace ID, client name, and email are required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Verify workspace belongs to the firm
        const { data: ws } = await adminClient
          .from("organizations")
          .select("id, name, parent_org_id")
          .eq("id", workspace_id)
          .eq("parent_org_id", firmOrgId)
          .maybeSingle();

        if (!ws) {
          return new Response(JSON.stringify({ error: "Workspace not found or not part of your firm" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Update workspace contact info
        await adminClient
          .from("organizations")
          .update({
            client_contact_name: client_name,
            client_contact_email: client_email.toLowerCase(),
          })
          .eq("id", workspace_id);

        // Create or update invitation
        const { data: existing } = await adminClient
          .from("client_invitations")
          .select("id, status")
          .eq("workspace_id", workspace_id)
          .eq("client_email", client_email.toLowerCase())
          .maybeSingle();

        let invitation;
        if (existing) {
          const { data, error } = await adminClient
            .from("client_invitations")
            .update({
              client_name,
              status: "pending",
              token: crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, ""),
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              revoked_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id)
            .select()
            .single();
          if (error) throw error;
          invitation = data;
        } else {
          const { data, error } = await adminClient
            .from("client_invitations")
            .insert({
              workspace_id,
              firm_org_id: firmOrgId,
              invited_by: userId,
              client_name,
              client_email: client_email.toLowerCase(),
            })
            .select()
            .single();
          if (error) throw error;
          invitation = data;
        }

        // Send invitation email via Mailgun
        try {
          const mailgunKey = Deno.env.get("MAILGUN_API_KEY");
          const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN");

          if (mailgunKey && mailgunDomain) {
            const inviteUrl = `${req.headers.get("origin") || "https://charmyai.lovable.app"}/accept-invitation?token=${invitation.token}`;

            // Get inviter name
            const { data: inviterProfile } = await adminClient
              .from("profiles")
              .select("first_name, last_name, full_name")
              .eq("user_id", userId)
              .maybeSingle();

            const inviterName = inviterProfile?.full_name ||
              [inviterProfile?.first_name, inviterProfile?.last_name].filter(Boolean).join(" ") ||
              "Your accountant";

            const htmlBody = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #1E3A8A; margin: 0; font-size: 24px;">Charmy</h1>
                </div>
                <h2 style="color: #1a1a1a; margin-bottom: 8px;">You've been invited!</h2>
                <p style="color: #555; font-size: 15px; line-height: 1.6;">
                  <strong>${inviterName}</strong> from <strong>${firmName}</strong> has invited you to access your workspace <strong>"${ws.name}"</strong> on Charmy.
                </p>
                <p style="color: #555; font-size: 15px; line-height: 1.6;">
                  You'll be able to upload documents, view invoices, and track expenses for your company.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${inviteUrl}" style="background: #1E3A8A; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
                    Accept Invitation
                  </a>
                </div>
                <p style="color: #999; font-size: 13px;">
                  This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
                </p>
              </div>
            `;

            const formData = new FormData();
            formData.append("from", `Charmy <noreply@${mailgunDomain}>`);
            formData.append("to", client_email);
            formData.append("subject", `${inviterName} invited you to ${ws.name} on Charmy`);
            formData.append("html", htmlBody);

            await fetch(`https://api.eu.mailgun.net/v3/${mailgunDomain}/messages`, {
              method: "POST",
              headers: {
                Authorization: `Basic ${btoa(`api:${mailgunKey}`)}`,
              },
              body: formData,
            });
          }
        } catch (emailErr) {
          console.error("Failed to send invitation email:", emailErr);
          // Don't fail the whole operation if email fails
        }

        // Audit log
        await adminClient.from("audit_logs").insert({
          user_id: userId,
          action: "client_invitation_sent",
          entity_type: "client_invitation",
          entity_id: invitation.id,
          details: `Sent client invitation to ${client_email} for workspace "${ws.name}"`,
        });

        return new Response(JSON.stringify({ invitation }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "resend_invitation": {
        const { invitation_id } = body;
        if (!invitation_id) {
          return new Response(JSON.stringify({ error: "invitation_id required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: inv } = await adminClient
          .from("client_invitations")
          .select("*")
          .eq("id", invitation_id)
          .eq("firm_org_id", firmOrgId)
          .maybeSingle();

        if (!inv) {
          return new Response(JSON.stringify({ error: "Invitation not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Reset token and expiry
        const newToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
        await adminClient
          .from("client_invitations")
          .update({
            token: newToken,
            status: "pending",
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            revoked_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", invitation_id);

        // Re-send email (same as send logic)
        try {
          const mailgunKey = Deno.env.get("MAILGUN_API_KEY");
          const mailgunDomain = Deno.env.get("MAILGUN_DOMAIN");

          if (mailgunKey && mailgunDomain) {
            const { data: ws } = await adminClient
              .from("organizations")
              .select("name")
              .eq("id", inv.workspace_id)
              .single();

            const inviteUrl = `${req.headers.get("origin") || "https://charmyai.lovable.app"}/accept-invitation?token=${newToken}`;

            const { data: inviterProfile } = await adminClient
              .from("profiles")
              .select("first_name, last_name, full_name")
              .eq("user_id", userId)
              .maybeSingle();

            const inviterName = inviterProfile?.full_name ||
              [inviterProfile?.first_name, inviterProfile?.last_name].filter(Boolean).join(" ") ||
              "Your accountant";

            const htmlBody = `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #1E3A8A; margin: 0; font-size: 24px;">Charmy</h1>
                </div>
                <h2 style="color: #1a1a1a; margin-bottom: 8px;">Invitation Reminder</h2>
                <p style="color: #555; font-size: 15px; line-height: 1.6;">
                  <strong>${inviterName}</strong> from <strong>${firmName}</strong> has re-sent your invitation to access <strong>"${ws?.name}"</strong> on Charmy.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${inviteUrl}" style="background: #1E3A8A; color: white; padding: 12px 32px; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block;">
                    Accept Invitation
                  </a>
                </div>
                <p style="color: #999; font-size: 13px;">
                  This invitation expires in 7 days.
                </p>
              </div>
            `;

            const formData = new FormData();
            formData.append("from", `Charmy <noreply@${mailgunDomain}>`);
            formData.append("to", inv.client_email);
            formData.append("subject", `Reminder: ${inviterName} invited you to ${ws?.name} on Charmy`);
            formData.append("html", htmlBody);

            await fetch(`https://api.eu.mailgun.net/v3/${mailgunDomain}/messages`, {
              method: "POST",
              headers: {
                Authorization: `Basic ${btoa(`api:${mailgunKey}`)}`,
              },
              body: formData,
            });
          }
        } catch (emailErr) {
          console.error("Failed to resend invitation email:", emailErr);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "revoke_invitation": {
        const { invitation_id } = body;
        if (!invitation_id) {
          return new Response(JSON.stringify({ error: "invitation_id required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Get invitation details for cleanup
        const { data: inv } = await adminClient
          .from("client_invitations")
          .select("*, workspace_id, client_email")
          .eq("id", invitation_id)
          .eq("firm_org_id", firmOrgId)
          .maybeSingle();

        if (!inv) {
          return new Response(JSON.stringify({ error: "Invitation not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        await adminClient
          .from("client_invitations")
          .update({
            status: "revoked",
            revoked_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", invitation_id);

        // If the client had been accepted, also suspend their team member access
        if (inv.status === "accepted") {
          const { data: member } = await adminClient
            .from("team_members")
            .select("id")
            .eq("firm_org_id", firmOrgId)
            .eq("email", inv.client_email)
            .eq("role", "client")
            .maybeSingle();

          if (member) {
            await adminClient
              .from("team_members")
              .update({ status: "suspended" })
              .eq("id", member.id);
          }
        }

        await adminClient.from("audit_logs").insert({
          user_id: userId,
          action: "client_invitation_revoked",
          entity_type: "client_invitation",
          entity_id: invitation_id,
          details: `Revoked client access for ${inv.client_email}`,
        });

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "reinstate_invitation": {
        const { invitation_id } = body;
        if (!invitation_id) {
          return new Response(JSON.stringify({ error: "invitation_id required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: inv } = await adminClient
          .from("client_invitations")
          .select("*")
          .eq("id", invitation_id)
          .eq("firm_org_id", firmOrgId)
          .eq("status", "revoked")
          .maybeSingle();

        if (!inv) {
          return new Response(JSON.stringify({ error: "Revoked invitation not found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // If previously accepted, reinstate the team member
        const { data: member } = await adminClient
          .from("team_members")
          .select("id")
          .eq("firm_org_id", firmOrgId)
          .eq("email", inv.client_email)
          .eq("role", "client")
          .maybeSingle();

        if (member) {
          await adminClient
            .from("team_members")
            .update({ status: "active" })
            .eq("id", member.id);

          await adminClient
            .from("client_invitations")
            .update({
              status: "accepted",
              revoked_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", invitation_id);
        } else {
          // Re-send invitation
          const newToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
          await adminClient
            .from("client_invitations")
            .update({
              status: "pending",
              token: newToken,
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              revoked_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", invitation_id);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list_invitations": {
        const { workspace_id } = body;

        let query = adminClient
          .from("client_invitations")
          .select("*")
          .eq("firm_org_id", firmOrgId)
          .order("created_at", { ascending: false });

        if (workspace_id) {
          query = query.eq("workspace_id", workspace_id);
        }

        const { data, error } = await query;
        if (error) throw error;

        return new Response(JSON.stringify({ invitations: data || [] }), {
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
    console.error("client-invitation error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
