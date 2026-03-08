import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, DollarSign, Users, TrendingDown, Clock } from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

interface RevenueData {
  mrr: number;
  activeSubscriptions: number;
  trialingCount: number;
  churnCount: number;
  churnRate: number;
  planBreakdown: { name: string; count: number; revenue: number }[];
  signupTrend: { month: string; signups: number }[];
  mrrTrend: { month: string; mrr: number }[];
  totalUsers: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(210, 70%, 55%)",
  "hsl(150, 60%, 45%)",
];

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("admin-revenue-stats");
      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Failed to load revenue data");
      }
      setData(res.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load revenue data");
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

  if (!data) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-muted-foreground">Failed to load revenue data</p>
        <Button variant="outline" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" /> Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Revenue Overview</h2>
          <p className="text-sm text-muted-foreground">Stripe subscription analytics</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={DollarSign} label="Monthly Revenue" value={`€${data.mrr.toLocaleString()}`} />
        <KPICard icon={Users} label="Active Subscriptions" value={String(data.activeSubscriptions)} badge={data.trialingCount > 0 ? `${data.trialingCount} trialing` : undefined} />
        <KPICard icon={TrendingDown} label="Churn Rate (30d)" value={`${data.churnRate}%`} subtitle={`${data.churnCount} canceled`} />
        <KPICard icon={Clock} label="New Signups (6mo)" value={String(data.totalUsers)} />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* MRR Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.mrrTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `€${v}`} className="text-muted-foreground" />
                <Tooltip formatter={(value: number) => [`€${value.toFixed(2)}`, "Revenue"]} />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary) / 0.15)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Signups Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">New Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.signupTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} className="text-muted-foreground" />
                <Tooltip />
                <Bar dataKey="signups" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Plan Breakdown */}
      {data.planBreakdown.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Subscription Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={data.planBreakdown}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    paddingAngle={2}
                    label={({ name, count }) => `${name} (${count})`}
                    labelLine={false}
                  >
                    {data.planBreakdown.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Plan Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.planBreakdown.map((plan, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <div>
                        <p className="text-sm font-medium">{plan.name}</p>
                        <p className="text-xs text-muted-foreground">{plan.count} subscriber{plan.count !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold">€{plan.revenue.toFixed(2)}/mo</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function KPICard({ icon: Icon, label, value, subtitle, badge }: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  subtitle?: string;
  badge?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>}
        {badge && <Badge variant="secondary" className="text-[10px] mt-1">{badge}</Badge>}
      </CardContent>
    </Card>
  );
}
