import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, FileText, CheckCircle2, AlertCircle, Loader2, TrendingUp, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { useTranslation } from "react-i18next";

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--border))"];

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrgs: 0, totalUsers: 0, totalDocs: 0, totalProcessed: 0, awaitingReview: 0, failedDocs: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [orgActivity, setOrgActivity] = useState<{ name: string; documents: number }[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
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
          totalOrgs: orgsRes.count || 0, totalUsers: usersRes.count || 0,
          totalDocs: docsRes.count || 0, totalProcessed: processedRes.count || 0,
          awaitingReview: reviewRes.count || 0, failedDocs: failedRes.count || 0,
        });
        setRecentLogs(logsRes.data || []);

        const { data: docs } = await supabase
          .from("documents").select("created_at, status")
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
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const successRate = stats.totalDocs > 0 ? Math.round((stats.totalProcessed / stats.totalDocs) * 100) : 0;
  const successRateData = [
    { name: "Success", value: successRate },
    { name: "Other", value: 100 - successRate },
  ];

  const statCards = [
    { label: t("admin.organizations"), value: stats.totalOrgs, icon: Building2, color: "from-primary to-[hsl(var(--violet))]", iconBg: "bg-primary/10 text-primary" },
    { label: t("admin.totalUsers"), value: stats.totalUsers, icon: Users, color: "from-[hsl(var(--violet))] to-[hsl(var(--rose))]", iconBg: "bg-[hsl(var(--violet-soft))] text-[hsl(var(--violet))]" },
    { label: t("admin.documents"), value: stats.totalDocs.toLocaleString(), icon: FileText, color: "from-[hsl(var(--teal))] to-[hsl(var(--emerald))]", iconBg: "bg-[hsl(var(--teal-soft))] text-[hsl(var(--teal))]" },
    { label: t("admin.processed"), value: stats.totalProcessed.toLocaleString(), icon: CheckCircle2, color: "from-[hsl(var(--emerald))] to-[hsl(var(--teal))]", iconBg: "bg-[hsl(var(--emerald-soft))] text-[hsl(var(--emerald))]" },
    { label: t("admin.awaitingReview"), value: stats.awaitingReview, icon: AlertCircle, color: "from-[hsl(var(--amber))] to-[hsl(var(--rose))]", iconBg: "bg-[hsl(var(--amber-soft))] text-[hsl(var(--amber))]" },
    { label: t("admin.failed"), value: stats.failedDocs, icon: AlertCircle, color: "from-[hsl(var(--rose))] to-destructive", iconBg: "bg-[hsl(var(--rose-soft))] text-[hsl(var(--rose))]" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-[hsl(var(--violet))] to-[hsl(var(--rose))] p-6 text-primary-foreground">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-xl font-bold">{t("admin.welcomeBack")}</h2>
          <p className="text-sm text-primary-foreground/80 mt-1">{t("admin.platformToday")}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="group relative overflow-hidden border-border/40 hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
                <div className={`h-10 w-10 rounded-xl ${s.iconBg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <s.icon className="h-4.5 w-4.5" style={{ strokeWidth: 2 }} />
                </div>
              </div>
              <div className="text-3xl font-bold tracking-tight text-foreground">{s.value}</div>
              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                <ArrowUpRight className="h-3 w-3 text-[hsl(var(--emerald))]" />
                <span className="text-[hsl(var(--emerald))]">{t("admin.last7days")}</span>
              </div>
            </CardContent>
            <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${s.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{t("admin.documentActivity")}</CardTitle>
              <Badge variant="outline" className="text-xs text-muted-foreground border-border/60">{t("admin.last7days")}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="colorProcessed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "12px",
                      boxShadow: "0 8px 32px hsl(var(--foreground) / 0.08)",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="processed" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#colorProcessed)" name={t("admin.processed")} />
                  <Area type="monotone" dataKey="failed" stroke="hsl(var(--destructive))" strokeWidth={2.5} fill="url(#colorFailed)" name={t("admin.failed")} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t("admin.successRate")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={successRateData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} dataKey="value" startAngle={90} endAngle={-270} strokeWidth={0}>
                    {successRateData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-3xl font-bold text-foreground">{successRate}%</span>
                <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{t("admin.successRate")}</p>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                {t("admin.processed")}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full bg-border" />
                {t("common.other", "Other")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{t("admin.topOrganizations")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {orgActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t("admin.noOrganizationsYet")}</p>
            ) : (
              <div className="space-y-4">
                {orgActivity.map((org, idx) => (
                  <div key={org.name} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary/10 to-[hsl(var(--violet-soft))] flex items-center justify-center text-xs font-bold text-primary shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate block">{org.name}</span>
                      <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-[hsl(var(--violet))] rounded-full transition-all duration-500"
                          style={{ width: `${orgActivity[0].documents > 0 ? (org.documents / orgActivity[0].documents) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-foreground w-10 text-right">{org.documents}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">{t("admin.recentActivity")}</CardTitle>
              <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/60">{t("admin.live")}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">{t("admin.noActivityYet")}</p>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((entry, idx) => (
                  <div key={entry.id} className="flex items-start gap-3 group">
                    <div className="relative mt-1">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary/60 group-hover:bg-primary transition-colors ring-4 ring-primary/10" />
                      {idx < recentLogs.length - 1 && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-6 bg-border/60" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pb-1">
                      <p className="text-sm font-medium text-foreground">{entry.details || entry.action.replace(/_/g, " ")}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {entry.user_email || t("admin.system")} · {new Date(entry.created_at).toLocaleString()}
                      </p>
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
