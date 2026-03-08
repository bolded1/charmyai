import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileRecordCard } from "@/components/ui/responsive-table";
import { usePlatformLimits } from "@/hooks/usePlatformLimits";

const teamMembers = [
  { id: '1', name: 'John Doe', email: 'john@company.com', role: 'Owner', jobTitle: 'CEO', status: 'active', lastActive: '2026-03-07' },
  { id: '2', name: 'Jane Smith', email: 'jane@company.com', role: 'Accountant', jobTitle: 'Senior Accountant', status: 'active', lastActive: '2026-03-07' },
  { id: '3', name: 'Mike Wilson', email: 'mike@company.com', role: 'Staff', jobTitle: 'Finance Analyst', status: 'active', lastActive: '2026-03-06' },
  { id: '4', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'Admin', jobTitle: 'Office Manager', status: 'pending', lastActive: '' },
];

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase();
}

export default function TeamPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setDialogOpen(false);
    toast.success("Invitation sent!");
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{teamMembers.length} members</p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Invite</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">First Name</Label>
                  <Input placeholder="John" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Last Name</Label>
                  <Input placeholder="Smith" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input type="email" placeholder="email@company.com" required />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Job Title</Label>
                <Input placeholder="e.g. Finance Manager" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Role</Label>
                <Select defaultValue="Staff">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Accountant">Accountant</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Send Invitation</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isMobile ? (
        <div className="space-y-2">
          {teamMembers.map((member) => (
            <MobileRecordCard
              key={member.id}
              title={member.name}
              subtitle={member.email}
              badge={{
                label: member.status === "pending" ? "Pending" : "Active",
                className: member.status === "pending" ? "bg-accent text-accent-foreground" : "bg-primary/10 text-primary",
              }}
              fields={[
                { label: "Job Title", value: member.jobTitle },
                { label: "Role", value: member.role },
                { label: "Last Active", value: member.lastActive ? new Date(member.lastActive).toLocaleDateString() : "—" },
              ]}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground">Member</th>
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground">Job Title</th>
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground">Role</th>
                  <th className="p-4 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="p-4 text-right text-xs font-medium text-muted-foreground">Last Active</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id} className="border-b border-border-subtle last:border-0 hover:bg-accent/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">{getInitials(member.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{member.jobTitle}</td>
                    <td className="p-4"><Badge variant="secondary" className="text-xs font-normal">{member.role}</Badge></td>
                    <td className="p-4">
                      {member.status === 'pending' ? (
                        <Badge variant="outline" className="text-xs font-normal">Pending</Badge>
                      ) : (
                        <Badge variant="success" className="text-xs font-normal">Active</Badge>
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground text-right">
                      {member.lastActive ? new Date(member.lastActive).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
