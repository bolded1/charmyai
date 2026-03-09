import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, Tag, Pencil, Check, X, Zap, ArrowRight } from "lucide-react";
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

export default function CategoriesPage() {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Rule form state
  const [ruleField, setRuleField] = useState("supplier_name");
  const [ruleType, setRuleType] = useState("contains");
  const [ruleValue, setRuleValue] = useState("");
  const [ruleCategory, setRuleCategory] = useState("");

  const { user } = useAuth();
  const { data: categories = [], isLoading } = useExpenseCategories();
  const createCategory = useCreateExpenseCategory();
  const deleteCategory = useDeleteExpenseCategory();
  const updateCategory = useUpdateExpenseCategory();

  const { data: rules = [], isLoading: rulesLoading } = useAutoCategoryRules();
  const createRule = useCreateAutoCategoryRule();
  const deleteRule = useDeleteAutoCategoryRule();

  // Fetch expense records for analytics
  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["expense-records-for-analytics", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("expense_records")
        .select("category, currency, total_amount, invoice_date")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createCategory.mutateAsync(newName.trim());
      setNewName("");
    } catch {}
  };

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      await updateCategory.mutateAsync({ id: editingId, name: editName.trim() });
      setEditingId(null);
      setEditName("");
    } catch {}
  };

  const handleCreateRule = async () => {
    if (!ruleValue.trim() || !ruleCategory.trim()) return;
    try {
      await createRule.mutateAsync({
        match_field: ruleField,
        match_type: ruleType,
        match_value: ruleValue.trim(),
        category: ruleCategory,
      });
      setRuleValue("");
      setRuleCategory("");
    } catch {}
  };

  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">Please log in to manage categories.</div>;
  }

  const fieldLabels: Record<string, string> = {
    supplier_name: "Supplier",
    customer_name: "Customer",
    invoice_number: "Invoice #",
  };

  const typeLabels: Record<string, string> = {
    contains: "contains",
    starts_with: "starts with",
    equals: "equals",
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Analytics Section */}
      <CategoryAnalytics expenses={expenses} isLoading={expensesLoading} />
      {/* Categories Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tag className="h-5 w-5" />
            Expense Categories
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No categories yet. Create your first category above.
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                  {editingId === cat.id ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveEdit} disabled={updateCategory.isPending}>
                        <Check className="h-4 w-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{cat.name}</Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleStartEdit(cat.id, cat.name)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost" size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteCategory.mutate(cat.id)}
                          disabled={deleteCategory.isPending}
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

      {/* Auto-Categorization Rules Card */}
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
          {/* New rule form */}
          <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/20">
            <div className="text-sm font-medium text-muted-foreground">New Rule</div>
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm">If</span>
              <Select value={ruleField} onValueChange={setRuleField}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supplier_name">Supplier</SelectItem>
                  <SelectItem value="customer_name">Customer</SelectItem>
                  <SelectItem value="invoice_number">Invoice #</SelectItem>
                </SelectContent>
              </Select>
              <Select value={ruleType} onValueChange={setRuleType}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contains">contains</SelectItem>
                  <SelectItem value="starts_with">starts with</SelectItem>
                  <SelectItem value="equals">equals</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="e.g. AWS"
                value={ruleValue}
                onChange={(e) => setRuleValue(e.target.value)}
                className="w-[140px] h-9"
              />
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={ruleCategory} onValueChange={setRuleCategory}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleCreateRule} disabled={createRule.isPending || !ruleValue.trim() || !ruleCategory} size="sm">
                {createRule.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Add Rule
              </Button>
            </div>
          </div>

          {/* Rules list */}
          {rulesLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm">
              No rules yet. Create a rule above to auto-categorize incoming documents.
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span className="text-muted-foreground">If</span>
                    <Badge variant="outline">{fieldLabels[rule.match_field] || rule.match_field}</Badge>
                    <span className="text-muted-foreground">{typeLabels[rule.match_type] || rule.match_type}</span>
                    <Badge variant="secondary">"{rule.match_value}"</Badge>
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                    <Badge>{rule.category}</Badge>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => deleteRule.mutate(rule.id)}
                    disabled={deleteRule.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
