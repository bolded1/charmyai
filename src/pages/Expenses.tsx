import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Receipt, Loader2, CalendarIcon, X, Pencil, Download, FileText, ExternalLink, Trash2, Archive } from "lucide-react";
import { useState, useMemo, useEffect, Fragment } from "react";
import { useExpenseRecords, useUpdateExpense, useDeleteExpense } from "@/hooks/useDocuments";
import { CategorySelect } from "@/components/CategorySelect";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileRecordCard } from "@/components/ui/responsive-table";
import { supabase } from "@/integrations/supabase/client";
import { useBulkDownload } from "@/hooks/useBulkDownload";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type DatePreset = "all" | "this_month" | "last_month" | "this_quarter" | "this_year" | "last_year" | "custom";

interface ExpenseEdit {
  supplier_name: string;
  invoice_number: string;
  invoice_date: string;
  category: string;
  currency: string;
  net_amount: number;
  vat_amount: number;
  total_amount: number;
  vat_number: string;
}

export default function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editData, setEditData] = useState<ExpenseEdit | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data: expenses = [], isLoading } = useExpenseRecords();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();
  const { downloadAsZip, downloading } = useBulkDownload();

  const selectedExpense = expenses.find((e) => e.id === selectedId);


  // Load file preview when opening dialog
  useEffect(() => {
    if (!selectedExpense?.document_id) {
      setFileUrl((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return null;
      });
      setFileType(null);
      return;
    }

    let cancelled = false;
    let localBlobUrl: string | null = null;
    setLoadingFile(true);
    setFileType(null);

    (async () => {
      const { data: doc } = await supabase
        .from("documents")
        .select("file_path, file_type")
        .eq("id", selectedExpense.document_id)
        .single();

      if (cancelled || !doc) {
        setLoadingFile(false);
        return;
      }

      const { data: fileBlob, error: fileError } = await supabase.storage
        .from("documents")
        .download(doc.file_path);

      if (cancelled) return;

      if (fileError || !fileBlob) {
        setFileUrl(null);
        setFileType(doc.file_type || null);
        setLoadingFile(false);
        return;
      }

      const typedBlob = new Blob([fileBlob], {
        type: doc.file_type || fileBlob.type || "application/octet-stream",
      });

      localBlobUrl = URL.createObjectURL(typedBlob);
      setFileUrl((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return localBlobUrl;
      });
      setFileType(doc.file_type || typedBlob.type || null);
      setLoadingFile(false);
    })();

    return () => {
      cancelled = true;
      if (localBlobUrl) URL.revokeObjectURL(localBlobUrl);
    };
  }, [selectedExpense?.document_id]);

  const openEdit = (expense: typeof expenses[0]) => {
    setSelectedId(expense.id);
    setEditData({
      supplier_name: expense.supplier_name || "",
      invoice_number: expense.invoice_number || "",
      invoice_date: expense.invoice_date || "",
      category: expense.category || "",
      currency: expense.currency || "EUR",
      net_amount: Number(expense.net_amount || 0),
      vat_amount: Number(expense.vat_amount || 0),
      total_amount: Number(expense.total_amount || 0),
      vat_number: expense.vat_number || "",
    });
  };

  const closeEdit = () => {
    if (fileUrl?.startsWith("blob:")) URL.revokeObjectURL(fileUrl);
    setSelectedId(null);
    setEditData(null);
    setFileUrl(null);
    setFileType(null);
  };

  const handleSave = async () => {
    if (!selectedId || !editData) return;
    await updateExpense.mutateAsync({ id: selectedId, updates: editData });
    closeEdit();
  };

  const handleDownload = () => {
    if (!fileUrl) return;
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = selectedExpense?.supplier_name
      ? `${selectedExpense.supplier_name}-invoice${fileType === "application/pdf" ? ".pdf" : fileType?.startsWith("image/") ? ".png" : ""}`
      : "document";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenFile = () => {
    if (!fileUrl) return;
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectableCount = filtered.filter((e) => e.document_id).length;

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
    if (docIds.length === 0) return;
    await downloadAsZip(docIds, "expenses-invoices");
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      for (const id of selectedIds) {
        await deleteExpense.mutateAsync(id);
      }
      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);
    } catch {
      // error handled by mutation
    } finally {
      setBulkDeleting(false);
    }
  };

  const groupedByMonth = useMemo(() => {
    const groups: { key: string; label: string; records: typeof filtered; total: number }[] = [];
    const map = new Map<string, typeof filtered>();
    
    // Sort by date descending
    const sorted = [...filtered].sort((a, b) => {
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
      const total = records.reduce((s, e) => s + Number(e.total_amount || 0), 0);
      groups.push({ key, label, records, total });
    });

    return groups;
  }, [filtered]);

  const totalEur = filtered.filter((e) => e.currency === "EUR").reduce((s, e) => s + Number(e.total_amount || 0), 0);
  const totalUsd = filtered.filter((e) => e.currency === "USD").reduce((s, e) => s + Number(e.total_amount || 0), 0);
  const eurCount = filtered.filter((e) => e.currency === "EUR").length;
  const usdCount = filtered.filter((e) => e.currency === "USD").length;

  const clearDateFilter = () => { setDatePreset("all"); setDateFrom(undefined); setDateTo(undefined); };

  if (!user) return <div className="text-center py-12 text-muted-foreground">Please log in to view expenses.</div>;

  const activeDateLabel = datePreset !== "all"
    ? datePreset === "custom"
      ? `${dateFrom ? format(dateFrom, "dd/MM/yyyy") : "..."} – ${dateTo ? format(dateTo, "dd/MM/yyyy") : "..."}`
      : datePreset.replace("_", " ")
    : null;

  const isImage = fileType?.startsWith("image/");
  const isPdf = fileType === "application/pdf";

  return (
    <div className="max-w-6xl space-y-6">
      {/* Currency summary cards */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="stat-card-blue rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-xl icon-bg-blue flex items-center justify-center">
              <Receipt className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Expenses EUR</p>
          </div>
          <p className="text-2xl font-bold">€{totalEur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground mt-1">{eurCount} records{activeDateLabel ? ` · ${activeDateLabel}` : ""}</p>
        </div>
        <div className="stat-card-violet rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-xl icon-bg-violet flex items-center justify-center">
              <Receipt className="h-4 w-4 text-violet" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Expenses USD</p>
          </div>
          <p className="text-2xl font-bold">${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground mt-1">{usdCount} records{activeDateLabel ? ` · ${activeDateLabel}` : ""}</p>
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search expenses..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={datePreset} onValueChange={(v) => setDatePreset(v as DatePreset)}>
          <SelectTrigger className="w-40">
            <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
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
                <Button variant="outline" size="sm" className={cn("w-[130px] justify-start text-left text-xs", !dateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("w-[130px] justify-start text-left text-xs", !dateTo && "text-muted-foreground")}>
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {dateTo ? format(dateTo, "dd/MM/yyyy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          </>
        )}
        <Select value={currencyFilter} onValueChange={setCurrencyFilter}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Currency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
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
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => { clearDateFilter(); setCurrencyFilter("all"); setCategoryFilter("all"); setSearch(""); }}>
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Table / Cards */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No expense records found for the selected filters.
            </div>
          ) : isMobile ? (
            <div className="p-2 space-y-1">
              {groupedByMonth.map((group) => (
                <div key={group.key}>
                  <div className="flex items-center justify-between px-3 py-2.5 bg-accent/40 rounded-lg mb-1 mt-1 first:mt-0">
                    <span className="text-xs font-bold text-foreground">{group.label}</span>
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                      {group.records.length} · {group.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {group.records.map((doc) => (
                    <div key={doc.id} className="flex items-start gap-2">
                      <Checkbox
                        checked={selectedIds.has(doc.id)}
                        onCheckedChange={() => toggleSelect(doc.id)}
                        className="mt-4 shrink-0"
                      />
                      <div className="flex-1">
                        <MobileRecordCard
                          title={doc.supplier_name}
                          subtitle={doc.invoice_number || undefined}
                          badge={{ label: doc.category || "—" }}
                          fields={[
                            { label: "Date", value: doc.invoice_date },
                            { label: "Currency", value: doc.currency },
                            { label: "Net", value: Number(doc.net_amount).toFixed(2) },
                            { label: "Total", value: Number(doc.total_amount).toFixed(2) },
                          ]}
                          onClick={() => openEdit(doc)}
                        />
                      </div>
                    </div>
                  ))}
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
                        checked={selectableCount > 0 && selectedIds.size === selectableCount}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="p-4 text-left text-xs font-medium text-muted-foreground">Supplier</th>
                    <th className="p-4 text-left text-xs font-medium text-muted-foreground">Invoice #</th>
                    <th className="p-4 text-left text-xs font-medium text-muted-foreground">Date</th>
                    <th className="p-4 text-left text-xs font-medium text-muted-foreground">Category</th>
                    <th className="p-4 text-left text-xs font-medium text-muted-foreground">Currency</th>
                    <th className="p-4 text-right text-xs font-medium text-muted-foreground">Net</th>
                    <th className="p-4 text-right text-xs font-medium text-muted-foreground">VAT</th>
                    <th className="p-4 text-right text-xs font-medium text-muted-foreground">Total</th>
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
                              {group.records.length} records · {group.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {group.records.map((doc) => (
                        <tr key={doc.id} className={cn("border-b border-border-subtle last:border-0 hover:bg-accent/40 transition-colors cursor-pointer", selectedIds.has(doc.id) && "bg-primary/5")} onClick={() => openEdit(doc)}>
                          <td className="pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                            {doc.document_id && <Checkbox checked={selectedIds.has(doc.id)} onCheckedChange={() => toggleSelect(doc.id)} />}
                          </td>
                          <td className="p-4 text-sm font-medium">{doc.supplier_name}</td>
                          <td className="p-4 text-sm text-muted-foreground">{doc.invoice_number || "—"}</td>
                          <td className="p-4 text-sm text-muted-foreground">{doc.invoice_date}</td>
                          <td className="p-4"><Badge variant="secondary" className="text-xs font-normal">{doc.category || "—"}</Badge></td>
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

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card border border-border shadow-lg rounded-xl px-5 py-3"
          >
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
            <Button size="sm" onClick={handleBulkDownload} disabled={downloading}>
              {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Archive className="h-4 w-4 mr-1" />}
              Download ZIP
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setBulkDeleteConfirm(true)}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
              <X className="h-4 w-4" />
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

      <Dialog open={!!selectedId} onOpenChange={() => closeEdit()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          {editData && (
            <div className="space-y-5">
              {/* File Preview */}
              {selectedExpense?.document_id && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Uploaded Document</Label>
                    <div className="flex gap-2">
                      {fileUrl && (
                        <>
                          <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleDownload}>
                            <Download className="h-3 w-3 mr-1" /> Download
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleOpenFile}>
                            <ExternalLink className="h-3 w-3 mr-1" /> Open
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="border rounded-lg overflow-hidden bg-muted/30">
                    {loadingFile ? (
                      <div className="flex items-center justify-center py-16">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : fileUrl && isImage ? (
                      <img src={fileUrl} alt="Document preview" className="w-full max-h-[300px] object-contain" />
                    ) : fileUrl && isPdf ? (
                      <object data={fileUrl} type="application/pdf" className="w-full h-[360px]">
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                          <FileText className="h-8 w-8 mb-2" />
                          <p className="text-sm">PDF preview not available in this browser</p>
                          <Button variant="link" size="sm" className="mt-1 text-xs" onClick={handleOpenFile}>
                            Open PDF in new tab
                          </Button>
                        </div>
                      </object>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <FileText className="h-8 w-8 mb-2" />
                        <p className="text-sm">Preview not available</p>
                        {fileUrl && (
                          <Button variant="link" size="sm" className="mt-1 text-xs" onClick={handleDownload}>
                            Download file instead
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Edit Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Supplier</Label>
                  <Input className="h-8 text-sm" value={editData.supplier_name} onChange={(e) => setEditData({ ...editData, supplier_name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Invoice #</Label>
                  <Input className="h-8 text-sm" value={editData.invoice_number} onChange={(e) => setEditData({ ...editData, invoice_number: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Invoice Date</Label>
                  <Input className="h-8 min-h-0 text-sm appearance-none [&::-webkit-date-and-time-value]:text-sm [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:h-3 [&::-webkit-calendar-picker-indicator]:w-3" type="date" value={editData.invoice_date} onChange={(e) => setEditData({ ...editData, invoice_date: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <CategorySelect value={editData.category} onValueChange={(v) => setEditData({ ...editData, category: v })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Currency</Label>
                  <Select value={editData.currency} onValueChange={(v) => setEditData({ ...editData, currency: v })}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">VAT Number</Label>
                  <Input className="h-8 text-sm" value={editData.vat_number} onChange={(e) => setEditData({ ...editData, vat_number: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Net Amount</Label>
                  <Input className="h-8 text-sm" type="number" step="0.01" value={editData.net_amount} onChange={(e) => setEditData({ ...editData, net_amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">VAT Amount</Label>
                  <Input className="h-8 text-sm" type="number" step="0.01" value={editData.vat_amount} onChange={(e) => setEditData({ ...editData, vat_amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total Amount</Label>
                  <Input className="h-8 text-sm" type="number" step="0.01" value={editData.total_amount} onChange={(e) => setEditData({ ...editData, total_amount: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="destructive" onClick={() => setDeleteConfirmId(selectedId)} disabled={deleteExpense.isPending}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
                <div className="flex-1" />
                <Button size="sm" variant="outline" onClick={closeEdit}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={updateExpense.isPending}>
                  {updateExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this expense record. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteConfirmId) {
                  await deleteExpense.mutateAsync(deleteConfirmId);
                  setDeleteConfirmId(null);
                  closeEdit();
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
