import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const actionColors: Record<string, string> = {
  document_uploaded: "bg-accent text-accent-foreground",
  document_processed: "bg-primary/10 text-primary",
  document_approved: "bg-primary/10 text-primary",
  document_failed: "bg-destructive/10 text-destructive",
  export_generated: "bg-secondary text-secondary-foreground",
  user_login: "bg-accent text-accent-foreground",
  user_signup: "bg-accent text-accent-foreground",
  settings_updated: "bg-secondary text-secondary-foreground",
};

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--muted))"];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrgs: 0,
    totalUsers: 0,
    totalDocs: 0,
    totalProcessed: 0,
    awaitingReview: 0,
    failedDocs: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [orgActivity, setOrgActivity] = useState<{ name: string; documents: number }[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // Counts in parallel
        const [orgsRes, usersRes, docsRes, processedRes, reviewRes, failedRes, logsRes] = await Promise.all([
          supabase.from("organizations").select("id", { count: "exact", head: true }),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("documents").select("id", { count: "exact", head: true }),
          supabase.from("documents").select("id", { count: "exact", head: true }).in("status", ["processed", "approved"]),
          supabase.from("documents").select("id", { count: "exact", head: true }).eq("status", "processed"),
          supabase.from("documents").select("id", { count: "exact", head: true }).eq("status", "failed"),
          supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(8),
        ]);

        setStats({
          totalOrgs: orgsRes.count || 0,
          totalUsers: usersRes.count || 0,
          totalDocs: docsRes.count || 0,
          totalProcessed: processedRes.count || 0,
          awaitingReview: reviewRes.count || 0,
          failedDocs: failedRes.count || 0,
        });

        setRecentLogs(logsRes.data || []);

        // Daily data (7 days)
        const { data: docs } = await supabase
          .from("documents")
          .select("created_at, status")
          .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString());

        const dayMap = new Map<string, { processed: number; failed: number }>();
        for (let i = 6; i >= 0; i--) {
          const d = new Date(Date.now() - i * 86400000);
          dayMap.set(d.toISOString().slice(5, 10), { processed: 0, failed: 0 });
        }
        (docs || []).forEach((doc) => {
          const key = doc.created_at.slice(5, 10);
          const entry = dayMap.get(key);
          if (entry) {
            if (doc.status === "processed" || doc.status === "approved") entry.processed++;
            if (doc.status === "failed") entry.failed++;
          }
        });
        setDailyData(Array.from(dayMap.entries()).map(([date, vals]) => ({ date, ...vals })));

        // Org activity
        const { data: orgs } = await supabase.from("organizations").select("id, name, owner_user_id");
        const orgCounts = await Promise.all(
          (orgs || []).slice(0, 6).map(async (org) => {
            const { count } = await supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", org.owner_user_id);
            return { name: org.name, documents: count || 0 };
          })
        );
        setOrgActivity(orgCounts.sort((a, b) => b.documents - a.documents));
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const successRate = stats.totalDocs > 0 ? Math.round((stats.totalProcessed / stats.totalDocs) * 100) : 0;
  const successRateData = [
    { name: "Success", value: successRate },
    { name: "Other", value: 100 - successRate },
  ];

  const statCards = [
    { label: "Organizations", value: stats.totalOrgs, icon: Building2 },
    { label: "Users", value: stats.totalUsers, icon: Users },
    { label: "Documents", value: stats.totalDocs.toLocaleString(), icon: FileText },
    { label: "Processed", value: stats.totalProcessed.toLocaleString(), icon: CheckCircle2 },
    { label: "Awaiting Review", value: stats.awaitingReview, icon: AlertCircle },
    { label: "Failed", value: stats.failedDocs, icon: AlertCircle },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-accent-foreground" />
                </div>
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Documents Processed (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="processed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Processed" />
                  <Bar dataKey="failed" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={successRateData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} dataKey="value" startAngle={90} endAngle={-270}>
                    {successRateData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center -mt-4">
              <span className="text-3xl font-bold">{successRate}%</span>
              <p className="text-xs text-muted-foreground">Success rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            {orgActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No organizations yet</p>
            ) : (
              <div className="space-y-3">
                {orgActivity.map((org) => (
                  <div key={org.name} className="flex items-center justify-between">
                    <span className="text-sm truncate">{org.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${orgActivity[0].documents > 0 ? (org.documents / orgActivity[0].documents) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-12 text-right">{org.documents}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm">{entry.details || entry.action.replace(/_/g, " ")}</span>
                        <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 capitalize ${actionColors[entry.action] || "bg-secondary text-secondary-foreground"}`}>
                          {entry.action.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{entry.user_email || "System"} · {new Date(entry.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
