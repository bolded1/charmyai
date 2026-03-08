import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, RefreshCw, TrendingUp, TrendingDown, Minus, MessageSquareHeart } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface FeedbackRow {
  id: string;
  user_id: string;
  score: number;
  feedback_type: string;
  comment: string | null;
  page: string | null;
  created_at: string;
}

const COLORS = {
  detractor: "hsl(var(--destructive))",
  passive: "hsl(var(--muted-foreground))",
  promoter: "hsl(var(--primary))",
};

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      let query = supabase.from("user_feedback").select("*").order("created_at", { ascending: false }).limit(500);
      if (period !== "all") {
        const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
        const since = new Date(Date.now() - days * 86400000).toISOString();
        query = query.gte("created_at", since);
      }
      const { data, error } = await query;
      if (error) throw error;
      setFeedback((data as FeedbackRow[]) || []);
    } catch (err: any) {
      toast.error("Failed to load feedback: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [period]);

  const nps = feedback.filter((f) => f.feedback_type === "nps");
  const promoters = nps.filter((f) => f.score >= 9).length;
  const passives = nps.filter((f) => f.score >= 7 && f.score <= 8).length;
  const detractors = nps.filter((f) => f.score <= 6).length;
  const npsScore = nps.length > 0 ? Math.round(((promoters - detractors) / nps.length) * 100) : null;

  const scoreDistribution = Array.from({ length: 11 }, (_, i) => ({
    score: i,
    count: nps.filter((f) => f.score === i).length,
    fill: i <= 6 ? COLORS.detractor : i <= 8 ? COLORS.passive : COLORS.promoter,
  }));

  const segmentData = [
    { name: "Promoters (9-10)", value: promoters, fill: COLORS.promoter },
    { name: "Passives (7-8)", value: passives, fill: COLORS.passive },
    { name: "Detractors (0-6)", value: detractors, fill: COLORS.detractor },
  ].filter((d) => d.value > 0);

  const commentsWithScore = nps.filter((f) => f.comment).slice(0, 20);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquareHeart className="h-5 w-5 text-primary" /> User Feedback & NPS
          </h2>
          <p className="text-sm text-muted-foreground">Track user satisfaction and collect actionable insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">NPS Score</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-3xl font-bold">{npsScore !== null ? npsScore : "—"}</p>
              {npsScore !== null && (
                npsScore > 0 ? <TrendingUp className="h-4 w-4 text-primary" /> :
                npsScore < 0 ? <TrendingDown className="h-4 w-4 text-destructive" /> :
                <Minus className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Range: -100 to +100</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Total Responses</p>
            <p className="text-3xl font-bold mt-1">{nps.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Promoters</p>
            <p className="text-3xl font-bold mt-1 text-primary">{promoters}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{nps.length > 0 ? Math.round((promoters / nps.length) * 100) : 0}% of responses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground">Detractors</p>
            <p className="text-3xl font-bold mt-1 text-destructive">{detractors}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{nps.length > 0 ? Math.round((detractors / nps.length) * 100) : 0}% of responses</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Score Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="score" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Responses" radius={[4, 4, 0, 0]}>
                    {scoreDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Segment Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Segment Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {segmentData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <div className="h-[220px] flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={segmentData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {segmentData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 ml-2">
                  {segmentData.map((s) => (
                    <div key={s.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.fill }} />
                      <span className="text-xs whitespace-nowrap">{s.name}: {s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Comments */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent Comments</CardTitle>
        </CardHeader>
        <CardContent>
          {commentsWithScore.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No comments yet</p>
          ) : (
            <div className="space-y-3">
              {commentsWithScore.map((f) => (
                <div key={f.id} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                  <Badge
                    variant="secondary"
                    className={`text-[10px] h-6 shrink-0 ${
                      f.score <= 6 ? "bg-destructive/10 text-destructive" :
                      f.score <= 8 ? "bg-secondary text-secondary-foreground" :
                      "bg-primary/10 text-primary"
                    }`}
                  >
                    {f.score}/10
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{f.comment}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(f.created_at).toLocaleDateString()} · {f.page || "Unknown page"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
