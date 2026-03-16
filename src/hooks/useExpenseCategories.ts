import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export interface ExpenseCategory {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  monthly_budget: number | null;
  organization_id: string | null;
  created_at: string;
}

export function useExpenseCategories() {
  const { activeWorkspace } = useWorkspace();
  const orgId = activeWorkspace?.id;

  return useQuery({
    queryKey: ["expense_categories", orgId],
    queryFn: async () => {
      let query = supabase
        .from("expense_categories")
        .select("*")
        .order("name", { ascending: true });

      if (orgId) {
        query = query.eq("organization_id", orgId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ExpenseCategory[];
    },
  });
}

export function useCreateExpenseCategory() {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();

  return useMutation({
    mutationFn: async ({ name, color }: { name: string; color?: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("expense_categories")
        .insert({
          user_id: user.id,
          name: name.trim(),
          color: color ?? null,
          organization_id: activeWorkspace?.id || null,
        })
        .select()
        .single();
      if (error) {
        if (error.code === "23505") throw new Error("Category already exists");
        throw error;
      }
      return data as ExpenseCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense_categories"] });
      toast.success("Category created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateExpenseCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      name,
      color,
      monthly_budget,
    }: {
      id: string;
      name?: string;
      color?: string | null;
      monthly_budget?: number | null;
    }) => {
      // Fetch old name so we can cascade-rename existing records
      const { data: old } = await supabase
        .from("expense_categories")
        .select("name")
        .eq("id", id)
        .single();
      const oldName = old?.name;

      // Build update payload — only include fields that were passed
      const patch: Record<string, unknown> = {};
      if (name !== undefined) patch.name = name.trim();
      if (color !== undefined) patch.color = color;
      if (monthly_budget !== undefined) patch.monthly_budget = monthly_budget;

      const { data, error } = await supabase
        .from("expense_categories")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) {
        if (error.code === "23505") throw new Error("Category already exists");
        throw error;
      }

      // Cascade rename: update all expense + income records that stored the old category name
      if (name && oldName && name.trim() !== oldName) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await Promise.all([
            supabase
              .from("expense_records")
              .update({ category: name.trim() })
              .eq("category", oldName)
              .eq("user_id", user.id),
            supabase
              .from("income_records")
              .update({ category: name.trim() })
              .eq("category", oldName)
              .eq("user_id", user.id),
          ]);
        }
      }

      return data as ExpenseCategory;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense_categories"] });
      queryClient.invalidateQueries({ queryKey: ["expense-records-for-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["income"] });
      toast.success("Category updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteExpenseCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("expense_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expense_categories"] });
      toast.success("Category deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
