import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

interface DailyStats {
  date: string;
  uploads: number;
  processed: number;
  failed: number;
}

export default function AdminUsagePage() {
  const [loading, setLoading] = useState(true);
  const [totalDocs, setTotalDocs] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const [totalFailed, setTotalFailed] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [dailyData, setDailyData] = useState<DailyStats[]>([]);
  const [orgUsage, setOrgUsage] = useState<{ name: string; count: number }[]>([]);

  const fetchUsage = async () => {
    setLoading(true);
    try {
      // Total docs count
      const { count: docCount } = await supabase.from("documents").select("id", { count: "exact", head: true });
      setTotalDocs(docCount || 0);

      // Processed
      const { count: processedCount } = await supabase.from("documents").select("id", { count: "exact", head: true }).in("status", ["processed", "approved"]);
      setTotalProcessed(processedCount || 0);

      // Failed
      const { count: failedCount } = await supabase.from("documents").select("id", { count: "exact", head: true }).eq("status", "failed");
      setTotalFailed(failedCount || 0);

      // Total users
      const { count: userCount } = await supabase.from("profiles").select("id", { count: "exact", head: true });
      setTotalUsers(userCount || 0);

      // Daily data for last 14 days
      const { data: docs } = await supabase
        .from("documents")
        .select("created_at, status")
        .gte("created_at", new Date(Date.now() - 14 * 86400000).toISOString())
        .order("created_at", { ascending: true });

      const dayMap = new Map<string, { uploads: number; processed: number; failed: number }>();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400000);
        const key = d.toISOString().slice(5, 10); // MM-DD
        dayMap.set(key, { uploads: 0, processed: 0, failed: 0 });
      }
      (docs || []).forEach((doc) => {
        const key = doc.created_at.slice(5, 10);
        const entry = dayMap.get(key);
        if (entry) {
          entry.uploads++;
          if (doc.status === "processed" || doc.status === "approved") entry.processed++;
          if (doc.status === "failed") entry.failed++;
        }
      });
      setDailyData(Array.from(dayMap.entries()).map(([date, vals]) => ({ date, ...vals })));

      // Per-org usage
      const { data: orgs } = await supabase.from("organizations").select("id, name, owner_user_id");
      const orgCounts = await Promise.all(
        (orgs || []).map(async (org) => {
          const { count } = await supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", org.owner_user_id);
          return { name: org.name, count: count || 0 };
        })
      );
      setOrgUsage(orgCounts.sort((a, b) => b.count - a.count));
    } catch (err: any) {
      toast.error("Failed to load usage data: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsage(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const successRate = totalDocs > 0 ? Math.round((totalProcessed / totalDocs) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={fetchUsage}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { label: "Total Uploads", value: totalDocs.toLocaleString() },
          { label: "Processed", value: totalProcessed.toLocaleString() },
          { label: "Failed", value: totalFailed.toLocaleString() },
          { label: "Total Users", value: totalUsers.toLocaleString() },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Daily Uploads (Last 14 Days)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="uploads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Uploads" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Processing Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Line type="monotone" dataKey="processed" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Processed" />
                  <Line type="monotone" dataKey="failed" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} name="Failed" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Org Usage */}
      {orgUsage.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Documents Per Organization</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orgUsage.map((org) => (
                <div key={org.name} className="flex items-center gap-4">
                  <span className="text-sm w-40 truncate">{org.name}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${orgUsage[0].count > 0 ? (org.count / orgUsage[0].count) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">{org.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
