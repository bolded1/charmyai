import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, Megaphone, Send, Clock, Users, Calendar, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface BroadcastRecord {
  id: string;
  title: string;
  body: string;
  link: string | null;
  segment: string;
  role_filter: string | null;
  sent_count: number;
  created_at: string;
  scheduled_at: string | null;
  status: string;
}

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [segment, setSegment] = useState("all");
  const [roleFilter, setRoleFilter] = useState("user");
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<BroadcastRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const segmentLabel = (seg?: string, role?: string | null) => {
    const s = seg || segment;
    const r = role !== undefined ? role : roleFilter;
    if (s === "all") return "All Users";
    if (s === "active") return "Active Users";
    if (s === "inactive") return "Inactive Users";
    if (s === "role") return `Role: ${(r || "user").replace("_", " ")}`;
    return "All Users";
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("broadcast_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setHistory((data as BroadcastRecord[]) || []);
    } catch {
      toast.error("Failed to load broadcast history");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message are required");
      return;
    }

    let scheduled_at: string | undefined;
    if (isScheduled) {
      if (!scheduledDate || !scheduledTime) {
        toast.error("Please select a date and time for scheduling");
        return;
      }
      scheduled_at = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      if (new Date(scheduled_at) <= new Date()) {
        toast.error("Scheduled time must be in the future");
        return;
      }
    }

    setSending(true);
    try {
      const res = await supabase.functions.invoke("admin-broadcast", {
        body: {
          title: title.trim(),
          body: body.trim(),
          link: link.trim() || undefined,
          segment,
          role_filter: segment === "role" ? roleFilter : undefined,
          scheduled_at,
        },
      });
      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Failed");
      }
      if (res.data.scheduled) {
        toast.success(`Broadcast scheduled for ${new Date(scheduled_at!).toLocaleString()}`);
      } else {
        toast.success(`Broadcast sent to ${res.data.sent} user(s)`);
      }
      setTitle(""); setBody(""); setLink("");
      setIsScheduled(false); setScheduledDate(""); setScheduledTime("");
      fetchHistory();
    } catch (err: any) {
      toast.error(err.message || "Failed to send broadcast");
    } finally {
      setSending(false);
    }
  };

  const cancelScheduled = async (id: string) => {
    const { error } = await supabase.from("broadcast_history").delete().eq("id", id);
    if (error) {
      toast.error("Failed to cancel");
      return;
    }
    setHistory((prev) => prev.filter((h) => h.id !== id));
    toast.success("Scheduled broadcast cancelled");
  };

  const statusBadge = (status: string) => {
    if (status === "sent") return <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary">Sent</Badge>;
    if (status === "scheduled") return <Badge variant="secondary" className="text-[10px] bg-accent text-accent-foreground">Scheduled</Badge>;
    if (status === "failed") return <Badge variant="destructive" className="text-[10px]">Failed</Badge>;
    return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Send Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Megaphone className="h-4 w-4" /> New Broadcast
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium">Audience</Label>
                <div className="flex gap-2">
                  <Select value={segment} onValueChange={setSegment}>
                    <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="active">Active Users</SelectItem>
                      <SelectItem value="inactive">Inactive Users</SelectItem>
                      <SelectItem value="role">By Role</SelectItem>
                    </SelectContent>
                  </Select>
                  {segment === "role" && (
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="platform_admin">Platform Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Scheduled maintenance" maxLength={100} />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Message *</Label>
                <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Write your announcement..." rows={3} maxLength={500} />
                <p className="text-[10px] text-muted-foreground text-right">{body.length}/500</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Link (optional)</Label>
                <Input value={link} onChange={e => setLink(e.target.value)} placeholder="/app/documents" />
              </div>

              {/* Schedule toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium">Schedule for later</p>
                    <p className="text-[10px] text-muted-foreground">Queue instead of sending now</p>
                  </div>
                </div>
                <Switch checked={isScheduled} onCheckedChange={setIsScheduled} />
              </div>

              {isScheduled && (
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px]">Date</Label>
                    <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px]">Time</Label>
                    <Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} />
                  </div>
                </div>
              )}

              <Button className="w-full" onClick={handleSend} disabled={sending || !title.trim() || !body.trim()}>
                {sending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {isScheduled ? "Scheduling..." : "Sending..."}</>
                ) : isScheduled ? (
                  <><Calendar className="h-4 w-4 mr-2" /> Schedule Broadcast</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" /> Send Now</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" /> Broadcast History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No broadcasts yet</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {history.map((item) => (
                    <div key={item.id} className={`p-3 rounded-lg border space-y-1.5 ${item.status === "scheduled" ? "border-accent bg-accent/5" : "border-border bg-muted/20"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {statusBadge(item.status)}
                          <p className="text-sm font-medium">{item.title}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {item.status === "scheduled" && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => cancelScheduled(item.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {item.status === "scheduled" && item.scheduled_at
                              ? `Scheduled: ${new Date(item.scheduled_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                              : new Date(item.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{item.body}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.status === "sent" && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Users className="h-2.5 w-2.5" /> {item.sent_count} delivered
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {segmentLabel(item.segment, item.role_filter)}
                        </Badge>
                        {item.link && (
                          <Badge variant="outline" className="text-[10px] font-mono">{item.link}</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
