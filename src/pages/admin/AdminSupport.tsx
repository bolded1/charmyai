import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, MessageSquare, Clock, CheckCircle2, AlertCircle, Send } from "lucide-react";
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

export default function AdminSupportPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [reply, setReply] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Enrich with user email
      const enriched = await Promise.all(
        (data as any[]).map(async (ticket) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name, first_name")
            .eq("user_id", ticket.user_id)
            .maybeSingle();
          return {
            ...ticket,
            user_email: profile?.email || "Unknown",
            user_name: profile?.full_name || profile?.first_name || profile?.email || "Unknown",
          };
        })
      );
      return enriched;
    },
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTicket) return;
      const updates: any = { updated_at: new Date().toISOString() };
      if (reply.trim()) {
        updates.admin_reply = reply.trim();
        updates.replied_at = new Date().toISOString();
      }
      if (newStatus) updates.status = newStatus;

      const { error } = await supabase
        .from("support_tickets" as any)
        .update(updates)
        .eq("id", selectedTicket.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      setReply("");
      setNewStatus("");
      setSelectedTicket(null);
      toast.success("Ticket updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = tickets.filter((t: any) => {
    const matchesSearch =
      !search ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      t.user_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCount = tickets.filter((t: any) => t.status === "open").length;
  const inProgressCount = tickets.filter((t: any) => t.status === "in_progress").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold">{tickets.length}</p><p className="text-xs text-muted-foreground">Total Tickets</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-amber-600">{openCount}</p><p className="text-xs text-muted-foreground">Open</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{inProgressCount}</p><p className="text-xs text-muted-foreground">In Progress</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{tickets.filter((t: any) => t.status === "resolved").length}</p><p className="text-xs text-muted-foreground">Resolved</p></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tickets..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ticket list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm">No tickets found</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((ticket: any) => {
            const status = statusConfig[ticket.status] || statusConfig.open;
            const StatusIcon = status.icon;

            return (
              <Card
                key={ticket.id}
                className="cursor-pointer hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200"
                onClick={() => { setSelectedTicket(ticket); setNewStatus(ticket.status); setReply(ticket.admin_reply || ""); }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm font-semibold">{ticket.subject}</h3>
                        <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />{status.label}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] capitalize ${priorityColors[ticket.priority] || ""}`}>
                          {ticket.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {ticket.user_name} · {ticket.user_email} · {new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {ticket.admin_reply && <Badge variant="secondary" className="text-[10px] shrink-0">Replied</Badge>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reply dialog */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelectedTicket(null)}>
          <div className="bg-card rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold">{selectedTicket.subject}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    From: {selectedTicket.user_name} ({selectedTicket.user_email})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(selectedTicket.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant="outline" className={`capitalize ${priorityColors[selectedTicket.priority] || ""}`}>
                  {selectedTicket.priority}
                </Badge>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">User message</p>
                <p className="text-sm whitespace-pre-wrap bg-muted/50 rounded-lg p-3">{selectedTicket.message}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Reply</label>
                <Textarea
                  placeholder="Write your reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={4}
                  maxLength={5000}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedTicket(null)}>Cancel</Button>
                <Button
                  className="flex-1"
                  onClick={() => replyMutation.mutate()}
                  disabled={replyMutation.isPending}
                >
                  {replyMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Update Ticket
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
