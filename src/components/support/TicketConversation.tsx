import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip, X, FileText, Download, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTicketMessages, uploadTicketAttachment, getAttachmentUrl, type TicketMessage } from "@/hooks/useTicketMessages";
import { toast } from "sonner";

interface TicketConversationProps {
  ticketId: string;
  senderRole: "user" | "admin";
  ticketStatus?: string;
}

export function TicketConversation({ ticketId, senderRole, ticketStatus }: TicketConversationProps) {
  const { messages, isLoading, sendMessage } = useTicketMessages(ticketId);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!body.trim() && files.length === 0) return;
    setSending(true);
    try {
      const attachments = await Promise.all(
        files.map((f) => uploadTicketAttachment(ticketId, f))
      );
      await sendMessage.mutateAsync({ body: body.trim() || "(attachment)", attachments, senderRole });
      setBody("");
      setFiles([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const valid = selected.filter((f) => f.size <= 10 * 1024 * 1024);
    if (valid.length < selected.length) toast.error("Some files exceed the 10MB limit");
    setFiles((prev) => [...prev, ...valid].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = async (att: { name: string; path: string }) => {
    const url = await getAttachmentUrl(att.path);
    if (url) window.open(url, "_blank");
  };

  const isClosed = ticketStatus === "closed";

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Start the conversation below.</p>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} isOwn={msg.sender_role === senderRole} onDownload={handleDownload} />
          ))
        )}
      </div>

      {/* Input */}
      {!isClosed && (
        <div className="border-t border-border p-3 space-y-2">
          {files.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <Badge key={i} variant="secondary" className="gap-1 pr-1">
                  <FileText className="h-3 w-3" />
                  <span className="text-xs truncate max-w-[120px]">{f.name}</span>
                  <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2 items-end">
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileChange} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.csv,.txt" />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Textarea
              placeholder="Type a message..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={1}
              className="min-h-[36px] max-h-[120px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
            />
            <Button
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={handleSend}
              disabled={sending || (!body.trim() && files.length === 0)}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ msg, isOwn, onDownload }: { msg: TicketMessage; isOwn: boolean; onDownload: (att: { name: string; path: string }) => void }) {
  const attachments = (msg.attachments || []) as { name: string; path: string; size: number }[];

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 space-y-1.5 ${
        isOwn
          ? "bg-primary text-primary-foreground rounded-br-md"
          : "bg-muted rounded-bl-md"
      }`}>
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[10px] font-medium ${isOwn ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
            {msg.sender_role === "admin" ? "Support" : "You"}
          </span>
          <span className={`text-[10px] ${isOwn ? "text-primary-foreground/50" : "text-muted-foreground/60"}`}>
            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
          </span>
        </div>
        {msg.body && msg.body !== "(attachment)" && (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.body}</p>
        )}
        {attachments.length > 0 && (
          <div className="space-y-1 pt-1">
            {attachments.map((att, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); onDownload(att); }}
                className={`flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 transition-colors w-full ${
                  isOwn
                    ? "bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground"
                    : "bg-background hover:bg-accent text-foreground"
                }`}
              >
                <Download className="h-3 w-3 shrink-0" />
                <span className="truncate">{att.name}</span>
                <span className="text-[10px] opacity-60 shrink-0">{(att.size / 1024).toFixed(0)}KB</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
