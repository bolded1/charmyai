import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Tag, Loader2, Copy, Eye } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface PromoCode {
  id: string;
  code: string;
  internal_name: string | null;
  description: string | null;
  discount_type: string;
  discount_value: number;
  currency: string | null;
  applies_to_plans: string[] | null;
  applies_to_billing: string | null;
  applies_to_first_only: boolean | null;
  recurring_cycles: number | null;
  start_date: string | null;
  end_date: string | null;
  max_redemptions: number | null;
  max_redemptions_per_org: number | null;
  current_redemptions: number;
  active: boolean;
  requires_card: boolean | null;
  stacks_with_trial: boolean | null;
  extra_trial_days: number | null;
  free_duration_months: number | null;
  stripe_coupon_id: string | null;
  created_at: string;
}

interface Redemption {
  id: string;
  promo_code_id: string;
  user_id: string;
  organization_id: string | null;
  subscription_id: string | null;
  discount_snapshot: any;
  redeemed_at: string;
  status: string;
}

const defaultForm = {
  code: "",
  internal_name: "",
  description: "",
  discount_type: "percentage",
  discount_value: 0,
  currency: "EUR",
  applies_to_billing: "both",
  applies_to_first_only: false,
  recurring_cycles: null as number | null,
  start_date: "",
  end_date: "",
  max_redemptions: null as number | null,
  max_redemptions_per_org: 1,
  active: true,
  requires_card: true,
  stacks_with_trial: true,
  extra_trial_days: 0,
  free_duration_months: null as number | null,
  stripe_coupon_id: "",
};

