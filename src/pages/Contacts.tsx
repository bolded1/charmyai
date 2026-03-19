import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Building2, Users, Search, ArrowUpRight, ArrowDownLeft,
  ChevronRight, X, Hash, Calendar,
  Banknote, ArrowLeft, UserPlus, Pencil, TrendingUp, Receipt,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useExpenseRecords, useIncomeRecords, useContacts, type ContactRecord } from "@/hooks/useDocuments";
import { AddContactDialog } from "@/components/AddContactDialog";
import { EditExpenseDialog } from "@/components/EditExpenseDialog";
import { EditIncomeDialog } from "@/components/EditIncomeDialog";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { groupByCurrency, fmtCurrencyValue, type CurrencyTotal } from "@/lib/currency-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContactType = "all" | "supplier" | "customer" | "both";

interface DerivedContact {
  id: string;
  name: string;
  type: "supplier" | "customer" | "both";
  isManual: boolean;
  vatNumber: string | null;
  email: string | null;
  phone: string | null;
  totalAmount: number;
  expenseTotals: Map<string, number>;
  incomeTotals: Map<string, number>;
  invoiceCount: number;
  currencies: string[];
  lastDate: string | null;
  categories: string[];
  expenseInvoices: any[];
  incomeInvoices: any[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function fmt(n: number, currency: string) {
  try {
    return n.toLocaleString(undefined, { style: "currency", currency, minimumFractionDigits: 2 });
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

function deriveContacts(
  expenses: any[],
  income: any[],
  manualContacts: ContactRecord[],
): DerivedContact[] {
  const map = new Map<string, DerivedContact>();

  for (const c of manualContacts) {
    const key = `contact::${c.name.toLowerCase()}`;
    map.set(key, {
      id: `manual-${slug(c.name)}`,
      name: c.name,
      type: c.type,
      isManual: true,
      vatNumber: c.vat_number,
      email: c.email,
      phone: c.phone,
      totalAmount: 0,
      expenseTotals: new Map(),
      incomeTotals: new Map(),
      invoiceCount: 0,
      currencies: [],
      lastDate: null,
      categories: [],
      expenseInvoices: [],
      incomeInvoices: [],
    });
  }

  for (const r of expenses) {
    const name = (r.supplier_name ?? "").trim();
    if (!name) continue;
    const key = `contact::${name.toLowerCase()}`;
    const existing = map.get(key);
    if (existing) {
      existing.isManual = false;
      const cur = r.currency || "EUR";
      existing.expenseTotals.set(cur, (existing.expenseTotals.get(cur) || 0) + (r.total_amount ?? 0));
      existing.totalAmount += r.total_amount ?? 0;
      existing.invoiceCount += 1;
      if (!existing.currencies.includes(cur)) existing.currencies.push(cur);
      if (r.invoice_date && (!existing.lastDate || r.invoice_date > existing.lastDate)) existing.lastDate = r.invoice_date;
      if (r.category && !existing.categories.includes(r.category)) existing.categories.push(r.category);
      if (!existing.vatNumber && r.vat_number) existing.vatNumber = r.vat_number;
      existing.expenseInvoices.push(r);
      if (existing.type === "customer") existing.type = "both";
      else if (existing.type !== "both") existing.type = "supplier";
    } else {
      const cur = r.currency || "EUR";
      const expTotals = new Map<string, number>();
      expTotals.set(cur, r.total_amount ?? 0);
      map.set(key, {
        id: `sup-${slug(name)}`,
        name,
        type: "supplier",
        isManual: false,
        vatNumber: r.vat_number ?? null,
        email: null,
        phone: null,
        totalAmount: r.total_amount ?? 0,
        expenseTotals: expTotals,
        incomeTotals: new Map(),
        invoiceCount: 1,
        currencies: cur ? [cur] : [],
        lastDate: r.invoice_date ?? null,
        categories: r.category ? [r.category] : [],
        expenseInvoices: [r],
        incomeInvoices: [],
      });
    }
  }

  for (const r of income) {
    const name = (r.customer_name ?? "").trim();
    if (!name) continue;
    const key = `contact::${name.toLowerCase()}`;
    const existing = map.get(key);
    if (existing) {
      existing.isManual = false;
      const cur = r.currency || "EUR";
      existing.incomeTotals.set(cur, (existing.incomeTotals.get(cur) || 0) + (r.total_amount ?? 0));
      existing.totalAmount += r.total_amount ?? 0;
      existing.invoiceCount += 1;
      if (!existing.currencies.includes(cur)) existing.currencies.push(cur);
      if (r.invoice_date && (!existing.lastDate || r.invoice_date > existing.lastDate)) existing.lastDate = r.invoice_date;
      if (r.category && !existing.categories.includes(r.category)) existing.categories.push(r.category);
      if (!existing.vatNumber && r.vat_number) existing.vatNumber = r.vat_number;
      existing.incomeInvoices.push(r);
      if (existing.type === "supplier") existing.type = "both";
      else if (existing.type !== "both") existing.type = "customer";
    } else {
      const cur = r.currency || "EUR";
      const incTotals = new Map<string, number>();
      incTotals.set(cur, r.total_amount ?? 0);
      map.set(key, {
        id: `cus-${slug(name)}`,
        name,
        type: "customer",
        isManual: false,
        vatNumber: r.vat_number ?? null,
        email: null,
        phone: null,
        totalAmount: r.total_amount ?? 0,
        expenseTotals: new Map(),
        incomeTotals: incTotals,
        invoiceCount: 1,
        currencies: cur ? [cur] : [],
        lastDate: r.invoice_date ?? null,
        categories: r.category ? [r.category] : [],
        expenseInvoices: [],
        incomeInvoices: [r],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
}

// ─── Badge helper ─────────────────────────────────────────────────────────────

function TypeBadge({ type, isManual }: { type: DerivedContact["type"]; isManual: boolean }) {
  if (isManual && type !== "both") {
    return (
      <Badge variant="secondary" className="text-[10px] py-0 bg-muted/80 text-muted-foreground border-border/60">
        Manual
      </Badge>
    );
  }
  if (type === "both") {
    return (
      <Badge variant="secondary" className="text-[10px] py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10">
        <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />Both
      </Badge>
    );
  }
  if (type === "supplier") {
    return (
      <Badge variant="default" className="text-[10px] py-0 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
        <ArrowDownLeft className="h-2.5 w-2.5 mr-0.5" />Supplier
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-[10px] py-0 bg-teal/10 text-teal border-teal/20 hover:bg-teal/10">
      <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />Customer
    </Badge>
  );
}

function avatarGradient(type: DerivedContact["type"]) {
  if (type === "both") return "bg-gradient-to-br from-emerald-500 to-teal-600";
  if (type === "supplier") return "bg-hero-gradient";
  return "bg-gradient-cool";
}

// ─── Contact Row (thin horizontal list item) ──────────────────────────────────

function ContactRow({ contact, onClick, i }: { contact: DerivedContact; onClick: () => void; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors"
      onClick={onClick}
    >
      {/* Avatar */}
      <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-bold text-white ${avatarGradient(contact.type)}`}>
        {contact.name.slice(0, 2).toUpperCase()}
      </div>

      {/* Name + badge */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className="text-sm font-semibold truncate">{contact.name}</span>
          <TypeBadge type={contact.type} isManual={contact.isManual} />
        </div>
        {contact.vatNumber && (
          <span className="text-[10px] text-muted-foreground font-mono">{contact.vatNumber}</span>
        )}
      </div>

      {/* Expense stat */}
      <div className="hidden sm:flex flex-col items-end gap-0 shrink-0 min-w-[88px]">
        {contact.expenseInvoices.length > 0 ? (
          <>
            <div className="flex items-center gap-1">
              <ArrowDownLeft className="h-3 w-3 text-rose-500" />
              <span className="text-xs font-semibold tabular-nums text-rose-600">{fmtTotalsInline(contact.expenseTotals)}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{contact.expenseInvoices.length} exp inv</span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </div>

      {/* Income stat */}
      <div className="hidden sm:flex flex-col items-end gap-0 shrink-0 min-w-[88px]">
        {contact.incomeInvoices.length > 0 ? (
          <>
            <div className="flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              <span className="text-xs font-semibold tabular-nums text-emerald-600">{fmtTotalsInline(contact.incomeTotals)}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{contact.incomeInvoices.length} inc inv</span>
          </>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </div>

      {/* Last date */}
      {contact.lastDate && (
        <span className="hidden lg:block text-[10px] text-muted-foreground shrink-0 min-w-[68px] text-right">
          {format(parseISO(contact.lastDate), "dd MMM yyyy")}
        </span>
      )}

      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
    </motion.div>
  );
}

// ─── Month grouping helper ────────────────────────────────────────────────────

function groupByMonth(records: any[]) {
  const map = new Map<string, any[]>();
  const sorted = [...records].sort((a, b) => {
    const da = a.invoice_date ? new Date(a.invoice_date).getTime() : 0;
    const db = b.invoice_date ? new Date(b.invoice_date).getTime() : 0;
    return db - da;
  });
  sorted.forEach((r) => {
    const key = r.invoice_date ? format(parseISO(r.invoice_date), "yyyy-MM") : "no-date";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  });
  return Array.from(map.entries()).map(([key, recs]) => ({
    key,
    label: key === "no-date" ? "No Date" : format(parseISO(key + "-01"), "MMMM yyyy"),
    records: recs,
    currencyTotals: groupByCurrency(recs),
  }));
}

function fmtTotalsInline(totals: Map<string, number>): string {
  return Array.from(totals.entries())
    .filter(([, v]) => v > 0)
    .map(([cur, v]) => fmtCurrencyValue(v, cur))
    .join(" · ") || "—";
}

// ─── Invoice Row ──────────────────────────────────────────────────────────────

function InvoiceRow({ r, onEdit }: { r: any; onEdit: (r: any) => void }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer"
      onClick={() => onEdit(r)}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground truncate">
          {r.invoice_number ?? "No number"}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {r.invoice_date ? format(parseISO(r.invoice_date), "dd MMM yyyy") : "—"}
          {r.category ? ` · ${r.category}` : ""}
        </p>
      </div>
      <div className="text-right shrink-0 min-w-[72px]">
        <p className="text-xs font-bold text-foreground tabular-nums">
          {fmt(r.total_amount ?? 0, r.currency)}
        </p>
        {r.due_date && (
          <p className="text-[10px] text-muted-foreground">Due {format(parseISO(r.due_date), "dd MMM")}</p>
        )}
      </div>
      <button
        className="h-6 w-6 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        onClick={(e) => { e.stopPropagation(); onEdit(r); }}
        title="Edit invoice"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function ContactDetail({ contact, onClose }: { contact: DerivedContact; onClose: () => void }) {
  const [editingExpense, setEditingExpense] = useState<any | null>(null);
  const [editingIncome, setEditingIncome] = useState<any | null>(null);

  const expenseGroups = groupByMonth(contact.expenseInvoices);
  const incomeGroups  = groupByMonth(contact.incomeInvoices);

  // Compute per-currency net balance (only for currencies that appear in both)
  const allCurrencies = new Set([...contact.expenseTotals.keys(), ...contact.incomeTotals.keys()]);
  const netBalances = new Map<string, number>();
  allCurrencies.forEach((cur) => {
    const inc = contact.incomeTotals.get(cur) || 0;
    const exp = contact.expenseTotals.get(cur) || 0;
    netBalances.set(cur, inc - exp);
  });

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 text-sm font-bold text-white ${avatarGradient(contact.type)}`}>
          {contact.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-foreground truncate">{contact.name}</h2>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <TypeBadge type={contact.type} isManual={contact.isManual} />
            {contact.email && <span className="text-[10px] text-muted-foreground">{contact.email}</span>}
            {contact.phone && <span className="text-[10px] text-muted-foreground">{contact.phone}</span>}
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownLeft className="h-3.5 w-3.5 text-rose-500" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Expenses</span>
            </div>
            <p className="font-bold text-sm tabular-nums text-rose-600">
              {contact.expenseInvoices.length === 0 ? "—" : fmtTotalsInline(contact.expenseTotals)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {contact.expenseInvoices.length} invoice{contact.expenseInvoices.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Income</span>
            </div>
            <p className="font-bold text-sm tabular-nums text-emerald-600">
              {contact.incomeInvoices.length === 0 ? "—" : fmtTotalsInline(contact.incomeTotals)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {contact.incomeInvoices.length} invoice{contact.incomeInvoices.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        {/* Net balance — only for "both" contacts */}
        {contact.type === "both" && (
          <Card className="col-span-2">
            <CardContent className="p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Net Balance</span>
              </div>
              <div className="space-y-0.5">
                {Array.from(netBalances.entries()).map(([cur, bal]) => (
                  <p key={cur} className={`font-bold text-sm tabular-nums ${bal >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {fmtCurrencyValue(Math.abs(bal), cur)}
                    <span className="text-[10px] font-normal text-muted-foreground ml-1.5">
                      {bal >= 0 ? "net income" : "net expense"}
                    </span>
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Meta info */}
      <div className="space-y-1 mb-4">
        {contact.vatNumber && (
          <div className="flex items-center gap-2">
            <Hash className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground text-xs">VAT:</span>
            <span className="font-mono font-medium text-foreground text-xs">{contact.vatNumber}</span>
          </div>
        )}
        {contact.currencies.length > 0 && (
          <div className="flex items-center gap-2">
            <Banknote className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground text-xs">Currencies:</span>
            <span className="font-medium text-foreground text-xs">{contact.currencies.join(", ")}</span>
          </div>
        )}
        {contact.lastDate && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground text-xs">Last invoice:</span>
            <span className="font-medium text-foreground text-xs">{format(parseISO(contact.lastDate), "dd MMM yyyy")}</span>
          </div>
        )}
        {contact.categories.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {contact.categories.map((cat) => (
              <Badge key={cat} variant="secondary" className="text-[10px] py-0">{cat}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Invoice tabs */}
      {contact.invoiceCount === 0 ? (
        <div className="flex flex-col items-center py-8 text-center text-muted-foreground">
          <Receipt className="h-9 w-9 mb-2 opacity-25" />
          <p className="text-sm font-medium">No invoices linked yet</p>
          <p className="text-[11px] mt-1 max-w-[220px]">
            Upload invoices mentioning this contact to link them automatically.
          </p>
        </div>
      ) : (
        <Tabs defaultValue="expenses">
          <TabsList className="h-8 mb-3 w-full">
            <TabsTrigger value="expenses" className="text-xs flex-1">
              Expenses ({contact.expenseInvoices.length})
            </TabsTrigger>
            <TabsTrigger value="income" className="text-xs flex-1">
              Income ({contact.incomeInvoices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expenses" className="mt-0">
            <div className="overflow-auto max-h-[400px] pr-1 scrollbar-thin space-y-3">
              {expenseGroups.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No expense invoices</p>
              ) : expenseGroups.map((group) => (
                <div key={group.key}>
                  <div className="flex items-center justify-between px-3 py-1.5 bg-accent/30 rounded-lg mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">{group.label}</span>
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {group.records.length} · {group.currencyTotals.map((ct) => fmtCurrencyValue(ct.total, ct.currency)).join(" · ")}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {group.records.map((r) => (
                      <InvoiceRow key={r.id} r={r} onEdit={() => setEditingExpense(r)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="income" className="mt-0">
            <div className="overflow-auto max-h-[400px] pr-1 scrollbar-thin space-y-3">
              {incomeGroups.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No income invoices</p>
              ) : incomeGroups.map((group) => (
                <div key={group.key}>
                  <div className="flex items-center justify-between px-3 py-1.5 bg-accent/30 rounded-lg mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">{group.label}</span>
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {group.records.length} · {group.currencyTotals.map((ct) => fmtCurrencyValue(ct.total, ct.currency)).join(" · ")}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {group.records.map((r) => (
                      <InvoiceRow key={r.id} r={r} onEdit={() => setEditingIncome(r)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Edit dialogs */}
      <EditExpenseDialog
        record={editingExpense}
        open={!!editingExpense}
        onOpenChange={(o) => { if (!o) setEditingExpense(null); }}
      />
      <EditIncomeDialog
        record={editingIncome}
        open={!!editingIncome}
        onOpenChange={(o) => { if (!o) setEditingIncome(null); }}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Contacts() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ContactType>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const { data: rawExpenses = [], isLoading: expLoading } = useExpenseRecords();
  const { data: rawIncome   = [], isLoading: incLoading } = useIncomeRecords();
  const { data: manualContacts = [], isLoading: contactsLoading } = useContacts();
  const isLoading = expLoading || incLoading || contactsLoading;

  const contacts = useMemo(
    () => deriveContacts(rawExpenses, rawIncome, manualContacts),
    [rawExpenses, rawIncome, manualContacts]
  );

  // Always look up selected contact live so edits are reflected immediately
  const selected = selectedId ? (contacts.find((c) => c.id === selectedId) ?? null) : null;

  const filtered = useMemo(() => {
    let list = contacts;
    if (filter !== "all") list = list.filter((c) => c.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.vatNumber ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q) ||
        c.categories.some((cat) => cat.toLowerCase().includes(q))
      );
    }
    return list;
  }, [contacts, filter, search]);

  const supplierCount = contacts.filter((c) => c.type === "supplier").length;
  const customerCount = contacts.filter((c) => c.type === "customer").length;
  const bothCount     = contacts.filter((c) => c.type === "both").length;

  const FILTERS: { key: ContactType; label: string; icon: typeof Building2; count: number }[] = [
    { key: "all",      label: "All",       icon: Users,        count: contacts.length },
    { key: "supplier", label: "Suppliers", icon: ArrowDownLeft, count: supplierCount },
    { key: "customer", label: "Customers", icon: ArrowUpRight,  count: customerCount },
    { key: "both",     label: "Both",      icon: ArrowUpRight,  count: bothCount },
  ];

  return (
    <>
      <AddContactDialog open={addOpen} onOpenChange={setAddOpen} />

      <div className="max-w-5xl mx-auto pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-start justify-between gap-3 mb-6"
        >
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold">Contacts</h1>
            <p className="text-sm text-muted-foreground">
              Suppliers and customers auto-built from your invoice data
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 gap-2"
            onClick={() => setAddOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Add Contact
          </Button>
        </motion.div>

        <div className="space-y-4">
            {/* Search + filters */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search contacts, VAT, email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Filter pills */}
              <div className="flex items-center gap-1 bg-muted/60 rounded-full p-1 shrink-0">
                {FILTERS.map(({ key, label, icon: Icon, count }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                      filter === key
                        ? "bg-card shadow text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                    <span className={`text-[10px] ${filter === key ? "text-primary font-bold" : "text-muted-foreground"}`}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Stat bar */}
            {!isLoading && contacts.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
                className="grid grid-cols-3 gap-3"
              >
                {[
                  { label: "Total Contacts", value: contacts.length,              icon: Users,        color: "text-primary" },
                  { label: "Suppliers",      value: supplierCount + bothCount,    icon: ArrowDownLeft, color: "text-rose-500" },
                  { label: "Customers",      value: customerCount + bothCount,    icon: ArrowUpRight,  color: "text-emerald-500" },
                ].map(({ label, value, icon: Icon, color }) => (
                  <Card key={label}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                        <p className="text-lg font-bold text-foreground">{value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            )}

            {/* Contact list */}
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
              </div>
            ) : filtered.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Building2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-semibold text-foreground mb-1">
                    {contacts.length === 0 ? "No contacts yet" : "No results"}
                  </p>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    {contacts.length === 0
                      ? "Upload invoices or add a contact manually using the button above."
                      : "Try a different search or filter."}
                  </p>
                  {contacts.length === 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-4 gap-2"
                      onClick={() => setAddOpen(true)}
                    >
                      <UserPlus className="h-4 w-4" />
                      Add Contact
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden p-0">
                <div className="divide-y divide-border/40">
                  {filtered.map((contact, i) => (
                    <ContactRow
                      key={contact.id}
                      contact={contact}
                      i={i}
                      onClick={() => setSelectedId(contact.id)}
                    />
                  ))}
                </div>
              </Card>
            )}
        </div>

        {/* Contact detail popup */}
        <Dialog open={!!selectedId} onOpenChange={(o) => { if (!o) setSelectedId(null); }}>
          <DialogContent className="max-w-lg w-full max-h-[85vh] overflow-y-auto">
            {selected && (
              <ContactDetail contact={selected} onClose={() => setSelectedId(null)} />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
