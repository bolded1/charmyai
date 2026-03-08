import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, MessageSquare, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  open: { label: "Open", icon: AlertCircle, color: "bg-amber-100 text-amber-700 border-amber-200" },
  in_progress: { label: "In Progress", icon: Clock, color: "bg-blue-100 text-blue-700 border-blue-200" },
  resolved: { label: "Resolved", icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  closed: { label: "Closed", icon: CheckCircle2, color: "bg-muted text-muted-foreground border-border" },
};

const priorityColors: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

export default function SupportPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("normal");
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Support</h1>
          <p className="text-sm text-muted-foreground">Submit and track your support requests.</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit a Support Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input
                  placeholder="Brief description of your issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={200}
                />
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
                <Textarea
                  placeholder="Describe your issue in detail..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  maxLength={2000}
                />
                <p className="text-xs text-muted-foreground text-right">{message.length}/2000</p>
              </div>
              <Button
                className="w-full"
                onClick={() => createTicket.mutate()}
                disabled={!subject.trim() || !message.trim() || createTicket.isPending}
              >
                {createTicket.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-2" />}
                Submit Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tickets list */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
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
            const isExpanded = expandedTicket === ticket.id;

            return (
              <Card
                key={ticket.id}
                className={`cursor-pointer transition-all duration-200 ${isExpanded ? "shadow-md" : "hover:shadow-sm hover:-translate-y-0.5"}`}
                onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-semibold truncate">{ticket.subject}</h3>
                        <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {status.label}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] capitalize ${priorityColors[ticket.priority] || ""}`}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {ticket.admin_reply && (
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        Replied
                      </Badge>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t border-border/50 pt-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Your message</p>
                        <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">{ticket.message}</p>
                      </div>
                      {ticket.admin_reply && (
                        <div>
                          <p className="text-xs font-medium text-primary mb-1">Admin reply</p>
                          <p className="text-sm whitespace-pre-wrap bg-primary/5 border border-primary/10 rounded-lg p-3">
                            {ticket.admin_reply}
                          </p>
                          {ticket.replied_at && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Replied {new Date(ticket.replied_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
