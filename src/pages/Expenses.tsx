import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Receipt, Loader2, CalendarIcon, X, Pencil, FileText, Trash2, Archive, Plus, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useState, useMemo, useEffect, Fragment } from "react";
import { useExpenseRecords, useDeleteExpense } from "@/hooks/useDocuments";
import { EditExpenseDialog } from "@/components/EditExpenseDialog";
import { useExpenseCategories } from "@/hooks/useExpenseCategories";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";

import { useBulkDownload } from "@/hooks/useBulkDownload";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, parseISO, isPast, isValid } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ManualExpenseDialog } from "@/components/ManualExpenseDialog";
import { useNavigate } from "react-router-dom";
import { groupByCurrency, fmtCurrencyValue } from "@/lib/currency-utils";

type DatePreset = "all" | "this_month" | "last_month" | "this_quarter" | "this_year" | "last_year" | "custom";

export default function ExpensesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [sortField, setSortField] = useState<"supplier_name" | "invoice_date" | "total_amount" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const { data: expenses = [], isLoading } = useExpenseRecords();
  const deleteExpense = useDeleteExpense();
  const { data: expenseCategories = [] } = useExpenseCategories();
  const categoryColorMap = useMemo(
    () => Object.fromEntries(expenseCategories.map((c) => [c.name, c.color])),
    [expenseCategories]
  );
  const { downloadAsZip, downloading } = useBulkDownload();
  const { data: org } = useOrganization();
  const defaultCurrency = org?.default_currency || "EUR";
  const isOnline = useOnlineStatus();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

  const selectedExpense = expenses.find((e) => e.id === selectedId);

  const openEdit = (expense: typeof expenses[0]) => setSelectedId(expense.id);
  const closeEdit = () => setSelectedId(null);

  // Date range logic
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (datePreset) {
      case "this_month": return { from: startOfMonth(now), to: endOfMonth(now) };
      case "last_month": { const l = new Date(now.getFullYear(), now.getMonth() - 1, 1); return { from: startOfMonth(l), to: endOfMonth(l) }; }
      case "this_quarter": return { from: startOfQuarter(now), to: endOfQuarter(now) };
      case "this_year": return { from: startOfYear(now), to: endOfYear(now) };
      case "last_year": { const ly = new Date(now.getFullYear() - 1, 0, 1); return { from: startOfYear(ly), to: endOfYear(ly) }; }
      case "custom": return { from: dateFrom, to: dateTo };
      default: return { from: undefined, to: undefined };
    }
  }, [datePreset, dateFrom, dateTo]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => { if (e.category) set.add(e.category); });
    return Array.from(set).sort();
  }, [expenses]);

  const filtered = useMemo(() => {
    return expenses.filter((d) => {
      const matchesSearch =
        (d.supplier_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (d.invoice_number || "").toLowerCase().includes(search.toLowerCase());
      const matchesCurrency = currencyFilter === "all" || d.currency === currencyFilter;
      const matchesCategory = categoryFilter === "all" || (d.category || "") === categoryFilter;
      let matchesDate = true;
      if (dateRange.from || dateRange.to) {
        const docDate = d.invoice_date ? new Date(d.invoice_date) : null;
        if (!docDate) matchesDate = false;
        else {
          if (dateRange.from && docDate < dateRange.from) matchesDate = false;
          if (dateRange.to && docDate > dateRange.to) matchesDate = false;
        }
      }
      return matchesSearch && matchesCurrency && matchesCategory && matchesDate;
    });
  }, [expenses, search, currencyFilter, categoryFilter, dateRange]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "total_amount" ? "desc" : "asc");
    }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-30" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  const sortedFiltered = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "supplier_name") {
        cmp = (a.supplier_name || "").localeCompare(b.supplier_name || "");
      } else if (sortField === "invoice_date") {
        cmp = (a.invoice_date || "").localeCompare(b.invoice_date || "");
      } else if (sortField === "total_amount") {
        cmp = (Number(a.total_amount) || 0) - (Number(b.total_amount) || 0);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectableCount = filtered.length;

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((e) => e.id)));
    }
  };

  const handleBulkDownload = async () => {
    const docIds = filtered
      .filter((e) => selectedIds.has(e.id) && e.document_id)
      .map((e) => e.document_id as string);
    if (docIds.length === 0) {
      toast.error("No downloadable documents in selection");
      return;
    }
    await downloadAsZip(docIds, "expenses-invoices");
    toast.success(`${docIds.length} document(s) downloaded`);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        await deleteExpense.mutateAsync(id);
      }
      toast.success(`${ids.length} expense(s) deleted`);
      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);
    } catch {
      toast.error("Some expenses could not be deleted. Please try again.");
      setBulkDeleteConfirm(false);
    } finally {
      setBulkDeleting(false);
    }
  };

  const displayFiltered = sortField ? sortedFiltered : filtered;
  const totalPages = Math.max(1, Math.ceil(displayFiltered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedFiltered = useMemo(() => displayFiltered.slice((safePage - 1) * pageSize, safePage * pageSize), [displayFiltered, safePage, pageSize]);

  const groupedByMonth = useMemo(() => {
    const groups: { key: string; label: string; records: typeof filtered; currencyTotals: ReturnType<typeof groupByCurrency> }[] = [];
    const map = new Map<string, typeof filtered>();

    // When sorting is active, show flat list instead of month groups
    if (sortField) {
      if (paginatedFiltered.length > 0) {
        groups.push({
          key: "sorted",
          label: `Sorted by ${sortField === "supplier_name" ? "Supplier" : sortField === "invoice_date" ? "Date" : "Amount"}`,
          records: paginatedFiltered,
          currencyTotals: groupByCurrency(paginatedFiltered, defaultCurrency),
        });
      }
      return groups;
    }

    // Sort by date descending
    const sorted = [...paginatedFiltered].sort((a, b) => {
      const da = a.invoice_date ? new Date(a.invoice_date).getTime() : 0;
      const db = b.invoice_date ? new Date(b.invoice_date).getTime() : 0;
      return db - da;
    });

    sorted.forEach((record) => {
      const key = record.invoice_date
        ? format(parseISO(record.invoice_date), "yyyy-MM")
        : "no-date";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(record);
    });

    map.forEach((records, key) => {
      const label = key === "no-date" ? "No Date" : format(parseISO(key + "-01"), "MMMM yyyy");
      groups.push({ key, label, records, currencyTotals: groupByCurrency(records, defaultCurrency) });
    });

    return groups;
  }, [paginatedFiltered, defaultCurrency, sortField]);

  const currencySummary = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    filtered.forEach((e) => {
      const c = e.currency || defaultCurrency;
      const prev = map.get(c) || { total: 0, count: 0 };
      map.set(c, { total: prev.total + (Number(e.total_amount) || 0), count: prev.count + 1 });
    });
    return Array.from(map.entries())
      .filter(([, data]) => data.count > 0)
      .sort((a, b) => {
        if (a[0] === defaultCurrency) return -1;
        if (b[0] === defaultCurrency) return 1;
        return b[1].total - a[1].total;
      })
      .map(([currency, data]) => ({ currency, ...data }));
  }, [filtered, defaultCurrency]);


  // Reset page when any filter changes
  const prevFilterKey = `${search}|${currencyFilter}|${categoryFilter}|${datePreset}|${dateFrom}|${dateTo}`;
  useEffect(() => { setCurrentPage(1); }, [prevFilterKey]);

  const toggleMonthSelect = (groupRecordIds: string[]) => {
    const allSelected = groupRecordIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      groupRecordIds.forEach((id) => { if (allSelected) next.delete(id); else next.add(id); });
      return next;
    });
  };

  const clearDateFilter = () => { setDatePreset("all"); setDateFrom(undefined); setDateTo(undefined); };

  if (!user) return <div className="text-center py-12 text-muted-foreground">Please log in to view expenses.</div>;

  const activeDateLabel = datePreset !== "all"
    ? datePreset === "custom"
      ? `${dateFrom ? format(dateFrom, "dd/MM/yyyy") : "..."} – ${dateTo ? format(dateTo, "dd/MM/yyyy") : "..."}`
      : datePreset.replace("_", " ")
    : null;

  return (
    <div className="max-w-6xl space-y-4 md:space-y-6">

      {/* Filters row */}
      <div className="space-y-2 md:space-y-0 md:flex md:flex-wrap md:items-center md:gap-3">
        {/* Search + Add button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0 md:min-w-[180px] md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input aria-label="Search expenses" placeholder="Search expenses..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button size="sm" onClick={() => setManualEntryOpen(true)} className="shrink-0 h-9" disabled={!isOnline}>
            <Plus className="h-4 w-4 mr-1" /> Expense
          </Button>
        </div>
        {/* Filter chips row — horizontal scroll on mobile */}
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-none">
          <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
            <SelectTrigger className="w-auto min-w-[120px] h-9 text-xs shrink-0">
              <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {datePreset === "custom" && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-[110px] justify-start text-left text-xs h-9 shrink-0", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {dateFrom ? format(dateFrom, "dd/MM/yy") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} disabled={dateTo ? { after: dateTo } : undefined} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("w-[110px] justify-start text-left text-xs h-9 shrink-0", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    {dateTo ? format(dateTo, "dd/MM/yy") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} disabled={dateFrom ? { before: dateFrom } : undefined} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </>
          )}
          <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
            <SelectTrigger className="w-auto min-w-[80px] h-9 text-xs shrink-0">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-auto min-w-[110px] h-9 text-xs shrink-0">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(datePreset !== "all" || currencyFilter !== "all" || categoryFilter !== "all" || search) && (
            <Button variant="ghost" size="sm" className="text-xs h-9 shrink-0" onClick={() => { clearDateFilter(); setCurrencyFilter("all"); setCategoryFilter("all"); setSearch(""); }}>
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Table / Cards */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            expenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Receipt className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-base mb-1">No expenses yet</h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-xs">
                  Upload an invoice to extract data automatically, or add a manual expense like mileage or a cash purchase.
                </p>
                <div className="flex gap-2 flex-wrap justify-center">
                  <Button size="sm" variant="outline" onClick={() => navigate("/app/documents")}>
                    <FileText className="h-4 w-4 mr-1" /> Upload Invoice
                  </Button>
                  <Button size="sm" onClick={() => setManualEntryOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" /> Add Manual Expense
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <p className="text-sm text-muted-foreground">No results for the selected filters.</p>
                <p className="text-xs text-muted-foreground/70">
                  Active:{" "}
                  {[
                    search && `search "${search}"`,
                    currencyFilter !== "all" && `currency ${currencyFilter}`,
                    categoryFilter !== "all" && `category "${categoryFilter}"`,
                    datePreset !== "all" && `date: ${activeDateLabel}`,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <Button variant="link" size="sm" className="h-auto p-0 text-sm" onClick={() => { clearDateFilter(); setCurrencyFilter("all"); setCategoryFilter("all"); setSearch(""); }}>
                  Clear all filters
                </Button>
              </div>
            )
          ) : isMobile ? (
            <div className="divide-y divide-border">
              {groupedByMonth.map((group) => (
                <div key={group.key}>
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/50 sticky top-0 z-10">
                    <span className="text-[11px] font-bold text-foreground uppercase tracking-wide">{group.label}</span>
                    <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                      {group.records.length} · {group.currencyTotals.map((ct) => fmtCurrencyValue(ct.total, ct.currency)).join(" · ")}
                    </span>
                  </div>
                  <div className="divide-y divide-border/50">
                    {group.records.map((doc) => (
                      <div
                        key={doc.id}
                        className={cn(
                          "flex items-center gap-2.5 px-3 py-2.5 active:bg-accent/60 transition-colors",
                          selectedIds.has(doc.id) && "bg-primary/5"
                        )}
                      >
                        <Checkbox
                          checked={selectedIds.has(doc.id)}
                          onCheckedChange={() => toggleSelect(doc.id)}
                          className="shrink-0"
                        />
                        <div className="flex-1 min-w-0" onClick={() => openEdit(doc)}>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium truncate" title={doc.supplier_name}>{doc.supplier_name}</span>
                            <span className="text-sm font-semibold tabular-nums shrink-0">
                              {fmtCurrencyValue(Number(doc.total_amount) || 0, doc.currency || defaultCurrency)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-muted-foreground">{doc.invoice_date ? format(parseISO(doc.invoice_date), "dd MMM yyyy") : "—"}</span>
                            {doc.category && (() => {
                              const color = categoryColorMap[doc.category];
                              return (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] h-4 px-1.5 font-normal"
                                  style={color ? { background: `${color}20`, color, borderColor: `${color}40` } : undefined}
                                >
                                  {doc.category}
                                </Badge>
                              );
                            })()}
                            {!doc.document_id && (
                              <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:bg-amber-950/30">
                                {doc.category === "Mileage" ? "Mileage" : doc.category === "Per Diem" ? "Per Diem" : "Manual"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                 <tr className="border-b border-border">
                    <th className="pl-4 pr-1 w-10">
                      <Checkbox
                        checked={selectedIds.size > 0 && selectedIds.size < selectableCount ? "indeterminate" : selectableCount > 0 && selectedIds.size === selectableCount}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="p-4 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("supplier_name")} aria-sort={sortField === "supplier_name" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                      <span className="flex items-center">Supplier<SortIcon field="supplier_name" /></span>
                    </th>
                    <th className="p-4 text-left text-xs font-medium text-muted-foreground">Invoice #</th>
                    <th className="p-4 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("invoice_date")} aria-sort={sortField === "invoice_date" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                      <span className="flex items-center">Date<SortIcon field="invoice_date" /></span>
                    </th>
                    <th className="p-4 text-left text-xs font-medium text-muted-foreground">Category</th>
                    <th className="p-4 text-left text-xs font-medium text-muted-foreground">Currency</th>
                    <th className="p-4 text-right text-xs font-medium text-muted-foreground">Net</th>
                    <th className="p-4 text-right text-xs font-medium text-muted-foreground">VAT</th>
                    <th className="p-4 text-right text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort("total_amount")} aria-sort={sortField === "total_amount" ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                      <span className="flex items-center justify-end">Total<SortIcon field="total_amount" /></span>
                    </th>
                    <th className="p-4 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {groupedByMonth.map((group) => (
                    <Fragment key={group.key}>
                      <tr className="bg-accent/30">
                        <td colSpan={10} className="px-4 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">{group.label}</span>
                            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                              {group.records.length} records · {group.currencyTotals.map((ct) => fmtCurrencyValue(ct.total, ct.currency)).join(" · ")}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {group.records.map((doc) => (
                        <tr key={doc.id} className={cn("border-b border-border-subtle last:border-0 hover:bg-accent/40 transition-colors cursor-pointer", selectedIds.has(doc.id) && "bg-primary/5")} onClick={() => openEdit(doc)}>
                          <td className="pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={selectedIds.has(doc.id)} onCheckedChange={() => toggleSelect(doc.id)} />
                          </td>
                          <td className="p-4 text-sm font-medium">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span title={doc.supplier_name}>{doc.supplier_name}</span>
                              {!doc.document_id && (
                                <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal shrink-0 border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:bg-amber-950/30">
                                  {doc.category === "Mileage" ? "Mileage" : doc.category === "Per Diem" ? "Per Diem" : "Manual"}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">{doc.invoice_number || "—"}</td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {doc.invoice_date ? format(parseISO(doc.invoice_date), "dd MMM yyyy") : "—"}
                            {doc.due_date && (() => { const d = parseISO(doc.due_date); return isValid(d) && isPast(d); })() && (
                              <Badge variant="secondary" className="ml-1.5 text-[10px] h-4 px-1.5 font-normal bg-red-500/10 text-red-600 border-red-500/20">Overdue</Badge>
                            )}
                          </td>
                          <td className="p-4">
                            {doc.category ? (() => {
                              const color = categoryColorMap[doc.category];
                              return (
                                <Badge
                                  variant="secondary"
                                  className="text-xs font-normal"
                                  style={color ? { background: `${color}20`, color, borderColor: `${color}40` } : undefined}
                                >
                                  {doc.category}
                                </Badge>
                              );
                            })() : <span className="text-muted-foreground text-sm">—</span>}
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">{doc.currency}</td>
                          <td className="p-4 text-sm text-right tabular-nums">{Number(doc.net_amount).toFixed(2)}</td>
                          <td className="p-4 text-sm text-muted-foreground text-right tabular-nums">{Number(doc.vat_amount).toFixed(2)}</td>
                          <td className="p-4 text-sm font-medium text-right tabular-nums">{Number(doc.total_amount).toFixed(2)}</td>
                          <td className="p-4">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(doc)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Load more */}
      {filtered.length > visibleCount && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setVisibleCount((c) => c + 50)}>
            Show more ({filtered.length - visibleCount} remaining)
          </Button>
        </div>
      )}

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 md:bottom-6 left-3 right-3 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50 flex items-center justify-center gap-2 md:gap-3 bg-card border border-border shadow-xl rounded-xl px-3 md:px-5 py-2.5 md:py-3"
          >
            <span className="text-xs md:text-sm font-medium">{selectedIds.size} selected</span>
            <Button size="sm" className="h-8 text-xs" onClick={handleBulkDownload} disabled={downloading || !isOnline}>
              {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Archive className="h-3.5 w-3.5 mr-1" />}
              {isMobile ? "ZIP" : "Download ZIP"}
            </Button>
            <Button size="sm" className="h-8 text-xs" variant="destructive" onClick={() => setBulkDeleteConfirm(true)} disabled={!isOnline}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelectedIds(new Set())}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} expense{selectedIds.size > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected expense records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={bulkDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditExpenseDialog
        record={selectedExpense}
        open={!!selectedId}
        onOpenChange={(o) => { if (!o) closeEdit(); }}
      />

      <ManualExpenseDialog
        open={manualEntryOpen}
        onOpenChange={setManualEntryOpen}
        defaultCurrency={defaultCurrency}
      />
    </div>
  );
}
