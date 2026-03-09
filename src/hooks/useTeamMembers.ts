import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { toast } from "sonner";

export interface TeamMember {
  id: string;
  firm_org_id: string;
  user_id: string | null;
  email: string;
  role: "firm_owner" | "firm_admin" | "accountant" | "staff";
  status: string;
  invited_by: string;
  created_at: string;
  accepted_at: string | null;
  profile: {
    user_id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  } | null;
  workspace_ids: string[];
}

export function useTeamMembers() {
  const { isAccountingFirm } = useWorkspace();

  return useQuery({
    queryKey: ["team_members"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("team-management", {
        body: { action: "list_members" },
      });
      if (error) throw error;
      return (data?.members || []) as TeamMember[];
    },
    enabled: isAccountingFirm,
  });
}

export function useInviteTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { email: string; role: string; workspace_ids?: string[] }) => {
      const { data, error } = await supabase.functions.invoke("team-management", {
        body: { action: "invite_member", ...params },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Team member invited");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { member_id: string; role?: string; workspace_ids?: string[] }) => {
      const { data, error } = await supabase.functions.invoke("team-management", {
        body: { action: "update_member", ...params },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Team member updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (member_id: string) => {
      const { data, error } = await supabase.functions.invoke("team-management", {
        body: { action: "remove_member", member_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Team member removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useToggleTeamMemberStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ member_id, suspend }: { member_id: string; suspend: boolean }) => {
      const { data, error } = await supabase.functions.invoke("team-management", {
        body: { action: suspend ? "suspend_member" : "activate_member", member_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (_, { suspend }) => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success(suspend ? "Member suspended" : "Member activated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
