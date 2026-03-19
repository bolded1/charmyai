import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Loader2, CalendarIcon, RefreshCw, CheckCircle2, SlidersHorizontal, ChevronUp, ChevronDown } from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useExpenseRecords, useIncomeRecords } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { supabase } from "@/integrations/supabase/client";
import { exportToPdf } from "@/lib/pdf-export";
import { syncToAccounting } from "@/components/AccountingSyncSettings";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { groupByCurrency } from "@/lib/currency-utils";

// ─── Field definitions ────────────────────────────────────────────────────────

type FieldDef = { key: string; label: string; getValue: (d: any) => string };

function fmt(n: number | null | undefined) {
  return Number(n || 0).toFixed(2);
}

const EXPENSE_FIELDS: FieldDef[] = [
  { key: "invoice_date",   label: "Date",         getValue: (d) => d.invoice_date   || "" },
  { key: "due_date",       label: "Due Date",      getValue: (d) => d.due_date       || "" },
  { key: "supplier_name",  label: "Supplier",      getValue: (d) => d.supplier_name  || "" },
  { key: "invoice_number", label: "Invoice #",     getValue: (d) => d.invoice_number || "" },
  { key: "vat_number",     label: "VAT Number",    getValue: (d) => d.vat_number     || "" },
  { key: "currency",       label: "Currency",      getValue: (d) => d.currency       || "EUR" },
  { key: "net_amount",     label: "Net Amount",    getValue: (d) => fmt(d.net_amount) },
  { key: "vat_amount",     label: "VAT Amount",    getValue: (d) => fmt(d.vat_amount) },
  { key: "total_amount",   label: "Total Amount",  getValue: (d) => fmt(d.total_amount) },
  { key: "category",       label: "Category",      getValue: (d) => d.category || "" },
  { key: "notes",          label: "Notes",         getValue: (d) => d.notes    || "" },
];

const INCOME_FIELDS: FieldDef[] = [
  { key: "invoice_date",   label: "Date",         getValue: (d) => d.invoice_date   || "" },
  { key: "due_date",       label: "Due Date",      getValue: (d) => d.due_date       || "" },
  { key: "customer_name",  label: "Customer",      getValue: (d) => d.customer_name  || "" },
  { key: "invoice_number", label: "Invoice #",     getValue: (d) => d.invoice_number || "" },
  { key: "vat_number",     label: "VAT Number",    getValue: (d) => d.vat_number     || "" },
  { key: "currency",       label: "Currency",      getValue: (d) => d.currency       || "EUR" },
  { key: "net_amount",     label: "Net Amount",    getValue: (d) => fmt(d.net_amount) },
  { key: "vat_amount",     label: "VAT Amount",    getValue: (d) => fmt(d.vat_amount) },
  { key: "total_amount",   label: "Total Amount",  getValue: (d) => fmt(d.total_amount) },
  { key: "category",       label: "Category",      getValue: (d) => d.category || "" },
  { key: "notes",          label: "Notes",         getValue: (d) => d.notes    || "" },
];

// ─── Field config persistence ─────────────────────────────────────────────────

type FieldConfig = { key: string; enabled: boolean }[];

function defaultConfig(fields: FieldDef[]): FieldConfig {
  return fields.map((f) => ({ key: f.key, enabled: true }));
}

function loadConfig(storageKey: string, fields: FieldDef[]): FieldConfig {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed: FieldConfig = JSON.parse(stored);
      const storedKeys = new Set(parsed.map((f) => f.key));
      return [
        // keep stored order/enabled for known fields
        ...parsed.filter((f) => fields.some((fd) => fd.key === f.key)),
        // append any newly added fields at the end, enabled by default
        ...fields.filter((fd) => !storedKeys.has(fd.key)).map((fd) => ({ key: fd.key, enabled: true })),
      ];
    }
  } catch { /* ignore */ }
  return defaultConfig(fields);
}

// ─── FieldSelector component ──────────────────────────────────────────────────

