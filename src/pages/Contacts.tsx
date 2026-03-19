import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Users, Search, ArrowUpRight, ArrowDownLeft,
  Receipt, TrendingUp, ChevronRight, X, Hash, Calendar,
  Banknote, ArrowLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useExpenseRecords, useIncomeRecords } from "@/hooks/useDocuments";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

type ContactType = "all" | "supplier" | "customer";

interface DerivedContact {
  id: string;                   // slugified name
  name: string;
  type: "supplier" | "customer";
  vatNumber: string | null;
  totalAmount: number;
  invoiceCount: number;
  currencies: string[];
  lastDate: string | null;      // ISO date of most recent invoice
  categories: string[];
  invoices: any[];              // raw records
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function fmt(n: number, currency: string) {
  return n.toLocaleString(undefined, { style: "currency", currency, minimumFractionDigits: 2 });
}

function deriveContacts(
  expenses: any[],
  income: any[],
): DerivedContact[] {
  const map = new Map<string, DerivedContact>();

  // Suppliers from expense_records
  for (const r of expenses) {
    const name = (r.supplier_name ?? "").trim();
    if (!name) continue;
    const key = `supplier::${name.toLowerCase()}`;
    const existing = map.get(key);
    if (existing) {
      existing.totalAmount += r.total_amount ?? 0;
      existing.invoiceCount += 1;
      if (!existing.currencies.includes(r.currency)) existing.currencies.push(r.currency);
      if (r.invoice_date && (!existing.lastDate || r.invoice_date > existing.lastDate)) existing.lastDate = r.invoice_date;
      if (r.category && !existing.categories.includes(r.category)) existing.categories.push(r.category);
      if (!existing.vatNumber && r.vat_number) existing.vatNumber = r.vat_number;
      existing.invoices.push(r);
    } else {
      map.set(key, {
        id: `sup-${slug(name)}`,
        name,
        type: "supplier",
        vatNumber: r.vat_number ?? null,
        totalAmount: r.total_amount ?? 0,
        invoiceCount: 1,
        currencies: r.currency ? [r.currency] : [],
        lastDate: r.invoice_date ?? null,
        categories: r.category ? [r.category] : [],
        invoices: [r],
      });
    }
  }

  // Customers from income_records
  for (const r of income) {
    const name = (r.customer_name ?? "").trim();
    if (!name) continue;
    const key = `customer::${name.toLowerCase()}`;
    const existing = map.get(key);
    if (existing) {
      existing.totalAmount += r.total_amount ?? 0;
      existing.invoiceCount += 1;
      if (!existing.currencies.includes(r.currency)) existing.currencies.push(r.currency);
      if (r.invoice_date && (!existing.lastDate || r.invoice_date > existing.lastDate)) existing.lastDate = r.invoice_date;
      if (r.category && !existing.categories.includes(r.category)) existing.categories.push(r.category);
      if (!existing.vatNumber && r.vat_number) existing.vatNumber = r.vat_number;
      existing.invoices.push(r);
    } else {
      map.set(key, {
        id: `cus-${slug(name)}`,
        name,
        type: "customer",
        vatNumber: r.vat_number ?? null,
        totalAmount: r.total_amount ?? 0,
        invoiceCount: 1,
        currencies: r.currency ? [r.currency] : [],
        lastDate: r.invoice_date ?? null,
        categories: r.category ? [r.category] : [],
        invoices: [r],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
}

// ─── Contact Card ─────────────────────────────────────────────────────────────

function ContactCard({ contact, onClick, i }: { contact: DerivedContact; onClick: () => void; i: number }) {
  const isSupplier = contact.type === "supplier";
  const primaryCurrency = contact.currencies[0] ?? "EUR";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card
        className="cursor-pointer hover:-translate-y-0.5 transition-all duration-200"
        onClick={onClick}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            {/* Avatar + name */}
            <div className="flex items-center gap-3 min-w-0">
              <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 text-sm font-bold text-white ${isSupplier ? "bg-hero-gradient" : "bg-gradient-cool"}`}>
                {contact.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{contact.name}</p>
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <Badge variant={isSupplier ? "default" : "secondary"} className={`text-[10px] py-0 ${isSupplier ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/10" : "bg-teal/10 text-teal border-teal/20 hover:bg-teal/10"}`}>
                    {isSupplier ? (
                      <><ArrowDownLeft className="h-2.5 w-2.5 mr-0.5" />Supplier</>
                    ) : (
                      <><ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />Customer</>
                    )}
                  </Badge>
                  {contact.vatNumber && (
                    <span className="text-[10px] text-muted-foreground font-mono">{contact.vatNumber}</span>
                  )}
                </div>
              </div>
            </div>

            <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-1" />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/40">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Total</p>
              <p className="text-sm font-bold text-foreground tabular-nums">{fmt(contact.totalAmount, primaryCurrency)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Invoices</p>
              <p className="text-sm font-bold text-foreground">{contact.invoiceCount}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Last Invoice</p>
              <p className="text-sm font-semibold text-foreground">
                {contact.lastDate ? format(parseISO(contact.lastDate), "dd MMM yy") : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function ContactDetail({ contact, onClose }: { contact: DerivedContact; onClose: () => void }) {
  const isSupplier = contact.type === "supplier";
  const primaryCurrency = contact.currencies[0] ?? "EUR";
  const netTotal   = contact.invoices.reduce((s, r) => s + (r.net_amount   ?? 0), 0);
  const vatTotal   = contact.invoices.reduce((s, r) => s + (r.vat_amount   ?? 0), 0);
  const totalSpend = contact.invoices.reduce((s, r) => s + (r.total_amount ?? 0), 0);

  const sorted = [...contact.invoices].sort((a, b) =>
    (b.invoice_date ?? "").localeCompare(a.invoice_date ?? "")
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 text-sm font-bold text-white ${isSupplier ? "bg-hero-gradient" : "bg-gradient-cool"}`}>
          {contact.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-foreground truncate">{contact.name}</h2>
          <Badge variant="secondary" className={`text-[10px] py-0 mt-0.5 ${isSupplier ? "bg-primary/10 text-primary border-primary/20" : "bg-teal/10 text-teal border-teal/20"}`}>
            {isSupplier ? "Supplier" : "Customer"}
          </Badge>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: isSupplier ? "Total Spent" : "Total Received", value: fmt(totalSpend, primaryCurrency), icon: Banknote, color: isSupplier ? "text-rose" : "text-success" },
          { label: "Invoices",      value: String(contact.invoiceCount), icon: Receipt, color: "text-primary" },
          { label: "Net Amount",    value: fmt(netTotal, primaryCurrency), icon: Banknote, color: "text-foreground" },
          { label: "VAT Total",     value: fmt(vatTotal, primaryCurrency), icon: Hash, color: "text-amber" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-3.5">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-3.5 w-3.5 ${color}`} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
              </div>
              <p className="font-bold text-sm text-foreground tabular-nums">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Meta info */}
      <div className="space-y-1.5 mb-5">
        {contact.vatNumber && (
          <div className="flex items-center gap-2 text-sm">
            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">VAT:</span>
            <span className="font-mono font-medium text-foreground">{contact.vatNumber}</span>
          </div>
        )}
        {contact.currencies.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Currencies:</span>
            <span className="font-medium text-foreground">{contact.currencies.join(", ")}</span>
          </div>
        )}
        {contact.categories.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <Receipt className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
            <span className="text-muted-foreground">Categories:</span>
            <span className="font-medium text-foreground">{contact.categories.join(", ")}</span>
          </div>
        )}
        {contact.lastDate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Last invoice:</span>
            <span className="font-medium text-foreground">{format(parseISO(contact.lastDate), "dd MMM yyyy")}</span>
          </div>
        )}
      </div>

      {/* Invoice list */}
      <div className="flex-1 min-h-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/60 mb-3">
          All {isSupplier ? "Expense" : "Income"} Records
        </p>
        <div className="space-y-2 overflow-auto max-h-[340px] pr-1 scrollbar-thin">
          {sorted.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {r.invoice_number ?? "No number"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {r.invoice_date ? format(parseISO(r.invoice_date), "dd MMM yyyy") : "—"}
                  {r.category ? ` · ${r.category}` : ""}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-foreground tabular-nums">
                  {fmt(r.total_amount ?? 0, r.currency)}
                </p>
                {r.due_date && (
                  <p className="text-[10px] text-muted-foreground">Due {format(parseISO(r.due_date), "dd MMM")}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Contacts() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ContactType>("all");
  const [selected, setSelected] = useState<DerivedContact | null>(null);

  const { data: rawExpenses = [], isLoading: expLoading } = useExpenseRecords();
  const { data: rawIncome   = [], isLoading: incLoading } = useIncomeRecords();
  const isLoading = expLoading || incLoading;

  const contacts = useMemo(() => deriveContacts(rawExpenses, rawIncome), [rawExpenses, rawIncome]);

  const filtered = useMemo(() => {
    let list = contacts;
    if (filter !== "all") list = list.filter((c) => c.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.vatNumber ?? "").toLowerCase().includes(q) ||
        c.categories.some((cat) => cat.toLowerCase().includes(q))
      );
    }
    return list;
  }, [contacts, filter, search]);

  const supplierCount = contacts.filter((c) => c.type === "supplier").length;
  const customerCount = contacts.filter((c) => c.type === "customer").length;

  const FILTERS: { key: ContactType; label: string; icon: typeof Building2; count: number }[] = [
    { key: "all",      label: "All",       icon: Users,     count: contacts.length },
    { key: "supplier", label: "Suppliers", icon: ArrowDownLeft, count: supplierCount },
    { key: "customer", label: "Customers", icon: ArrowUpRight,  count: customerCount },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col gap-1 mb-6"
      >
        <h1 className="text-2xl font-bold">Contacts</h1>
        <p className="text-sm text-muted-foreground">
          Suppliers and customers auto-built from your invoice data
        </p>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left column — list */}
        <div className="flex-1 min-w-0 space-y-4">
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
                placeholder="Search contacts or VAT number…"
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
                { label: "Total Contacts", value: contacts.length, icon: Users, color: "text-primary" },
                { label: "Suppliers",      value: supplierCount,   icon: ArrowDownLeft, color: "text-rose" },
                { label: "Customers",      value: customerCount,   icon: ArrowUpRight,  color: "text-success" },
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
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
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
                    ? "Upload invoices or receipts and your suppliers and customers will appear here automatically."
                    : "Try a different search or filter."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {filtered.map((contact, i) => (
                <ContactCard
                  key={contact.id}
                  contact={contact}
                  i={i}
                  onClick={() => setSelected(contact)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right column — detail panel (desktop) */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 360 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block shrink-0 overflow-hidden"
            >
              <div style={{ width: 360 }}>
                <Card className="h-full">
                  <CardContent className="p-5 h-full">
                    <ContactDetail contact={selected} onClose={() => setSelected(null)} />
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile detail — full-screen overlay */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden fixed inset-0 z-50 bg-background p-4 pt-6 overflow-auto"
          >
            <ContactDetail contact={selected} onClose={() => setSelected(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
