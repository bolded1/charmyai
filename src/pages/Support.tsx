import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, MessageSquare, Clock, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { TicketConversation } from "@/components/support/TicketConversation";

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  open: { label: "Open", icon: AlertCircle, color: "bg-warning-soft text-warning border-transparent" },
  in_progress: { label: "In Progress", icon: Clock, color: "bg-primary/10 text-primary border-primary/20" },
  resolved: { label: "Resolved", icon: CheckCircle2, color: "bg-success-soft text-success border-transparent" },
  closed: { label: "Closed", icon: CheckCircle2, color: "bg-muted text-muted-foreground border-border" },
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-primary/10 text-primary",
  high: "bg-warning-soft text-warning",
  urgent: "bg-danger-soft text-danger",
};

export default function SupportPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const createTicket = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("support_tickets" as any).insert({
        user_id: user.id,
        subject: subject.trim(),
        message: message.trim(),
        priority,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      setSubject("");
      setMessage("");
      setPriority("normal");
      setDialogOpen(false);
      toast.success("Support ticket submitted successfully");
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">Please log in to access support.</div>;
  }

  // Ticket detail / conversation view
  if (selectedTicket) {
    const status = statusConfig[selectedTicket.status] || statusConfig.open;
    const StatusIcon = status.icon;
    return (
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center gap-3 pb-4 border-b border-border shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedTicket(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold truncate">{selectedTicket.subject}</h2>
              <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                <StatusIcon className="h-3 w-3 mr-1" />{status.label}
              </Badge>
              <Badge variant="outline" className={`text-[10px] capitalize ${priorityColors[selectedTicket.priority] || ""}`}>
                {selectedTicket.priority}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Opened {new Date(selectedTicket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>

        {/* Original message */}
        <div className="px-4 py-3 bg-muted/30 border-b border-border text-sm shrink-0">
          <p className="text-[10px] font-medium text-muted-foreground mb-1">Original message</p>
          <p className="whitespace-pre-wrap text-sm">{selectedTicket.message}</p>
        </div>

        <div className="flex-1 min-h-0">
          <TicketConversation ticketId={selectedTicket.id} senderRole="user" ticketStatus={selectedTicket.status} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Support</h1>
          <p className="text-sm text-muted-foreground">Submit and track your support requests.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Submit a Support Ticket</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input placeholder="Brief description of your issue" value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea placeholder="Describe your issue in detail..." value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={2000} />
                <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
              </div>
              <Button className="w-full" onClick={() => createTicket.mutate()} disabled={!subject.trim() || !message.trim() || createTicket.isPending}>
                {createTicket.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                Submit Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : tickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm font-medium">No tickets yet</p>
            <p className="text-xs text-muted-foreground mt-1">Click "New Ticket" to submit a support request.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket: any) => {
            const status = statusConfig[ticket.status] || statusConfig.open;
            const StatusIcon = status.icon;
            return (
              <Card
                key={ticket.id}
                className="cursor-pointer transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5"
                onClick={() => setSelectedTicket(ticket)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-semibold truncate">{ticket.subject}</h3>
                        <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />{status.label}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] capitalize ${priorityColors[ticket.priority] || ""}`}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
