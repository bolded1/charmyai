import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DocumentRequest {
  id: string;
  firm_org_id: string;
  workspace_id: string;
  created_by: string;
  token: string;
  title: string;
  description: string | null;
  status: "active" | "closed";
  expires_at: string | null;
  upload_count: number;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface DocumentRequestUpload {
  id: string;
  request_id: string;
  document_id: string;
  uploader_name: string | null;
  uploader_email: string | null;
  created_at: string;
}

export function useDocumentRequests(firmOrgId?: string) {
  return useQuery({
    queryKey: ["document_requests", firmOrgId],
    enabled: !!firmOrgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_requests")
        .select("*")
        .eq("firm_org_id", firmOrgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DocumentRequest[];
    },
  });
}

export function useRequestUploads(requestId?: string) {
  return useQuery({
    queryKey: ["document_request_uploads", requestId],
    enabled: !!requestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_request_uploads")
        .select("*")
        .eq("request_id", requestId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DocumentRequestUpload[];
    },
  });
}

export function useCreateDocumentRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      firm_org_id: string;
      workspace_id: string;
      title: string;
      description?: string;
      expires_at?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("document_requests")
        .insert({ ...payload, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as DocumentRequest;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["document_requests", data.firm_org_id] });
      toast.success("Document request created");
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Failed to create request");
    },
  });
}

export function useCloseDocumentRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reopen }: { id: string; reopen?: boolean }) => {
      const { data, error } = await supabase
        .from("document_requests")
        .update({
          status: reopen ? "active" : "closed",
          closed_at: reopen ? null : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as DocumentRequest;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["document_requests", data.firm_org_id] });
      toast.success(data.status === "closed" ? "Request closed" : "Request reopened");
    },
    onError: (err: any) => {
      toast.error(err.message ?? "Failed to update request");
    },
  });
}
