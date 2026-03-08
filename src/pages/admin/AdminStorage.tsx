import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw, HardDrive, Users, FileText, Search } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface UserStorage {
  userId: string;
  name: string;
  email: string;
  organization: string;
  bytes: number;
  docCount: number;
  fileTypes: Record<string, number>;
}

interface StorageData {
  totalBytes: number;
  totalDocs: number;
  totalUsers: number;
  perUser: UserStorage[];
  fileTypeBreakdown: { name: string; bytes: number }[];
  uploadTrend: { month: string; bytes: number; count: number }[];
}

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(150, 60%, 45%)",
  "hsl(210, 70%, 55%)",
  "hsl(40, 90%, 50%)",
  "hsl(280, 60%, 55%)",
  "hsl(0, 70%, 55%)",
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 1 ? 2 : 0)} ${units[i]}`;
}

export default function AdminStoragePage() {
  const [data, setData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await supabase.functions.invoke("admin-storage-stats");
      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Failed to load storage data");
      }
      setData(res.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load storage data");
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
        <p className="text-muted-foreground">Failed to load storage data</p>
        <Button variant="outline" onClick={fetchData}><RefreshCw className="h-4 w-4 mr-2" /> Retry</Button>
      </div>
    );
  }

  const maxUserBytes = data.perUser.length > 0 ? data.perUser[0].bytes : 1;

  const filteredUsers = data.perUser.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.organization.toLowerCase().includes(search.toLowerCase())
  );

  // Format upload trend for chart (in MB)
  const trendData = data.uploadTrend.map(t => ({
    ...t,
    mb: Math.round((t.bytes / (1024 * 1024)) * 100) / 100,
  }));

  // Format file type for pie
  const ftData = data.fileTypeBreakdown.map(f => ({
    name: f.name.toUpperCase(),
    value: f.bytes,
    label: formatBytes(f.bytes),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Storage Usage</h2>
          <p className="text-sm text-muted-foreground">Per-user document storage consumption</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard icon={HardDrive} label="Total Storage" value={formatBytes(data.totalBytes)} />
        <KPICard icon={FileText} label="Total Documents" value={String(data.totalDocs)} />
        <KPICard icon={Users} label="Users with Files" value={String(data.totalUsers)} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Volume Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upload Volume (MB)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${v} MB`} />
                <Tooltip formatter={(value: number) => [`${value} MB`, "Uploaded"]} />
                <Bar dataKey="mb" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* File Type Breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Storage by File Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={ftData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={2}
                >
                  {ftData.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [formatBytes(value), "Size"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {ftData.map((entry, idx) => (
                <Badge key={idx} variant="secondary" className="text-[10px] gap-1">
                  <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  {entry.name} ({entry.label})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-User Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Per-User Breakdown</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9 h-8 text-xs"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-3 text-xs font-medium text-muted-foreground">User</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">Organization</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground">Documents</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground min-w-[200px]">Storage Used</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground text-right">Size</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => {
                  const pct = maxUserBytes > 0 ? (user.bytes / maxUserBytes) * 100 : 0;
                  return (
                    <tr key={user.userId} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground">{user.email}</p>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{user.organization}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-xs">{user.docCount}</Badge>
                      </td>
                      <td className="p-3">
                        <Progress value={pct} className="h-2" />
                      </td>
                      <td className="p-3 text-sm font-medium text-right whitespace-nowrap">
                        {formatBytes(user.bytes)}
                      </td>
                    </tr>
                  );
                })}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                      No users match your search
                    </td>
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

function KPICard({ icon: Icon, label, value }: { icon: typeof HardDrive; label: string; value: string }) {
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
      </CardContent>
    </Card>
  );
}
