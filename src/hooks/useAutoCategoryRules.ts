import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export interface AutoCategoryRule {
  id: string;
  user_id: string;
  match_field: string;
  match_type: string;
  match_value: string;
  category: string;
  organization_id: string | null;
  created_at: string;
}

export function useAutoCategoryRules() {
  const { activeWorkspace } = useWorkspace();
  const orgId = activeWorkspace?.id;

  return useQuery({
    queryKey: ["auto_category_rules", orgId],
    queryFn: async () => {
      let query = supabase
        .from("auto_category_rules")
        .select("*")
        .order("created_at", { ascending: false });

      if (orgId) {
        query = query.eq("organization_id", orgId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AutoCategoryRule[];
    },
  });
}

export function useCreateAutoCategoryRule() {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();

  return useMutation({
    mutationFn: async (rule: { match_field: string; match_type: string; match_value: string; category: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("auto_category_rules")
        .insert({
          user_id: user.id,
          organization_id: activeWorkspace?.id || null,
          ...rule,
        })
        .select()
        .single();
      if (error) throw error;
      return data as AutoCategoryRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto_category_rules"] });
      toast.success("Rule created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateAutoCategoryRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<AutoCategoryRule> }) => {
      const { data, error } = await supabase
        .from("auto_category_rules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto_category_rules"] });
      toast.success("Rule updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteAutoCategoryRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("auto_category_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto_category_rules"] });
      toast.success("Rule deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
