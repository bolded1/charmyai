import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Organization {
  id: string;
  name: string;
  trading_name: string | null;
  import_email_token: string;
  owner_user_id: string;
  logo_light: string | null;
  logo_dark: string | null;
  app_icon: string | null;
  primary_color: string | null;
  default_currency: string;
  workspace_type: string;
  parent_org_id: string | null;
  max_client_workspaces: number;
  country: string | null;
  address: string | null;
  vat_number: string | null;
  tax_id: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Returns the user's active workspace organization.
 * Uses the active_organization_id from the profile.
 */
export function useOrganization() {
  return useQuery({
    queryKey: ["organization"],
    queryFn: async () => {
      // First get the user's active_organization_id from their profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.active_organization_id) {
        const { data, error } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", profile.active_organization_id)
          .maybeSingle();
        if (error) throw error;
        return data as Organization | null;
      }

      // Fallback: get user's own org
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("owner_user_id", user.id)
        .neq("workspace_type", "client")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Organization | null;
    },
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("organizations")
        .insert({ name, owner_user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data as Organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      toast.success("Organization created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; name?: string; trading_name?: string; logo_light?: string | null; logo_dark?: string | null; app_icon?: string | null; primary_color?: string | null; default_currency?: string; workspace_type?: string; max_client_workspaces?: number; country?: string; address?: string; vat_number?: string; tax_id?: string; contact_email?: string; contact_phone?: string }) => {
      const { id, ...fields } = updates;
      const { data, error } = await supabase
        .from("organizations")
        .update(fields)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Organization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      window.dispatchEvent(new Event("brand-logo-changed"));
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useEmailImports() {
  return useQuery({
    queryKey: ["email-imports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_imports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });
}

export function getImportEmailAddress(token: string): string {
  return `${token}@imports.charmy.net`;
}
