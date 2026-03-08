import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, MessageSquare, Clock, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { TicketConversation } from "@/components/support/TicketConversation";

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
  const [newStatus, setNewStatus] = useState("");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
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

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("support_tickets" as any)
        .update({ status, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      toast.success("Status updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filtered = tickets.filter((t: any) => {
    const matchesSearch = !search ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.user_email?.toLowerCase().includes(search.toLowerCase()) ||
      t.user_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCount = tickets.filter((t: any) => t.status === "open").length;
  const inProgressCount = tickets.filter((t: any) => t.status === "in_progress").length;

  // Detail view with conversation
  if (selectedTicket) {
    const status = statusConfig[selectedTicket.status] || statusConfig.open;
    const StatusIcon = status.icon;
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-border shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedTicket(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold truncate">{selectedTicket.subject}</h2>
              <Badge variant="outline" className={`text-[10px] capitalize ${priorityColors[selectedTicket.priority] || ""}`}>
                {selectedTicket.priority}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              From: {selectedTicket.user_name} ({selectedTicket.user_email}) · {new Date(selectedTicket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Select
              value={newStatus || selectedTicket.status}
              onValueChange={(val) => {
                setNewStatus(val);
                updateStatus.mutate({ id: selectedTicket.id, status: val });
                setSelectedTicket({ ...selectedTicket, status: val });
              }}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Original message */}
        <div className="px-4 py-3 bg-muted/30 border-b border-border text-sm shrink-0">
          <p className="text-[10px] font-medium text-muted-foreground mb-1">Original message from user</p>
          <p className="whitespace-pre-wrap text-sm">{selectedTicket.message}</p>
        </div>

        <div className="flex-1 min-h-0">
          <TicketConversation ticketId={selectedTicket.id} senderRole="admin" ticketStatus={selectedTicket.status} />
        </div>
      </div>
    );
  }

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
                onClick={() => { setSelectedTicket(ticket); setNewStatus(ticket.status); }}
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
