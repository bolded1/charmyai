import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: "user" | "admin";
  body: string;
  attachments: { name: string; path: string; size: number }[];
  created_at: string;
}

export function useTicketMessages(ticketId: string | null) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["ticket-messages", ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const { data, error } = await supabase
        .from("ticket_messages" as any)
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data as any[]) as TicketMessage[];
    },
    enabled: !!ticketId && !!user,
  });

  // Realtime subscription for new messages
  useEffect(() => {
    if (!ticketId || !user) return;
    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ticket_messages", filter: `ticket_id=eq.${ticketId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["ticket-messages", ticketId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticketId, user, queryClient]);

  const sendMessage = useMutation({
    mutationFn: async ({ body, attachments, senderRole }: { body: string; attachments?: { name: string; path: string; size: number }[]; senderRole: "user" | "admin" }) => {
      if (!user || !ticketId) throw new Error("Missing context");
      const { error } = await supabase.from("ticket_messages" as any).insert({
        ticket_id: ticketId,
        sender_id: user.id,
        sender_role: senderRole,
        body: body.trim(),
        attachments: attachments || [],
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket-messages", ticketId] });
    },
  });

  return { messages: query.data ?? [], isLoading: query.isLoading, sendMessage };
}

export async function uploadTicketAttachment(ticketId: string, file: File) {
  const ext = file.name.split(".").pop();
  const path = `${ticketId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("ticket-attachments")
    .upload(path, file);
  if (error) throw error;
  return { name: file.name, path, size: file.size };
}

export async function getAttachmentUrl(path: string) {
  const { data } = await supabase.storage
    .from("ticket-attachments")
    .createSignedUrl(path, 3600);
  return data?.signedUrl || "";
}
