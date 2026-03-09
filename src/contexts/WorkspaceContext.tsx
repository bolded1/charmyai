import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { toast } from "sonner";

export interface Workspace {
  id: string;
  name: string;
  workspace_type: string;
  parent_org_id: string | null;
  owner_user_id: string;
  default_currency: string;
  primary_color: string | null;
  logo_light: string | null;
  logo_dark: string | null;
  app_icon: string | null;
  import_email_token: string;
  max_client_workspaces: number;
  trading_name: string | null;
  vat_number: string | null;
  tax_id: string | null;
  address: string | null;
  country: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  company_logo: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkspaceData {
  name: string;
  trading_name?: string;
  vat_number?: string;
  tax_id?: string;
  address?: string;
  country?: string;
  default_currency?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface UpdateWorkspaceData {
  name?: string;
  trading_name?: string | null;
  vat_number?: string | null;
  tax_id?: string | null;
  address?: string | null;
  country?: string | null;
  default_currency?: string;
  contact_email?: string | null;
  contact_phone?: string | null;
}

interface WorkspaceContextType {
  activeWorkspace: Workspace | null;
  allWorkspaces: Workspace[];
  isAccountingFirm: boolean;
  clientWorkspaces: Workspace[];
  isLoading: boolean;
  switchWorkspace: (orgId: string) => Promise<void>;
  createClientWorkspace: (data: CreateWorkspaceData) => Promise<Workspace>;
  deleteClientWorkspace: (orgId: string) => Promise<void>;
  updateClientWorkspace: (orgId: string, updates: UpdateWorkspaceData) => Promise<void>;
  archiveClientWorkspace: (orgId: string) => Promise<void>;
  unarchiveClientWorkspace: (orgId: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be inside WorkspaceProvider");
  return ctx;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { effectiveUserId } = useImpersonation();
  const queryClient = useQueryClient();

  // Use impersonated user if active, otherwise the real user
  const targetUserId = effectiveUserId || user?.id;

  // Fetch all workspaces the user has access to
  const { data: workspacesData, isLoading: wsLoading } = useQuery({
    queryKey: ["workspaces", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return [];
      // Get target user's own org(s) + child orgs of their accounting firm
      const { data: ownOrgs, error: e1 } = await supabase
        .from("organizations")
        .select("*")
        .eq("owner_user_id", targetUserId);
      if (e1) throw e1;

      // Find accounting firm org
      const firmOrg = (ownOrgs || []).find((o: any) => o.workspace_type === "accounting_firm");
      let clientOrgs: any[] = [];
      if (firmOrg) {
        const { data, error } = await supabase
          .from("organizations")
          .select("*")
          .eq("parent_org_id", firmOrg.id);
        if (!error && data) clientOrgs = data;
      }

      // Deduplicate: client orgs may already be in ownOrgs since owner_user_id matches
      const ownIds = new Set((ownOrgs || []).map((o: any) => o.id));
      const uniqueClientOrgs = clientOrgs.filter((o: any) => !ownIds.has(o.id));

      return [...(ownOrgs || []), ...uniqueClientOrgs] as Workspace[];
    },
    enabled: !!targetUserId,
  });

  // Get active workspace from profile
  const { data: activeOrgId, isLoading: profileLoading } = useQuery({
    queryKey: ["active-workspace-id", targetUserId],
    queryFn: async () => {
      if (!targetUserId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("active_organization_id")
        .eq("user_id", targetUserId)
        .maybeSingle();
      if (error) throw error;
      return data?.active_organization_id || null;
    },
    enabled: !!targetUserId,
  });

  const allWorkspaces = workspacesData || [];
  const activeWorkspace = allWorkspaces.find((w) => w.id === activeOrgId) || allWorkspaces[0] || null;
  
  // The user's "home" org (the one they own directly, non-client)
  const homeOrg = allWorkspaces.find(
    (w) => w.owner_user_id === targetUserId && w.workspace_type !== "client"
  );
  const isAccountingFirm = homeOrg?.workspace_type === "accounting_firm";
  const clientWorkspaces = allWorkspaces.filter((w) => w.workspace_type === "client" && !w.archived_at);

  const switchWorkspace = async (orgId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ active_organization_id: orgId })
      .eq("user_id", user.id);
    if (error) {
      toast.error("Failed to switch workspace");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["active-workspace-id"] });
    // Invalidate all workspace-scoped data
    queryClient.invalidateQueries({ queryKey: ["documents"] });
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    queryClient.invalidateQueries({ queryKey: ["income"] });
    queryClient.invalidateQueries({ queryKey: ["expense_categories"] });
    queryClient.invalidateQueries({ queryKey: ["export_history"] });
    queryClient.invalidateQueries({ queryKey: ["organization"] });
    queryClient.invalidateQueries({ queryKey: ["email-imports"] });
    toast.success(`Switched to ${allWorkspaces.find((w) => w.id === orgId)?.name || "workspace"}`);
  };

  const createClientWorkspace = async (data: CreateWorkspaceData): Promise<Workspace> => {
    if (!user || !homeOrg) throw new Error("Not authenticated");
    if (!isAccountingFirm) throw new Error("Only accounting firms can create client workspaces");
    if (clientWorkspaces.length >= (homeOrg.max_client_workspaces || 10)) {
      throw new Error(`Maximum of ${homeOrg.max_client_workspaces || 10} client workspaces reached`);
    }

    const { data: result, error } = await supabase
      .from("organizations")
      .insert({
        name: data.name,
        owner_user_id: user.id,
        workspace_type: "client",
        parent_org_id: homeOrg.id,
        trading_name: data.trading_name || null,
        vat_number: data.vat_number || null,
        tax_id: data.tax_id || null,
        address: data.address || null,
        country: data.country || "NL",
        default_currency: data.default_currency || "EUR",
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone || null,
      } as any)
      .select()
      .single();
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    return result as unknown as Workspace;
  };

  const deleteClientWorkspace = async (orgId: string) => {
    const ws = allWorkspaces.find((w) => w.id === orgId);
    if (!ws || ws.workspace_type !== "client") throw new Error("Can only delete client workspaces");
    
    const { error } = await supabase.from("organizations").delete().eq("id", orgId);
    if (error) throw error;
    
    if (activeWorkspace?.id === orgId && homeOrg) {
      await switchWorkspace(homeOrg.id);
    }
    queryClient.invalidateQueries({ queryKey: ["workspaces"] });
  };

  const updateClientWorkspace = async (orgId: string, updates: UpdateWorkspaceData) => {
    const { error } = await supabase
      .from("organizations")
      .update(updates as any)
      .eq("id", orgId);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["workspaces"] });
  };

  const archiveClientWorkspace = async (orgId: string) => {
    const { error } = await supabase
      .from("organizations")
      .update({ archived_at: new Date().toISOString() } as any)
      .eq("id", orgId);
    if (error) throw error;
    if (activeWorkspace?.id === orgId && homeOrg) {
      await switchWorkspace(homeOrg.id);
    }
    queryClient.invalidateQueries({ queryKey: ["workspaces"] });
  };

  const unarchiveClientWorkspace = async (orgId: string) => {
    const { error } = await supabase
      .from("organizations")
      .update({ archived_at: null } as any)
      .eq("id", orgId);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["workspaces"] });
  };

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspace,
        allWorkspaces,
        isAccountingFirm,
        clientWorkspaces,
        isLoading: wsLoading || profileLoading,
        switchWorkspace,
        createClientWorkspace,
        deleteClientWorkspace,
        updateClientWorkspace,
        archiveClientWorkspace,
        unarchiveClientWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
