import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Organization {
  id: string;
  name: string;
  import_email_token: string;
  owner_user_id: string;
  logo_light: string | null;
  logo_dark: string | null;
  app_icon: string | null;
  primary_color: string | null;
  default_currency: string;
  created_at: string;
  updated_at: string;
}

export function useOrganization() {
  return useQuery({
    queryKey: ["organization"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
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
    mutationFn: async (updates: { id: string; name?: string; logo_light?: string | null; logo_dark?: string | null; app_icon?: string | null; primary_color?: string | null; default_currency?: string }) => {
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
