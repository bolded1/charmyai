import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, Tag, Pencil, Check, X, Zap, ArrowRight, Eye } from "lucide-react";
import {
  useExpenseCategories, useCreateExpenseCategory,
  useDeleteExpenseCategory, useUpdateExpenseCategory,
} from "@/hooks/useExpenseCategories";
import {
  useAutoCategoryRules, useCreateAutoCategoryRule, useDeleteAutoCategoryRule,
} from "@/hooks/useAutoCategoryRules";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import CategoryAnalytics from "@/components/CategoryAnalytics";

const COLOR_SWATCHES = [
  "#9B2335", "#E07B54", "#D97706", "#059669",
  "#0D9488", "#0284C7", "#7C3AED", "#E11D48",
  "#64748B", "#78716C",
];

export default function CategoriesPage() {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<string | null>(null);
  const [editBudget, setEditBudget] = useState<string>("");

  const [ruleField, setRuleField] = useState("supplier_name");
  const [ruleType, setRuleType] = useState("contains");
  const [ruleValue, setRuleValue] = useState("");
  const [debouncedRuleValue, setDebouncedRuleValue] = useState("");
  const [ruleCategory, setRuleCategory] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedRuleValue(ruleValue), 400);
    return () => clearTimeout(t);
  }, [ruleValue]);

  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { data: categories = [], isLoading } = useExpenseCategories();
  const createCategory = useCreateExpenseCategory();
  const deleteCategory = useDeleteExpenseCategory();
  const updateCategory = useUpdateExpenseCategory();

  const { data: rules = [], isLoading: rulesLoading } = useAutoCategoryRules();
  const createRule = useCreateAutoCategoryRule();
  const deleteRule = useDeleteAutoCategoryRule();

  const orgId = activeWorkspace?.id;

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["expense-records-for-analytics", user?.id, orgId],
    queryFn: async () => {
      if (!user) return [];
      let q = supabase.from("expense_records").select("category, currency, total_amount, invoice_date").eq("user_id", user.id);
      if (orgId) q = q.eq("organization_id", orgId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const { data: income = [] } = useQuery({
    queryKey: ["income-records-for-analytics", user?.id, orgId],
    queryFn: async () => {
      if (!user) return [];
      let q = supabase.from("income_records").select("category").eq("user_id", user.id);
      if (orgId) q = q.eq("organization_id", orgId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const usageCounts = useMemo(() => {
    const map = new Map<string, number>();
    [...expenses, ...income].forEach((r) => {
      if (r.category) map.set(r.category, (map.get(r.category) || 0) + 1);
    });
    return map;
  }, [expenses, income]);

  const { data: rulePreview, isFetching: previewFetching } = useQuery({
    queryKey: ["rule-preview", ruleField, ruleType, debouncedRuleValue, user?.id, orgId],
    queryFn: async () => {
      if (!user || !debouncedRuleValue.trim()) return null;
      const applyFilter = (q: any, field: string) => {
        if (ruleType === "contains")    return q.ilike(field, `%${debouncedRuleValue}%`);
        if (ruleType === "starts_with") return q.ilike(field, `${debouncedRuleValue}%`);
        return q.eq(field, debouncedRuleValue);
      };
      const incomeField = ruleField === "supplier_name" ? "customer_name" : ruleField;
      const [expRes, incRes] = await Promise.all([
        applyFilter(supabase.from("expense_records").select("id", { count: "exact", head: true }).eq("user_id", user.id), ruleField),
        applyFilter(supabase.from("income_records").select("id", { count: "exact", head: true }).eq("user_id", user.id), incomeField),
      ]);
      return { expenses: expRes.count ?? 0, income: incRes.count ?? 0 };
    },
    enabled: !!user && debouncedRuleValue.trim().length > 0,
  });

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createCategory.mutateAsync({ name: newName.trim(), color: newColor });
      setNewName("");
      setNewColor(null);
    } catch {}
  };

  const handleStartEdit = (cat: { id: string; name: string; color: string | null; monthly_budget: number | null }) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setEditBudget(cat.monthly_budget != null ? String(cat.monthly_budget) : "");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      const budgetRaw = editBudget.trim() !== "" ? parseFloat(editBudget) : null;
      await updateCategory.mutateAsync({
        id: editingId,
        name: editName.trim(),
        color: editColor,
        monthly_budget: budgetRaw !== null && isNaN(budgetRaw) ? null : budgetRaw,
      });
      setEditingId(null);
    } catch {}
  };

  const handleCreateRule = async () => {
    if (!ruleValue.trim() || !ruleCategory.trim()) return;
    try {
      await createRule.mutateAsync({ match_field: ruleField, match_type: ruleType, match_value: ruleValue.trim(), category: ruleCategory });
      setRuleValue("");
      setRuleCategory("");
    } catch {}
  };

  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">Please log in to manage categories.</div>;
  }

  const fieldLabels: Record<string, string> = { supplier_name: "Supplier", customer_name: "Customer", invoice_number: "Invoice #" };
  const typeLabels: Record<string, string> = { contains: "contains", starts_with: "starts with", equals: "equals" };
  const totalPreviewMatches = rulePreview ? rulePreview.expenses + rulePreview.income : 0;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <CategoryAnalytics expenses={expenses} isLoading={expensesLoading} categories={categories} />

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tag className="h-5 w-5" />
            Expense Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Create form */}
          <div className="space-y-2 p-3 border rounded-lg bg-muted/20">
            <div className="flex gap-2">
              <Input
                placeholder="New category name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="flex-1"
              />
              <Button onClick={handleCreate} disabled={createCategory.isPending || !newName.trim()}>
                {createCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Add
              </Button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Colour:</span>
              {COLOR_SWATCHES.map((c) => (
                <button
                  key={c} type="button"
                  className="h-5 w-5 rounded-full shrink-0 transition-all"
                  style={{ background: c, outline: newColor === c ? `2px solid ${c}` : "none", outlineOffset: "2px" }}
                  onClick={() => setNewColor(newColor === c ? null : c)}
                />
              ))}
              {newColor && (
                <button type="button" onClick={() => setNewColor(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No categories yet. Create your first category above.</div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                  {editingId === cat.id ? (
                    <div className="flex flex-col gap-2 flex-1 mr-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(); if (e.key === "Escape") setEditingId(null); }}
                          className="h-8 text-sm flex-1"
                          autoFocus
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveEdit} disabled={updateCategory.isPending}>
                          {updateCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-primary" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(null)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">Colour:</span>
                        {COLOR_SWATCHES.map((c) => (
                          <button
                            key={c} type="button"
                            className="h-4 w-4 rounded-full shrink-0 transition-all"
                            style={{ background: c, outline: editColor === c ? `2px solid ${c}` : "none", outlineOffset: "2px" }}
                            onClick={() => setEditColor(editColor === c ? null : c)}
                          />
                        ))}
                        {editColor && (
                          <button type="button" onClick={() => setEditColor(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-28 shrink-0">Monthly budget:</span>
                        <Input
                          type="number" min="0" step="0.01" placeholder="e.g. 500"
                          value={editBudget} onChange={(e) => setEditBudget(e.target.value)}
                          className="h-7 text-xs w-32"
                        />
                        {editBudget && (
                          <button type="button" onClick={() => setEditBudget("")} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {cat.color && <span className="h-3 w-3 rounded-full shrink-0" style={{ background: cat.color }} />}
                        <Badge variant="secondary">{cat.name}</Badge>
                        {cat.monthly_budget != null && (
                          <span className="text-xs text-muted-foreground">Budget: {cat.monthly_budget.toLocaleString()}</span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">{usageCounts.get(cat.name) ?? 0} records</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleStartEdit(cat)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteCategory.mutate(cat.id)} disabled={deleteCategory.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-Categorization Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5" />
            Auto-Categorization Rules
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Automatically assign categories to new documents based on matching rules.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/20">
            <div className="text-sm font-medium text-muted-foreground">New Rule</div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm">If</span>
              <Select value={ruleField} onValueChange={setRuleField}>
                <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="supplier_name">Supplier</SelectItem>
                  <SelectItem value="customer_name">Customer</SelectItem>
                  <SelectItem value="invoice_number">Invoice #</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ruleType} onValueChange={setRuleType}>
                <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">contains</SelectItem>
                  <SelectItem value="starts_with">starts with</SelectItem>
                  <SelectItem value="equals">equals</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="e.g. AWS" value={ruleValue}
                onChange={(e) => setRuleValue(e.target.value)} className="w-[140px] h-9"
              />
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={ruleCategory} onValueChange={setRuleCategory}>
                <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Category..." /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      <div className="flex items-center gap-2">
                        {c.color && <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.color }} />}
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreateRule} disabled={createRule.isPending || !ruleValue.trim() || !ruleCategory} size="sm">
                {createRule.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Add Rule
              </Button>
            </div>

            {/* Rule preview */}
            {debouncedRuleValue.trim().length > 0 && (
              <div className="flex items-center gap-2 text-xs">
                <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                {previewFetching ? (
                  <span className="text-muted-foreground">Checking existing records…</span>
                ) : rulePreview ? (
                  totalPreviewMatches > 0 ? (
                    <span className="text-primary font-medium">
                      Would match{" "}
                      {rulePreview.expenses > 0 && `${rulePreview.expenses} expense`}
                      {rulePreview.expenses > 0 && rulePreview.income > 0 && " + "}
                      {rulePreview.income > 0 && `${rulePreview.income} income`}
                      {" "}record{totalPreviewMatches !== 1 ? "s" : ""} in your history
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No existing records match this rule</span>
                  )
                ) : null}
              </div>
            )}
          </div>

          {rulesLoading ? (
            <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : rules.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No rules yet. Create a rule above to auto-categorize incoming documents.
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => {
                const cat = categories.find((c) => c.name === rule.category);
                return (
                  <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                      <span className="text-muted-foreground">If</span>
                      <Badge variant="outline">{fieldLabels[rule.match_field] || rule.match_field}</Badge>
                      <span className="text-muted-foreground">{typeLabels[rule.match_type] || rule.match_type}</span>
                      <Badge variant="secondary">"{rule.match_value}"</Badge>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge style={cat?.color ? { background: `${cat.color}20`, color: cat.color, borderColor: `${cat.color}40` } : undefined}>
                        {cat?.color && <span className="h-2 w-2 rounded-full mr-1.5 inline-block" style={{ background: cat.color }} />}
                        {rule.category}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => deleteRule.mutate(rule.id)} disabled={deleteRule.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
