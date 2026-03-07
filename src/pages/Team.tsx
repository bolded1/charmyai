import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Mail, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const teamMembers = [
  { id: '1', name: 'John Doe', email: 'john@company.com', role: 'Owner', status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane@company.com', role: 'Accountant', status: 'active' },
  { id: '3', name: 'Mike Wilson', email: 'mike@company.com', role: 'Staff', status: 'active' },
  { id: '4', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'Admin', status: 'pending' },
];

const roleColors: Record<string, string> = {
  Owner: "bg-primary/10 text-primary",
  Admin: "bg-accent text-accent-foreground",
  Accountant: "bg-secondary text-secondary-foreground",
  Staff: "bg-muted text-muted-foreground",
};

export default function TeamPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setDialogOpen(false);
    toast.success("Invitation sent!");
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="Full name" required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@company.com" required />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
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

      <Card>
        <CardContent className="p-0">
          {teamMembers.map((member, i) => (
            <div key={member.id} className={`flex items-center justify-between p-4 ${i < teamMembers.length - 1 ? 'border-b' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  {member.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {member.status === 'pending' && <Badge variant="outline" className="text-xs">Pending</Badge>}
                <Badge variant="secondary" className={roleColors[member.role]}>{member.role}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
