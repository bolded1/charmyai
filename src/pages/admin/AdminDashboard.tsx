import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminDashboardStats, adminAuditLogs, dailyProcessingData, orgActivityData } from "@/lib/admin-mock-data";
import { Building2, Users, FileText, AlertCircle, CheckCircle2, HardDrive } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const stats = [
  { label: "Total Organizations", value: adminDashboardStats.totalOrganizations, icon: Building2, change: "+2 this month" },
  { label: "Total Users", value: adminDashboardStats.totalUsers, icon: Users, change: "+5 this month" },
  { label: "Documents Uploaded", value: adminDashboardStats.documentsUploaded.toLocaleString(), icon: FileText, change: "+386 this week" },
  { label: "Documents Processed", value: adminDashboardStats.documentsProcessed.toLocaleString(), icon: CheckCircle2, change: `${adminDashboardStats.processingSuccessRate}% success` },
  { label: "Awaiting Review", value: adminDashboardStats.awaitingReview, icon: AlertCircle, change: "across 4 orgs" },
  { label: "Storage Used", value: `${adminDashboardStats.storageUsedGB} GB`, icon: HardDrive, change: `${adminDashboardStats.aiProcessingHours}h AI time` },
];

const actionColors: Record<string, string> = {
  document_uploaded: "bg-accent text-accent-foreground",
  document_processed: "bg-primary/10 text-primary",
  document_approved: "bg-primary/10 text-primary",
  document_failed: "bg-destructive/10 text-destructive",
  export_generated: "bg-secondary text-secondary-foreground",
  user_invited: "bg-accent text-accent-foreground",
  user_registered: "bg-accent text-accent-foreground",
  organization_created: "bg-primary/10 text-primary",
  subscription_suspended: "bg-destructive/10 text-destructive",
  document_edited: "bg-secondary text-secondary-foreground",
};

const CHART_COLORS = ["hsl(224, 64%, 33%)", "hsl(220, 14%, 80%)"];

const successRateData = [
  { name: "Success", value: adminDashboardStats.processingSuccessRate },
  { name: "Failed", value: 100 - adminDashboardStats.processingSuccessRate },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center">
                  <s.icon className="h-4 w-4 text-accent-foreground" />
                </div>
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{s.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Daily Processing Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Documents Processed Per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyProcessingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 9%, 46%)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(0, 0%, 100%)",
                      border: "1px solid hsl(220, 13%, 91%)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="processed" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} name="Processed" />
                  <Bar dataKey="failed" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Processing Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={successRateData}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={70}
                    dataKey="value"
                    startAngle={90} endAngle={-270}
                  >
                    {successRateData.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center -mt-4">
              <span className="text-3xl font-bold">{adminDashboardStats.processingSuccessRate}%</span>
              <p className="text-xs text-muted-foreground">Success rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Organizations */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Active Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orgActivityData.slice(0, 6).map((org) => (
                <div key={org.name} className="flex items-center justify-between">
                  <span className="text-sm truncate">{org.name}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(org.documents / orgActivityData[0].documents) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12 text-right">{org.documents}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {adminAuditLogs.slice(0, 7).map((entry) => (
                <div key={entry.id} className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm">{entry.details}</span>
                      <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${actionColors[entry.action] || ''}`}>
                        {entry.action.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{entry.organization} · {new Date(entry.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
