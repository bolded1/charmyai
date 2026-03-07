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

const teamMembers = [
  { id: '1', name: 'John Doe', email: 'john@company.com', role: 'Owner', jobTitle: 'CEO', status: 'active', lastActive: '2026-03-07', avatar: null },
  { id: '2', name: 'Jane Smith', email: 'jane@company.com', role: 'Accountant', jobTitle: 'Senior Accountant', status: 'active', lastActive: '2026-03-07', avatar: null },
  { id: '3', name: 'Mike Wilson', email: 'mike@company.com', role: 'Staff', jobTitle: 'Finance Analyst', status: 'active', lastActive: '2026-03-06', avatar: null },
  { id: '4', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'Admin', jobTitle: 'Office Manager', status: 'pending', lastActive: '', avatar: null },
];

const roleColors: Record<string, string> = {
  Owner: "bg-primary/10 text-primary",
  Admin: "bg-accent text-accent-foreground",
  Accountant: "bg-secondary text-secondary-foreground",
  Staff: "bg-muted text-muted-foreground",
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase();
}

export default function TeamPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setDialogOpen(false);
    toast.success("Invitation sent!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{teamMembers.length} members</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Invite Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input placeholder="John" required />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input placeholder="Smith" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" placeholder="email@company.com" required />
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input placeholder="e.g. Finance Manager" />
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select defaultValue="Staff">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Accountant">Accountant</SelectItem>
                    <SelectItem value="Finance Manager">Finance Manager</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Send Invitation</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-4 py-2.5 border-b border-border bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Member</span>
            <span>Job Title</span>
            <span className="w-24 text-center">Role</span>
            <span className="w-20 text-center">Status</span>
            <span className="w-24 text-right">Last Active</span>
          </div>
          {teamMembers.map((member, i) => (
            <div key={member.id} className={`grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 items-center px-4 py-3 transition-colors hover:bg-accent/50 ${i < teamMembers.length - 1 ? 'border-b border-border-subtle' : ''}`}>
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-9 w-9 shrink-0">
                  {member.avatar && <AvatarImage src={member.avatar} />}
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground truncate">{member.jobTitle}</p>
              <div className="w-24 flex justify-center">
                <Badge variant="secondary" className={`text-xs ${roleColors[member.role] || ''}`}>{member.role}</Badge>
              </div>
              <div className="w-20 flex justify-center">
                {member.status === 'pending' ? (
                  <Badge variant="outline" className="text-xs">Pending</Badge>
                ) : (
                  <Badge variant="success" className="text-xs">Active</Badge>
                )}
              </div>
              <p className="w-24 text-xs text-muted-foreground text-right">
                {member.lastActive ? new Date(member.lastActive).toLocaleDateString() : '—'}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
