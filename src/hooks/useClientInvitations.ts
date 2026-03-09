import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClientInvitation {
  id: string;
  workspace_id: string;
  firm_org_id: string;
  invited_by: string;
  client_name: string;
  client_email: string;
  token: string;
  status: "pending" | "accepted" | "revoked" | "expired";
  expires_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useClientInvitations(workspaceId?: string) {
  return useQuery({
    queryKey: ["client_invitations", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("client-invitation", {
        body: { action: "list_invitations", workspace_id: workspaceId },
      });
      if (error) throw error;
      return (data?.invitations || []) as ClientInvitation[];
    },
    enabled: !!workspaceId || workspaceId === undefined,
  });
}

export function useSendClientInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { workspace_id: string; client_name: string; client_email: string }) => {
      const { data, error } = await supabase.functions.invoke("client-invitation", {
        body: { action: "send_invitation", ...params },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_invitations"] });
      toast.success("Client invitation sent");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useResendClientInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitation_id: string) => {
      const { data, error } = await supabase.functions.invoke("client-invitation", {
        body: { action: "resend_invitation", invitation_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_invitations"] });
      toast.success("Invitation resent");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRevokeClientInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitation_id: string) => {
      const { data, error } = await supabase.functions.invoke("client-invitation", {
        body: { action: "revoke_invitation", invitation_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_invitations"] });
      toast.success("Client access revoked");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useReinstateClientInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitation_id: string) => {
      const { data, error } = await supabase.functions.invoke("client-invitation", {
        body: { action: "reinstate_invitation", invitation_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_invitations"] });
      toast.success("Client access reinstated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
