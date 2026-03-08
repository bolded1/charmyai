import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Clock, RefreshCw, Play, Trash2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Job {
  id: string;
  name: string;
  description: string | null;
  function_name: string;
  cron_expression: string;
  enabled: boolean;
  last_run_at: string | null;
  last_status: string | null;
  created_at: string;
}

interface RunHistory {
  id: string;
  job_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  error_message: string | null;
}

const cronPresets = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Daily at midnight", value: "0 0 * * *" },
  { label: "Weekly (Mon)", value: "0 0 * * 1" },
];

export default function AdminScheduledJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [history, setHistory] = useState<RunHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newJob, setNewJob] = useState({ name: "", description: "", function_name: "", cron_expression: "0 * * * *" });
  const [saving, setSaving] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, historyRes] = await Promise.all([
        supabase.from("scheduled_jobs").select("*").order("created_at", { ascending: false }),
        supabase.from("job_run_history").select("*").order("started_at", { ascending: false }).limit(50),
      ]);
      if (jobsRes.error) throw jobsRes.error;
      if (historyRes.error) throw historyRes.error;
      setJobs((jobsRes.data as Job[]) || []);
      setHistory((historyRes.data as RunHistory[]) || []);
    } catch (err: any) {
      toast.error("Failed to load: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleCreate = async () => {
    if (!newJob.name || !newJob.function_name) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("scheduled_jobs").insert({
        name: newJob.name,
        description: newJob.description || null,
        function_name: newJob.function_name,
        cron_expression: newJob.cron_expression,
        enabled: false,
      });
      if (error) throw error;
      toast.success("Job created");
      setDialogOpen(false);
      setNewJob({ name: "", description: "", function_name: "", cron_expression: "0 * * * *" });
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleJob = async (job: Job) => {
    const { error } = await supabase
      .from("scheduled_jobs")
      .update({ enabled: !job.enabled, updated_at: new Date().toISOString() })
      .eq("id", job.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setJobs((prev) => prev.map((j) => j.id === job.id ? { ...j, enabled: !j.enabled } : j));
    toast.success(`${job.name} ${!job.enabled ? "enabled" : "paused"}`);
  };

  const runNow = async (job: Job) => {
    try {
      // Create a run history entry
      const { error: histError } = await supabase.from("job_run_history").insert({
        job_id: job.id,
        status: "running",
      });
      if (histError) throw histError;

      // Invoke the function
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke(job.function_name, {
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
      });

      const status = res.error ? "failed" : "success";
      const errorMsg = res.error?.message || null;

      // Update job status
      await supabase.from("scheduled_jobs").update({
        last_run_at: new Date().toISOString(),
        last_status: status,
        updated_at: new Date().toISOString(),
      }).eq("id", job.id);

      toast[status === "success" ? "success" : "error"](`${job.name}: ${status}`);
      fetchData();
    } catch (err: any) {
      toast.error("Run failed: " + err.message);
    }
  };

  const deleteJob = async (job: Job) => {
    const { error } = await supabase.from("scheduled_jobs").delete().eq("id", job.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setJobs((prev) => prev.filter((j) => j.id !== job.id));
    toast.success("Job deleted");
  };

  const statusIcon = (status: string | null) => {
    if (status === "success") return <CheckCircle2 className="h-3.5 w-3.5 text-primary" />;
    if (status === "failed") return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    if (status === "running") return <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />;
    return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const filteredHistory = selectedJobId ? history.filter((h) => h.job_id === selectedJobId) : history;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Scheduled Jobs
          </h2>
          <p className="text-sm text-muted-foreground">Manage recurring tasks and view run history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Job</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Scheduled Job</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Job Name</Label>
                  <Input placeholder="e.g. Demo Cleanup" value={newJob.name} onChange={(e) => setNewJob((p) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Description</Label>
                  <Textarea placeholder="What this job does..." value={newJob.description} onChange={(e) => setNewJob((p) => ({ ...p, description: e.target.value }))} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Edge Function Name</Label>
                  <Input placeholder="e.g. demo-cleanup" value={newJob.function_name} onChange={(e) => setNewJob((p) => ({ ...p, function_name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Cron Expression</Label>
                  <Input placeholder="0 * * * *" value={newJob.cron_expression} onChange={(e) => setNewJob((p) => ({ ...p, cron_expression: e.target.value }))} />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {cronPresets.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setNewJob((prev) => ({ ...prev, cron_expression: p.value }))}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                          newJob.cron_expression === p.value ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={saving || !newJob.name || !newJob.function_name}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No scheduled jobs yet. Create one to automate recurring tasks.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job.id} className={selectedJobId === job.id ? "ring-1 ring-primary" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedJobId(selectedJobId === job.id ? null : job.id)}>
                    <div className="flex items-center gap-2 mb-1">
                      {statusIcon(job.last_status)}
                      <h3 className="font-medium text-sm">{job.name}</h3>
                      <Badge variant={job.enabled ? "default" : "secondary"} className="text-[10px]">
                        {job.enabled ? "Active" : "Paused"}
                      </Badge>
                    </div>
                    {job.description && <p className="text-xs text-muted-foreground mb-1">{job.description}</p>}
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span className="font-mono">{job.cron_expression}</span>
                      <span>→ {job.function_name}</span>
                      {job.last_run_at && <span>Last: {new Date(job.last_run_at).toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Run now" onClick={() => runNow(job)}>
                      <Play className="h-3.5 w-3.5" />
                    </Button>
                    <Switch checked={job.enabled} onCheckedChange={() => toggleJob(job)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteJob(job)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Run History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Run History {selectedJobId && <span className="text-muted-foreground">— {jobs.find((j) => j.id === selectedJobId)?.name}</span>}
          </CardTitle>
          {selectedJobId && (
            <button className="text-xs text-primary hover:underline" onClick={() => setSelectedJobId(null)}>Show all</button>
          )}
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No run history yet</p>
          ) : (
            <div className="space-y-2">
              {filteredHistory.map((run) => {
                const job = jobs.find((j) => j.id === run.job_id);
                return (
                  <div key={run.id} className={`flex items-center justify-between p-2 rounded-lg ${run.status === "failed" ? "bg-destructive/5 border border-destructive/10" : "bg-muted/30"}`}>
                    <div className="flex items-center gap-2">
                      {statusIcon(run.status)}
                      <div>
                        <p className="text-xs font-medium">{job?.name || "Unknown"}</p>
                        {run.error_message && <p className="text-[10px] text-destructive">{run.error_message}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={run.status === "success" ? "secondary" : run.status === "failed" ? "destructive" : "outline"} className="text-[10px]">
                        {run.status}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(run.started_at).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
