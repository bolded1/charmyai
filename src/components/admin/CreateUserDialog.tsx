import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CreateUserDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (v: boolean) => void; onCreated: () => void }) {
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "", job_title: "", role: "user", company_name: "" });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setCreating(true);
    try {
      const res = await supabase.functions.invoke("admin-create-user", { body: form });
      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Failed to create user");
      }
      toast.success("User account created successfully");
      setForm({ email: "", password: "", first_name: "", last_name: "", job_title: "", role: "user", company_name: "" });
      onOpenChange(false);
      onCreated();
    } catch (err: any) {
      toast.error(err.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Create User Account</DialogTitle></DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">First Name</Label>
              <Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} placeholder="John" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Last Name</Label>
              <Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} placeholder="Smith" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email *</Label>
            <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="user@company.com" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Password *</Label>
            <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" required minLength={6} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Company Name</Label>
            <Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} placeholder="e.g. Acme Inc." />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Job Title</Label>
            <Input value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} placeholder="e.g. Finance Manager" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Role</Label>
            <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
                <SelectItem value="platform_admin">Platform Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={creating}>
            {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : "Create Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