export default function AdminPromoCodes() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailCode, setDetailCode] = useState<PromoCode | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...defaultForm });

  const { data: promoCodes = [], isLoading } = useQuery({
    queryKey: ["admin-promo-codes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("promo_codes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PromoCode[];
    },
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ["admin-promo-redemptions", detailCode?.id],
    queryFn: async () => {
      if (!detailCode) return [];
      const { data, error } = await supabase
        .from("promo_code_redemptions")
        .select("*")
        .eq("promo_code_id", detailCode.id)
        .order("redeemed_at", { ascending: false });
      if (error) throw error;
      return data as Redemption[];
    },
    enabled: !!detailCode,
  });

  const saveMutation = useMutation({
    mutationFn: async (values: typeof form & { id?: string }) => {
      const payload: any = {
        code: values.code.toUpperCase().trim(),
        internal_name: values.internal_name || null,
        description: values.description || null,
        discount_type: values.discount_type,
        discount_value: values.discount_value,
        currency: values.currency,
        applies_to_plans: ["pro"],
        applies_to_billing: values.applies_to_billing,
        applies_to_first_only: values.applies_to_first_only,
        recurring_cycles: values.recurring_cycles || null,
        start_date: values.start_date || null,
        end_date: values.end_date || null,
        max_redemptions: values.max_redemptions || null,
        max_redemptions_per_org: values.max_redemptions_per_org || 1,
        active: values.active,
        requires_card: values.requires_card,
        stacks_with_trial: values.stacks_with_trial,
        extra_trial_days: values.extra_trial_days || 0,
        free_duration_months: values.free_duration_months || null,
        stripe_coupon_id: values.stripe_coupon_id || null,
        updated_at: new Date().toISOString(),
      };

      if (values.id) {
        const { error } = await supabase.from("promo_codes").update(payload).eq("id", values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("promo_codes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      setDialogOpen(false);
      setEditingId(null);
      setForm({ ...defaultForm });
      toast.success(editingId ? "Promo code updated" : "Promo code created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("promo_codes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      toast.success("Promo code deleted");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("promo_codes").update({ active, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promo-codes"] });
      toast.success("Status updated");
    },
  });

  const openEdit = (code: PromoCode) => {
    setEditingId(code.id);
    setForm({
      code: code.code,
      internal_name: code.internal_name || "",
      description: code.description || "",
      discount_type: code.discount_type,
      discount_value: code.discount_value,
      currency: code.currency || "EUR",
      applies_to_billing: code.applies_to_billing || "both",
      applies_to_first_only: code.applies_to_first_only ?? false,
      recurring_cycles: code.recurring_cycles,
      start_date: code.start_date ? code.start_date.slice(0, 16) : "",
      end_date: code.end_date ? code.end_date.slice(0, 16) : "",
      max_redemptions: code.max_redemptions,
      max_redemptions_per_org: code.max_redemptions_per_org ?? 1,
      active: code.active,
      requires_card: code.requires_card ?? true,
      stacks_with_trial: code.stacks_with_trial ?? true,
      extra_trial_days: code.extra_trial_days ?? 0,
      free_duration_months: code.free_duration_months,
      stripe_coupon_id: code.stripe_coupon_id || "",
    });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...defaultForm });
    setDialogOpen(true);
  };

  const getTypeLabel = (type: string, value: number, freeDuration?: number | null) => {
    if (type === "percentage") {
      if (value === 100 && !freeDuration) return "Free forever";
      if (value === 100 && freeDuration) return `Free ${freeDuration}mo`;
      return `${value}% off`;
    }
    if (type === "fixed") return `€${value} off`;
    if (type === "trial_extension") return "Trial extension";
    if (type === "free_period") return `Free ${freeDuration}mo`;
    return type;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="h-6 w-6 text-primary" />
            Promo Codes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create and manage discount codes for subscriptions</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Code
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="text-2xl font-bold">{promoCodes.length}</div>
            <p className="text-xs text-muted-foreground">Total Codes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="text-2xl font-bold">{promoCodes.filter(c => c.active).length}</div>
            <p className="text-xs text-muted-foreground">Active Codes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="text-2xl font-bold">{promoCodes.reduce((s, c) => s + c.current_redemptions, 0)}</div>
            <p className="text-xs text-muted-foreground">Total Redemptions</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : promoCodes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No promo codes yet. Create your first one.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Redeemed</TableHead>
                  <TableHead>Valid Until</TableHead>
                  <TableHead>Billing</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-xs bg-muted px-2 py-1 rounded">{code.code}</code>
                        <button onClick={() => { navigator.clipboard.writeText(code.code); toast.success("Copied!"); }} className="text-muted-foreground hover:text-foreground">
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{code.internal_name || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {getTypeLabel(code.discount_type, code.discount_value, code.free_duration_months)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={code.active}
                        onCheckedChange={(active) => toggleActive.mutate({ id: code.id, active })}
                      />
                    </TableCell>
                    <TableCell className="text-sm">
                      {code.current_redemptions}{code.max_redemptions ? `/${code.max_redemptions}` : ""}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {code.end_date ? format(new Date(code.end_date), "dd MMM yyyy") : "No expiry"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">{code.applies_to_billing}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setDetailCode(code)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(code)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm("Delete this promo code?")) deleteMutation.mutate(code.id); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Promo Code" : "Create Promo Code"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); saveMutation.mutate({ ...form, id: editingId || undefined }); }}
            className="space-y-5"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Promo Code *</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME20" required />
              </div>
              <div className="space-y-2">
                <Label>Internal Name</Label>
                <Input value={form.internal_name} onChange={(e) => setForm({ ...form, internal_name: e.target.value })} placeholder="Welcome campaign" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Public-facing description" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type *</Label>
                <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                    <SelectItem value="trial_extension">Trial Extension</SelectItem>
                    <SelectItem value="free_period">Free Period</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{form.discount_type === "percentage" ? "Percentage" : form.discount_type === "fixed" ? "Amount (€)" : form.discount_type === "trial_extension" ? "Extra Days" : "Value"}</Label>
                <Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>

            {(form.discount_type === "percentage" || form.discount_type === "free_period") && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Free Duration (months)</Label>
                  <Input type="number" value={form.free_duration_months ?? ""} onChange={(e) => setForm({ ...form, free_duration_months: e.target.value ? parseInt(e.target.value) : null })} placeholder="Leave empty for forever" />
                </div>
                <div className="space-y-2">
                  <Label>Recurring Cycles</Label>
                  <Input type="number" value={form.recurring_cycles ?? ""} onChange={(e) => setForm({ ...form, recurring_cycles: e.target.value ? parseInt(e.target.value) : null })} placeholder="Billing cycles to apply" />
                </div>
              </div>
            )}

            {form.discount_type === "trial_extension" && (
              <div className="space-y-2">
                <Label>Extra Trial Days</Label>
                <Input type="number" value={form.extra_trial_days} onChange={(e) => setForm({ ...form, extra_trial_days: parseInt(e.target.value) || 0 })} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Applies to Billing</Label>
                <Select value={form.applies_to_billing} onValueChange={(v) => setForm({ ...form, applies_to_billing: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="both">Both</SelectItem>
                    <SelectItem value="monthly">Monthly only</SelectItem>
                    <SelectItem value="yearly">Yearly only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stripe Coupon ID (optional)</Label>
                <Input value={form.stripe_coupon_id} onChange={(e) => setForm({ ...form, stripe_coupon_id: e.target.value })} placeholder="coupon_abc123" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Total Redemptions</Label>
                <Input type="number" value={form.max_redemptions ?? ""} onChange={(e) => setForm({ ...form, max_redemptions: e.target.value ? parseInt(e.target.value) : null })} placeholder="Unlimited" />
              </div>
              <div className="space-y-2">
                <Label>Max Per Customer</Label>
                <Input type="number" value={form.max_redemptions_per_org ?? 1} onChange={(e) => setForm({ ...form, max_redemptions_per_org: parseInt(e.target.value) || 1 })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label className="text-sm">Requires Card</Label>
                <Switch checked={form.requires_card} onCheckedChange={(v) => setForm({ ...form, requires_card: v })} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label className="text-sm">Stacks with Trial</Label>
                <Switch checked={form.stacks_with_trial} onCheckedChange={(v) => setForm({ ...form, stacks_with_trial: v })} />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm">First Payment Only</Label>
              <Switch checked={form.applies_to_first_only} onCheckedChange={(v) => setForm({ ...form, applies_to_first_only: v })} />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label className="text-sm">Active</Label>
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingId ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Detail/Redemptions Dialog */}
      <Dialog open={!!detailCode} onOpenChange={() => setDetailCode(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Promo Code: {detailCode?.code}</DialogTitle>
          </DialogHeader>
          {detailCode && (
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="redemptions">Redemptions ({detailCode.current_redemptions})</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-3 mt-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Code:</span> <code className="font-mono">{detailCode.code}</code></div>
                  <div><span className="text-muted-foreground">Internal Name:</span> {detailCode.internal_name || "—"}</div>
                  <div><span className="text-muted-foreground">Type:</span> {getTypeLabel(detailCode.discount_type, detailCode.discount_value, detailCode.free_duration_months)}</div>
                  <div><span className="text-muted-foreground">Active:</span> {detailCode.active ? "Yes" : "No"}</div>
                  <div><span className="text-muted-foreground">Requires Card:</span> {detailCode.requires_card ? "Yes" : "No"}</div>
                  <div><span className="text-muted-foreground">Stacks with Trial:</span> {detailCode.stacks_with_trial ? "Yes" : "No"}</div>
                  <div><span className="text-muted-foreground">Billing:</span> {detailCode.applies_to_billing}</div>
                  <div><span className="text-muted-foreground">Max Redemptions:</span> {detailCode.max_redemptions ?? "Unlimited"}</div>
                  <div><span className="text-muted-foreground">Start:</span> {detailCode.start_date ? format(new Date(detailCode.start_date), "dd MMM yyyy HH:mm") : "—"}</div>
                  <div><span className="text-muted-foreground">End:</span> {detailCode.end_date ? format(new Date(detailCode.end_date), "dd MMM yyyy HH:mm") : "—"}</div>
                  {detailCode.stripe_coupon_id && <div className="col-span-2"><span className="text-muted-foreground">Stripe Coupon:</span> {detailCode.stripe_coupon_id}</div>}
                  {detailCode.description && <div className="col-span-2"><span className="text-muted-foreground">Description:</span> {detailCode.description}</div>}
                </div>
              </TabsContent>
              <TabsContent value="redemptions" className="mt-4">
                {redemptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No redemptions yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {redemptions.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-xs">{r.user_id.slice(0, 8)}...</TableCell>
                          <TableCell className="text-sm">{format(new Date(r.redeemed_at), "dd MMM yyyy HH:mm")}</TableCell>
                          <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
