import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, ShieldAlert, LogIn, UserPlus, AlertTriangle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";

interface LoginStats {
  totalLogins: number;
  failedLogins: number;
  signups: number;
  recentFailed24h: number;
  failureRate: number;
}

interface SuspiciousIp {
  ip: string;
  totalAttempts: number;
  failedAttempts: number;
  uniqueAccounts: number;
}

interface TrendDay {
  date: string;
  logins: number;
  failed: number;
  signups: number;
}

interface FailedAccount {
  email: string;
  failedAttempts: number;
}

interface RecentEvent {
  id: string;
  action: string;
  email: string | null;
  ip: string | null;
  timestamp: string;
  details: string | null;
}

const actionBadge: Record<string, { label: string; className: string }> = {
  user_login: { label: "Login", className: "bg-primary/10 text-primary" },
  user_login_failed: { label: "Failed", className: "bg-destructive/10 text-destructive" },
  user_signup: { label: "Signup", className: "bg-accent text-accent-foreground" },
  password_reset: { label: "Reset", className: "bg-secondary text-secondary-foreground" },
};

export default function AdminLoginActivity() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<LoginStats | null>(null);
  const [suspiciousIps, setSuspiciousIps] = useState<SuspiciousIp[]>([]);
  const [trendData, setTrendData] = useState<TrendDay[]>([]);
  const [topFailed, setTopFailed] = useState<FailedAccount[]>([]);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const isMobile = useIsMobile();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("admin-login-activity", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.error) throw new Error(res.error.message);
      const d = res.data;
      setStats(d.stats);
      setSuspiciousIps(d.suspiciousIps);
      setTrendData(d.trendData);
      setTopFailed(d.topFailedAccounts);
      setRecentEvents(d.recentEvents);
    } catch (err: any) {
      toast.error("Failed to load login activity: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const kpis = [
    { label: "Total Logins", value: stats?.totalLogins ?? 0, icon: LogIn, color: "text-primary" },
    { label: "Failed Attempts", value: stats?.failedLogins ?? 0, icon: ShieldAlert, color: "text-destructive" },
    { label: "Failed (24h)", value: stats?.recentFailed24h ?? 0, icon: AlertTriangle, color: "text-destructive" },
    { label: "New Signups", value: stats?.signups ?? 0, icon: UserPlus, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Login Activity Monitor</h2>
          <p className="text-sm text-muted-foreground">Track authentication events and detect suspicious patterns</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{kpi.label}</p>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <p className="text-2xl font-bold mt-1">{kpi.value.toLocaleString()}</p>
              {kpi.label === "Failed Attempts" && stats && (
                <p className="text-[10px] text-muted-foreground mt-1">{stats.failureRate}% failure rate</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend Chart */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Login Activity (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip labelFormatter={(v) => `Date: ${v}`} />
                  <Legend />
                  <Area type="monotone" dataKey="logins" name="Logins" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="failed" name="Failed" stackId="2" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="signups" name="Signups" stackId="3" stroke="hsl(var(--accent-foreground))" fill="hsl(var(--accent))" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Suspicious IPs */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" /> Suspicious IPs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {suspiciousIps.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No suspicious activity detected</p>
            ) : (
              <div className="space-y-2">
                {suspiciousIps.map((ip) => (
                  <div key={ip.ip} className="flex items-center justify-between p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                    <div>
                      <p className="text-sm font-mono font-medium">{ip.ip}</p>
                      <p className="text-[10px] text-muted-foreground">{ip.uniqueAccounts} account(s) targeted</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="text-[10px]">{ip.failedAttempts} failed</Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">{ip.totalAttempts} total</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Failed Accounts */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" /> Most Failed Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topFailed.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No failed login attempts recorded</p>
            ) : (
              <div className="space-y-2">
                {topFailed.map((acct) => (
                  <div key={acct.email} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <p className="text-sm truncate max-w-[200px]">{acct.email}</p>
                    <Badge variant="secondary" className="text-[10px]">{acct.failedAttempts} attempts</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Events */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent Events</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3 text-xs font-medium text-muted-foreground">Time</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">Action</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">Email</th>
                  {!isMobile && <th className="p-3 text-xs font-medium text-muted-foreground">IP Address</th>}
                  {!isMobile && <th className="p-3 text-xs font-medium text-muted-foreground">Details</th>}
                </tr>
              </thead>
              <tbody>
                {recentEvents.map((event) => {
                  const badge = actionBadge[event.action] || { label: event.action, className: "bg-secondary text-secondary-foreground" };
                  return (
                    <tr key={event.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(event.timestamp).toLocaleString()}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className={`text-[10px] ${badge.className}`}>{badge.label}</Badge>
                      </td>
                      <td className="p-3 text-sm">{event.email || "—"}</td>
                      {!isMobile && <td className="p-3 text-xs font-mono text-muted-foreground">{event.ip || "—"}</td>}
                      {!isMobile && <td className="p-3 text-xs text-muted-foreground">{event.details || "—"}</td>}
                    </tr>
                  );
                })}
                {recentEvents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">No login events recorded yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
