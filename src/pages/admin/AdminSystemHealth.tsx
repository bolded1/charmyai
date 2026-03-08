import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw, Activity, Database, HardDrive, CheckCircle2, XCircle, Clock, ToggleLeft } from "lucide-react";
import { toast } from "sonner";

interface HealthData {
  database: { tableCounts: Record<string, number>; totalAuthUsers: number };
  storage: { buckets: Array<{ name: string; fileCount: number; public: boolean }> };
  activity: { docsProcessed24h: number; recentErrors: any[]; activeFeatureFlags: number };
  jobs: { list: any[]; recentFailures: any[] };
  timestamp: string;
}

export default function AdminSystemHealth() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");
      const res = await supabase.functions.invoke("admin-system-health", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.error) throw new Error(res.error.message);
      setData(res.data);
    } catch (err: any) {
      toast.error("Failed to load health data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading || !data) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const totalRows = Object.values(data.database.tableCounts).reduce((s, v) => s + v, 0);
  const totalFiles = data.storage.buckets.reduce((s, b) => s + b.fileCount, 0);
  const hasErrors = data.activity.recentErrors.length > 0;
  const hasJobFailures = data.jobs.recentFailures.length > 0;
  const overallStatus = !hasErrors && !hasJobFailures ? "healthy" : hasJobFailures ? "warning" : "degraded";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" /> System Health
          </h2>
          <p className="text-sm text-muted-foreground">
            Last checked: {new Date(data.timestamp).toLocaleString()}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card className={overallStatus === "healthy" ? "border-primary/30" : overallStatus === "warning" ? "border-yellow-500/30" : "border-destructive/30"}>
        <CardContent className="p-4 flex items-center gap-4">
          {overallStatus === "healthy" ? (
            <CheckCircle2 className="h-8 w-8 text-primary" />
          ) : (
            <XCircle className={`h-8 w-8 ${overallStatus === "warning" ? "text-yellow-500" : "text-destructive"}`} />
          )}
          <div>
            <p className="font-semibold capitalize">{overallStatus === "healthy" ? "All Systems Operational" : overallStatus === "warning" ? "Minor Issues Detected" : "Issues Detected"}</p>
            <p className="text-xs text-muted-foreground">
              {data.activity.docsProcessed24h} documents processed in last 24h · {data.activity.activeFeatureFlags} feature flags active
            </p>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Auth Users</p>
              <Database className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold mt-1">{data.database.totalAuthUsers.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Total DB Rows</p>
              <Database className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{totalRows.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Stored Files</p>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{totalFiles.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Feature Flags</p>
              <ToggleLeft className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-1">{data.activity.activeFeatureFlags}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Table Sizes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Database Tables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.database.tableCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([table, count]) => {
                const pct = totalRows > 0 ? (count / totalRows) * 100 : 0;
                return (
                  <div key={table}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono">{table}</span>
                      <span className="text-xs text-muted-foreground">{count.toLocaleString()}</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                );
              })}
          </CardContent>
        </Card>

        {/* Storage Buckets */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Storage Buckets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.storage.buckets.map((bucket) => (
              <div key={bucket.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{bucket.name}</p>
                    <p className="text-[10px] text-muted-foreground">{bucket.fileCount} files</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[10px]">{bucket.public ? "Public" : "Private"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Jobs Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Scheduled Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {data.jobs.list.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No scheduled jobs configured</p>
          ) : (
            <div className="space-y-2">
              {data.jobs.list.map((job: any) => (
                <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{job.name}</p>
                      <Badge variant="secondary" className={`text-[10px] ${job.enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {job.enabled ? "Active" : "Paused"}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">{job.cron_expression} · {job.function_name}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={job.last_status === "success" ? "secondary" : job.last_status === "failed" ? "destructive" : "outline"} className="text-[10px]">
                      {job.last_status}
                    </Badge>
                    {job.last_run_at && (
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(job.last_run_at).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Errors */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent Errors</CardTitle>
        </CardHeader>
        <CardContent>
          {data.activity.recentErrors.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recent errors detected</p>
            </div>
          ) : (
            <div className="space-y-2">
              {data.activity.recentErrors.map((err: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-destructive/5 border border-destructive/10">
                  <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium">{err.action?.replace(/_/g, " ")}</p>
                    <p className="text-[10px] text-muted-foreground">{err.details || "No details"}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(err.created_at).toLocaleString()}</p>
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
