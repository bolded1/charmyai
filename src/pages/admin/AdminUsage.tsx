import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminDashboardStats, dailyProcessingData, orgActivityData, adminOrganizations } from "@/lib/admin-mock-data";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminUsagePage() {
  const orgUsageData = adminOrganizations
    .sort((a, b) => b.documentsUploaded - a.documentsUploaded)
    .map((o) => ({ name: o.name.length > 15 ? o.name.slice(0, 15) + '…' : o.name, uploaded: o.documentsUploaded, processed: o.documentsProcessed, storage: o.storageUsedMB }));

  const trendData = dailyProcessingData.map((d) => ({
    ...d,
    successRate: d.uploads > 0 ? Math.round((d.processed / d.uploads) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { label: "Total Uploads", value: adminDashboardStats.documentsUploaded.toLocaleString() },
          { label: "Total Processed", value: adminDashboardStats.documentsProcessed.toLocaleString() },
          { label: "Storage Used", value: `${adminDashboardStats.storageUsedGB} GB` },
          { label: "AI Processing", value: `${adminDashboardStats.aiProcessingHours}h` },
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
          <CardHeader className="pb-2"><CardTitle className="text-base">Daily Uploads</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyProcessingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(220,13%,91%)", borderRadius: "8px", fontSize: "12px" }} />
                  <Bar dataKey="uploads" fill="hsl(224, 64%, 33%)" radius={[4, 4, 0, 0]} name="Uploads" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Processing Success Rate (%)</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                  <YAxis domain={[90, 100]} tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(220,13%,91%)", borderRadius: "8px", fontSize: "12px" }} />
                  <Line type="monotone" dataKey="successRate" stroke="hsl(224, 64%, 33%)" strokeWidth={2} dot={{ r: 4 }} name="Success Rate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Org Usage */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Documents Per Organization</CardTitle></CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orgUsageData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} stroke="hsl(220, 9%, 46%)" />
                <Tooltip contentStyle={{ backgroundColor: "hsl(0,0%,100%)", border: "1px solid hsl(220,13%,91%)", borderRadius: "8px", fontSize: "12px" }} />
                <Bar dataKey="uploaded" fill="hsl(224, 64%, 33%)" radius={[0, 4, 4, 0]} name="Uploaded" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Storage per org */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Storage Usage by Organization</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {adminOrganizations.sort((a, b) => b.storageUsedMB - a.storageUsedMB).map((org) => (
              <div key={org.id} className="flex items-center gap-4">
                <span className="text-sm w-40 truncate">{org.name}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(org.storageUsedMB / 10000) * 100}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-16 text-right">{(org.storageUsedMB / 1024).toFixed(1)} GB</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
