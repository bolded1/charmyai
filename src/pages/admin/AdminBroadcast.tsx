import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Megaphone, Send } from "lucide-react";
import { toast } from "sonner";

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [segment, setSegment] = useState("all");
  const [roleFilter, setRoleFilter] = useState("user");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number } | null>(null);

  const segmentLabel = () => {
    if (segment === "all") return "All Users";
    if (segment === "active") return "Active Users";
    if (segment === "inactive") return "Inactive Users";
    if (segment === "role") return `Role: ${roleFilter.replace("_", " ")}`;
    return "All Users";
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setSending(true);
    setLastResult(null);
    try {
      const res = await supabase.functions.invoke("admin-broadcast", {
        body: {
          title: title.trim(),
          body: body.trim(),
          link: link.trim() || undefined,
          segment,
          role_filter: segment === "role" ? roleFilter : undefined,
        },
      });
      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Failed to send broadcast");
      }
      setLastResult({ sent: res.data.sent });
      toast.success(`Broadcast sent to ${res.data.sent} user(s)`);
      setTitle("");
      setBody("");
      setLink("");
    } catch (err: any) {
      toast.error(err.message || "Failed to send broadcast");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Broadcast Notification
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Send an announcement to all users or a filtered segment. Each user will receive it as an in-app notification.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Segment Selection */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Audience</Label>
            <div className="flex gap-3">
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
                  <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="platform_admin">Platform Admin</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <Badge variant="secondary" className="text-xs">{segmentLabel()}</Badge>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Title *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scheduled maintenance tonight"
              maxLength={100}
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Message *</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your announcement message..."
              rows={4}
              maxLength={500}
            />
            <p className="text-[10px] text-muted-foreground text-right">{body.length}/500</p>
          </div>

          {/* Link (optional) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Link (optional)</Label>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="e.g. /app/documents or https://..."
            />
            <p className="text-[10px] text-muted-foreground">Users can click the notification to navigate here</p>
          </div>

          {/* Send Button */}
          <Button
            className="w-full"
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
          >
            {sending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
            ) : (
              <><Send className="h-4 w-4 mr-2" /> Send Broadcast</>
            )}
          </Button>

          {lastResult && (
            <div className="text-center py-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-sm font-medium text-primary">
                ✓ Sent to {lastResult.sent} user(s)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
