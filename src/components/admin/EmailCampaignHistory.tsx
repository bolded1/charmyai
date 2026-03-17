import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { format } from "date-fns";

interface Campaign {
  id: string;
  subject: string;
  segment: string;
  role_filter: string | null;
  status: string;
  recipient_count: number;
  sent_count: number;
  error_count: number;
  errors: string[];
  sent_at: string;
  html_body: string;
}

export default function EmailCampaignHistory() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState("");

  useEffect(() => {
    const fetchCampaigns = async () => {
      const { data, error } = await supabase
        .from("email_campaigns")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error) setCampaigns((data as Campaign[]) || []);
      setLoading(false);
    };
    fetchCampaigns();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-base">Campaign History</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No campaigns sent yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Campaign History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {campaigns.map((c) => (
          <div key={c.id} className="border border-border rounded-lg overflow-hidden">
            <div
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{c.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(c.sent_at), "MMM d, yyyy HH:mm")}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={c.status === "sent" ? "default" : "destructive"} className="text-xs">
                  {c.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {c.sent_count}/{c.recipient_count}
                </span>
                {expandedId === c.id ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
            {expandedId === c.id && (
              <div className="px-3 pb-3 border-t border-border pt-3 space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Segment</p>
                    <p className="font-medium">{c.segment}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Role Filter</p>
                    <p className="font-medium">{c.role_filter || "None"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Delivered</p>
                    <p className="font-medium text-success">{c.sent_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Errors</p>
                    <p className="font-medium text-destructive">{c.error_count}</p>
                  </div>
                </div>
                {c.errors && c.errors.length > 0 && (
                  <div className="text-xs text-destructive bg-destructive/10 rounded p-2">
                    {(c.errors as string[]).map((e, i) => <p key={i}>{e}</p>)}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewHtml(c.html_body)}
                >
                  <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                </Button>
              </div>
            )}
          </div>
        ))}

        {/* Preview modal */}
        {previewHtml && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setPreviewHtml("")}>
            <div className="bg-background rounded-xl shadow-xl max-w-[680px] w-full max-h-[80vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b">
                <span className="font-semibold text-sm">Email Preview</span>
                <Button variant="ghost" size="sm" onClick={() => setPreviewHtml("")}>Close</Button>
              </div>
              <iframe
                srcDoc={previewHtml}
                className="w-full h-[60vh] border-0"
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