function FieldSelector({
  allFields,
  config,
  onChange,
}: {
  allFields: FieldDef[];
  config: FieldConfig;
  onChange: (c: FieldConfig) => void;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (key: string) =>
    onChange(config.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)));

  const move = (index: number, dir: -1 | 1) => {
    const next = [...config];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const enabledCount = config.filter((f) => f.enabled).length;

  return (
    <div className="border rounded-md overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Columns
        </span>
        <span className="text-xs text-muted-foreground">
          {enabledCount} of {config.length} selected
        </span>
      </button>

      {open && (
        <div className="border-t px-3 py-2 space-y-0.5">
          {config.map((f, i) => {
            const field = allFields.find((fd) => fd.key === f.key);
            if (!field) return null;
            return (
              <div key={f.key} className="flex items-center gap-2 py-1">
                <Checkbox
                  checked={f.enabled}
                  onCheckedChange={() => toggle(f.key)}
                  id={`field-${f.key}`}
                />
                <label
                  htmlFor={`field-${f.key}`}
                  className={cn(
                    "flex-1 text-sm cursor-pointer select-none",
                    !f.enabled && "text-muted-foreground"
                  )}
                >
                  {field.label}
                </label>
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-25"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={i === config.length - 1}
                    onClick={() => move(i, 1)}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-25"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          <div className="border-t mt-1 pt-1">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onChange(defaultConfig(allFields))}
            >
              Reset to default
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Months picker ────────────────────────────────────────────────────────────

const MONTHS = [
  { value: "01", label: "Jan", full: "January" },
  { value: "02", label: "Feb", full: "February" },
  { value: "03", label: "Mar", full: "March" },
  { value: "04", label: "Apr", full: "April" },
  { value: "05", label: "May", full: "May" },
  { value: "06", label: "Jun", full: "June" },
  { value: "07", label: "Jul", full: "July" },
  { value: "08", label: "Aug", full: "August" },
  { value: "09", label: "Sep", full: "September" },
  { value: "10", label: "Oct", full: "October" },
  { value: "11", label: "Nov", full: "November" },
  { value: "12", label: "Dec", full: "December" },
];

function MonthMultiSelect({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const toggle = (val: string) =>
    onChange(selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]);

  const label =
    selected.length === 0
      ? "All Months"
      : selected.length <= 3
        ? selected.map((v) => MONTHS.find((m) => m.value === v)?.label).join(", ")
        : `${selected.length} months`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal h-10">
          <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className={selected.length === 0 ? "text-muted-foreground" : ""}>{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-3 pointer-events-auto" align="start">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Select months</span>
          <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={() => onChange([])}>
            Clear
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {MONTHS.map((m) => (
            <label
              key={m.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer text-sm"
            >
              <Checkbox checked={selected.includes(m.value)} onCheckedChange={() => toggle(m.value)} />
              {m.full}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildSubtitle(year: string, months: string[], currency: string) {
  const parts: string[] = [];
  if (year !== "all") parts.push(year);
  if (months.length > 0) parts.push(months.map((v) => MONTHS.find((m) => m.value === v)?.full).join(", "));
  if (currency !== "all") parts.push(currency);
  return parts.length > 0 ? parts.join(" · ") : "All records";
}

function buildFileName(type: string, year: string, months: string[], currency: string, format: string) {
  const parts: string[] = [type];
  if (currency !== "all") parts.push(currency);
  if (year !== "all") parts.push(year);
  if (months.length > 0) parts.push(months.map((v) => MONTHS.find((m) => m.value === v)?.label).join("-"));
  const ext = format === "excel" ? "xls" : format;
  return `charmy-${parts.join("-")}-export.${ext}`;
}

function fmtCurrency(n: number, cur: string) {
  return `${cur === "USD" ? "$" : "€"}${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function downloadCsvOrExcel(headers: string[], rows: string[][], fileName: string, format: "csv" | "excel") {
  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
  const mime = format === "csv" ? "text/csv" : "application/vnd.ms-excel";
  const blob = new Blob([csv], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function resolveFields(allFields: FieldDef[], config: FieldConfig): FieldDef[] {
  return config
    .filter((f) => f.enabled)
    .map((f) => allFields.find((fd) => fd.key === f.key)!)
    .filter(Boolean);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExportsPage() {
  const [format, setFormat] = useState("pdf");
  const [currency, setCurrency] = useState("all");
  const [expMonths, setExpMonths] = useState<string[]>([]);
  const [expYear, setExpYear] = useState("all");
  const [exporting, setExporting] = useState(false);

  const [incomeFormat, setIncomeFormat] = useState("pdf");
  const [incomeCurrency, setIncomeCurrency] = useState("all");
  const [incomeMonths, setIncomeMonths] = useState<string[]>([]);
  const [incomeYear, setIncomeYear] = useState("all");
  const [exportingIncome, setExportingIncome] = useState(false);

  const [expFieldConfig, setExpFieldConfig] = useState<FieldConfig>(() =>
    loadConfig("charmy-exp-fields", EXPENSE_FIELDS)
  );
  const [incFieldConfig, setIncFieldConfig] = useState<FieldConfig>(() =>
    loadConfig("charmy-inc-fields", INCOME_FIELDS)
  );

  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { data: expenses = [] } = useExpenseRecords();
  const { data: income = [] } = useIncomeRecords();

  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [syncingExp, setSyncingExp] = useState<string | null>(null);
  const [syncingInc, setSyncingInc] = useState<string | null>(null);

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
  const OAUTH_FN = `${SUPABASE_URL}/functions/v1/accounting-oauth`;

  // Persist field configs
  useEffect(() => {
    localStorage.setItem("charmy-exp-fields", JSON.stringify(expFieldConfig));
  }, [expFieldConfig]);

  useEffect(() => {
    localStorage.setItem("charmy-inc-fields", JSON.stringify(incFieldConfig));
  }, [incFieldConfig]);

  const loadConnected = useCallback(async () => {
    if (!user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const params = new URLSearchParams({ action: "status" });
      if (activeWorkspace?.id) params.set("org_id", activeWorkspace.id);
      const res = await fetch(`${OAUTH_FN}?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await res.json();
      setConnectedProviders((data.integrations ?? []).map((i: any) => i.provider));
    } catch { /* silently ignore */ }
  }, [user, activeWorkspace]);

  useEffect(() => { loadConnected(); }, [loadConnected]);

  const incomeYears = useMemo(() => {
    const years = new Set<string>();
    income.forEach((r) => { if (r.invoice_date) years.add(r.invoice_date.slice(0, 4)); });
    return Array.from(years).sort().reverse();
  }, [income]);

  const expenseYears = useMemo(() => {
    const years = new Set<string>();
    expenses.forEach((r) => { if (r.invoice_date) years.add(r.invoice_date.slice(0, 4)); });
    return Array.from(years).sort().reverse();
  }, [expenses]);

  const handleExport = async () => {
    if (!user) return;
    setExporting(true);
    try {
      let records = currency === "all" ? expenses : expenses.filter((e) => e.currency === currency);
      if (expYear !== "all") records = records.filter((r) => r.invoice_date?.startsWith(expYear));
      if (expMonths.length > 0) records = records.filter((r) => expMonths.includes(r.invoice_date?.slice(5, 7) || ""));

      const activeFields = resolveFields(EXPENSE_FIELDS, expFieldConfig);
      if (activeFields.length === 0) { toast.error("Select at least one column to export."); return; }

      const headers = activeFields.map((f) => f.label);
      const rows = records.map((d) => activeFields.map((f) => f.getValue(d)));
      const fileName = buildFileName("expenses", expYear, expMonths, currency, format);

      if (format === "pdf") {
        const currencyGroups = groupByCurrency(records);
        const summaryRows = currencyGroups.flatMap((ct) => {
          const label = currencyGroups.length > 1 ? ` (${ct.currency})` : "";
          return [
            { label: `NET TOTAL${label}`,   value: fmtCurrency(ct.net, ct.currency) },
            { label: `VAT TOTAL${label}`,   value: fmtCurrency(ct.vat, ct.currency) },
            { label: `GRAND TOTAL${label}`, value: fmtCurrency(ct.total, ct.currency) },
          ];
        });
        exportToPdf({
          title: "Expense Report",
          subtitle: buildSubtitle(expYear, expMonths, currency),
          headers,
          rows,
          fileName,
          summaryRows,
        });
      } else {
        downloadCsvOrExcel(headers, rows, fileName, format as "csv" | "excel");
      }

      await supabase.from("export_history").insert({
        user_id: user.id,
        organization_id: activeWorkspace?.id || null,
        export_name: `Expenses Export`,
        export_type: "expenses",
        format,
        row_count: rows.length,
      });

      const docIds = records.filter((e) => e.document_id).map((e) => e.document_id);
      if (docIds.length > 0) await supabase.from("documents").update({ status: "exported" }).in("id", docIds);

      toast.success(`${rows.length} records exported as ${format.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportIncome = async () => {
    if (!user) return;
    setExportingIncome(true);
    try {
      let records = income;
      if (incomeCurrency !== "all") records = records.filter((r) => r.currency === incomeCurrency);
      if (incomeYear !== "all") records = records.filter((r) => r.invoice_date?.startsWith(incomeYear));
      if (incomeMonths.length > 0) records = records.filter((r) => incomeMonths.includes(r.invoice_date?.slice(5, 7) || ""));

      const activeFields = resolveFields(INCOME_FIELDS, incFieldConfig);
      if (activeFields.length === 0) { toast.error("Select at least one column to export."); return; }

      const headers = activeFields.map((f) => f.label);
      const rows = records.map((d) => activeFields.map((f) => f.getValue(d)));
      const fileName = buildFileName("income", incomeYear, incomeMonths, incomeCurrency, incomeFormat);

      if (incomeFormat === "pdf") {
        const currencyGroups = groupByCurrency(records);
        const summaryRows = currencyGroups.flatMap((ct) => {
          const label = currencyGroups.length > 1 ? ` (${ct.currency})` : "";
          return [
            { label: `NET TOTAL${label}`,   value: fmtCurrency(ct.net, ct.currency) },
            { label: `VAT TOTAL${label}`,   value: fmtCurrency(ct.vat, ct.currency) },
            { label: `GRAND TOTAL${label}`, value: fmtCurrency(ct.total, ct.currency) },
          ];
        });
        exportToPdf({
          title: "Income Report",
          subtitle: buildSubtitle(incomeYear, incomeMonths, incomeCurrency),
          headers,
          rows,
          fileName,
          summaryRows,
        });
      } else {
        downloadCsvOrExcel(headers, rows, fileName, incomeFormat as "csv" | "excel");
      }

      await supabase.from("export_history").insert({
        user_id: user.id,
        organization_id: activeWorkspace?.id || null,
        export_name: `Income Export`,
        export_type: "income",
        format: incomeFormat,
        row_count: rows.length,
      });

      const docIds = records.filter((r) => r.document_id).map((r) => r.document_id);
      if (docIds.length > 0) await supabase.from("documents").update({ status: "exported" }).in("id", docIds);

      toast.success(`${rows.length} income records exported as ${incomeFormat.toUpperCase()}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setExportingIncome(false);
    }
  };

  const handleSyncExpenses = async (provider: string) => {
    setSyncingExp(provider);
    try {
      let records = currency === "all" ? expenses : expenses.filter((e) => e.currency === currency);
      if (expYear !== "all") records = records.filter((r) => r.invoice_date?.startsWith(expYear));
      if (expMonths.length > 0) records = records.filter((r) => expMonths.includes(r.invoice_date?.slice(5, 7) || ""));
      if (records.length === 0) { toast.info("No records match the current filters."); return; }

      const { synced, errors } = await syncToAccounting(provider as any, "expenses", records, activeWorkspace?.id ?? "");
      if (errors.length > 0) toast.warning(`${synced} synced, ${errors.length} failed.`);
      else toast.success(`${synced} expense records pushed to ${provider}.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSyncingExp(null);
    }
  };

  const handleSyncIncome = async (provider: string) => {
    setSyncingInc(provider);
    try {
      let records = income;
      if (incomeCurrency !== "all") records = records.filter((r) => r.currency === incomeCurrency);
      if (incomeYear !== "all") records = records.filter((r) => r.invoice_date?.startsWith(incomeYear));
      if (incomeMonths.length > 0) records = records.filter((r) => incomeMonths.includes(r.invoice_date?.slice(5, 7) || ""));
      if (records.length === 0) { toast.info("No records match the current filters."); return; }

      const { synced, errors } = await syncToAccounting(provider as any, "income", records, activeWorkspace?.id ?? "");
      if (errors.length > 0) toast.warning(`${synced} synced, ${errors.length} failed.`);
      else toast.success(`${synced} income records pushed to ${provider}.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSyncingInc(null);
    }
  };

  const PROVIDER_LABELS: Record<string, string> = {
    quickbooks: "QuickBooks",
    xero: "Xero",
    freshbooks: "FreshBooks",
  };

  if (!user) {
    return <div className="text-center py-12 text-muted-foreground">Please log in to export data.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Export Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={expYear} onValueChange={setExpYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {expenseYears.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Months</label>
              <MonthMultiSelect selected={expMonths} onChange={setExpMonths} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <FieldSelector
            allFields={EXPENSE_FIELDS}
            config={expFieldConfig}
            onChange={setExpFieldConfig}
          />

          <Button onClick={handleExport} className="w-full" disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Export Expenses as {format.toUpperCase()}
          </Button>

          {connectedProviders.length > 0 && (
            <div className="pt-2 border-t border-border space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Sync to accounting software</p>
              <div className="flex flex-wrap gap-2">
                {connectedProviders.map((p) => (
                  <Button
                    key={p}
                    variant="outline"
                    size="sm"
                    disabled={syncingExp === p}
                    onClick={() => handleSyncExpenses(p)}
                    className="h-8 text-xs"
                  >
                    {syncingExp === p
                      ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                    Push to {PROVIDER_LABELS[p] ?? p}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {connectedProviders.length === 0 && (
            <p className="text-[11px] text-muted-foreground text-center">
              <Link to="/app/settings?tab=integrations" className="underline underline-offset-2">Connect an accounting platform</Link> to push directly to your ledger.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Export Income */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export Income</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={incomeYear} onValueChange={setIncomeYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {incomeYears.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Months</label>
              <MonthMultiSelect selected={incomeMonths} onChange={setIncomeMonths} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency</label>
              <Select value={incomeCurrency} onValueChange={setIncomeCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Currencies</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select value={incomeFormat} onValueChange={setIncomeFormat}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <FieldSelector
            allFields={INCOME_FIELDS}
            config={incFieldConfig}
            onChange={setIncFieldConfig}
          />

          <Button onClick={handleExportIncome} className="w-full" disabled={exportingIncome}>
            {exportingIncome ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Export Income as {incomeFormat.toUpperCase()}
          </Button>

          {connectedProviders.length > 0 && (
            <div className="pt-2 border-t border-border space-y-2">
              <p className="text-xs text-muted-foreground font-medium">Sync to accounting software</p>
              <div className="flex flex-wrap gap-2">
                {connectedProviders.map((p) => (
                  <Button
                    key={p}
                    variant="outline"
                    size="sm"
                    disabled={syncingInc === p}
                    onClick={() => handleSyncIncome(p)}
                    className="h-8 text-xs"
                  >
                    {syncingInc === p
                      ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
                    Push to {PROVIDER_LABELS[p] ?? p}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {connectedProviders.length === 0 && (
            <p className="text-[11px] text-muted-foreground text-center">
              <Link to="/app/settings?tab=integrations" className="underline underline-offset-2">Connect an accounting platform</Link> to push directly to your ledger.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
