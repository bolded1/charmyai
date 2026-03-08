import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type Msg = { role: "user" | "assistant"; content: string };

export function useChatConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Load conversation list
  useEffect(() => {
    if (!user) return;
    setLoadingConversations(true);
    supabase
      .from("chat_conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        setConversations(data || []);
        setLoadingConversations(false);
      });
  }, [user]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", activeId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setMessages((data as Msg[]) || []);
        setLoadingMessages(false);
      });
  }, [activeId]);

  const createConversation = useCallback(
    async (firstMessage: string): Promise<string | null> => {
      if (!user) return null;
      const title = firstMessage.slice(0, 60) || "New conversation";
      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({ user_id: user.id, title })
        .select("id")
        .single();
      if (error || !data) return null;
      setConversations((prev) => [
        { id: data.id, title, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ...prev,
      ]);
      setActiveId(data.id);
      return data.id;
    },
    [user]
  );

  const saveMessage = useCallback(
    async (conversationId: string, role: "user" | "assistant", content: string) => {
      await supabase.from("chat_messages").insert({ conversation_id: conversationId, role, content });
      // Update conversation timestamp & title if first user message
      await supabase
        .from("chat_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    },
    []
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      await supabase.from("chat_conversations").delete().eq("id", id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setActiveId(null);
        setMessages([]);
      }
    },
    [activeId]
  );

  const startNew = useCallback(() => {
    setActiveId(null);
    setMessages([]);
  }, []);

  return {
    conversations,
    activeId,
    setActiveId,
    messages,
    setMessages,
    loadingConversations,
    loadingMessages,
    createConversation,
    saveMessage,
    deleteConversation,
    startNew,
  };
}
