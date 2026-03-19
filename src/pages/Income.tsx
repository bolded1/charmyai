import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search, TrendingUp, Loader2, Upload, CheckCircle2, X, AlertCircle, CalendarIcon, Pencil, Trash2, Archive, Plus,
} from "lucide-react";
import { useState, useCallback, useMemo, Fragment } from "react";
import { toast } from "sonner";
import { useIncomeRecords, useUploadIncomeDocument, useDeleteIncome } from "@/hooks/useDocuments";
import { ManualIncomeDialog } from "@/components/ManualIncomeDialog";
import { EditIncomeDialog } from "@/components/EditIncomeDialog";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileRecordCard } from "@/components/ui/responsive-table";
import { useBulkDownload } from "@/hooks/useBulkDownload";
import { useOrganization } from "@/hooks/useOrganization";
import { usePlatformLimits } from "@/hooks/usePlatformLimits";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { groupByCurrency, fmtCurrencyValue } from "@/lib/currency-utils";

type DatePreset = "all" | "this_month" | "last_month" | "this_quarter" | "this_year" | "last_year" | "custom";

interface UploadingFile {
  id: string;
  name: string;
  size: string;
  status: "uploading" | "processing" | "done" | "error";
  progress: number;
  error?: string;
}

export default function IncomePage() {
  const [search, setSearch] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [manualIncomeOpen, setManualIncomeOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { data: income = [], isLoading } = useIncomeRecords();
  const uploadMutation = useUploadIncomeDocument();
  const deleteIncome = useDeleteIncome();
  const { downloadAsZip, downloading } = useBulkDownload();
  const { data: org } = useOrganization();
  const { data: limits } = usePlatformLimits();
  const defaultCurrency = org?.default_currency || "EUR";
  const maxFileSizeMB = limits?.maxFileSize ?? 20;

  const selectedRecord = income.find((e) => e.id === selectedId);

  const openEdit = (record: typeof income[0]) => setSelectedId(record.id);
  const closeEdit = () => setSelectedId(null);

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
    income.forEach((e) => { if (e.category) set.add(e.category); });
    return Array.from(set).sort();
  }, [income]);

  const filtered = useMemo(() => {
    return income.filter((d) => {
      const matchesSearch =
        (d.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
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
  }, [income, search, currencyFilter, categoryFilter, dateRange]);

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
    if (docIds.length === 0) return;
    await downloadAsZip(docIds, "income-invoices");
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      for (const id of selectedIds) {
        await deleteIncome.mutateAsync(id);
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
    const groups: { key: string; label: string; records: typeof filtered; currencyTotals: ReturnType<typeof groupByCurrency> }[] = [];
    const map = new Map<string, typeof filtered>();

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
      groups.push({ key, label, records, currencyTotals: groupByCurrency(records, defaultCurrency) });
    });

    return groups;
  }, [filtered, defaultCurrency]);

  const currencySymbols: Record<string, string> = {
    EUR: "€", USD: "$", GBP: "£", CHF: "CHF ", JPY: "¥", CAD: "CA$", AUD: "A$",
    SEK: "kr ", NOK: "kr ", DKK: "kr ", PLN: "zł ", HUF: "Ft ", CZK: "Kč ",
    RON: "lei ", BGN: "лв ", HRK: "kn ", RSD: "din ", TRY: "₺", RUB: "₽",
    AED: "د.إ ", SAR: "﷼ ", QAR: "﷼ ", KWD: "KD ", ILS: "₪", INR: "₹",
    SGD: "S$", MYR: "RM ", THB: "฿", PHP: "₱", IDR: "Rp ", VND: "₫",
    KRW: "₩", CNY: "¥", HKD: "HK$", TWD: "NT$", NZD: "NZ$", ZAR: "R ",
    BRL: "R$", MXN: "MX$", ARS: "ARS ", NGN: "₦", KES: "KSh ", MAD: "MAD ", EGP: "E£ ",
  };
  const cardStyles = ["stat-card-emerald icon-bg-emerald text-emerald", "stat-card-amber icon-bg-amber text-amber", "stat-card-blue icon-bg-blue text-primary", "stat-card-violet icon-bg-violet text-violet"];
  const currencySummary = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    // Always include the default currency
    map.set(defaultCurrency, { total: 0, count: 0 });
    filtered.forEach((e) => {
      const c = e.currency || defaultCurrency;
      const prev = map.get(c) || { total: 0, count: 0 };
      map.set(c, { total: prev.total + Number(e.total_amount || 0), count: prev.count + 1 });
    });
    return Array.from(map.entries())
      .sort((a, b) => {
        if (a[0] === defaultCurrency) return -1;
        if (b[0] === defaultCurrency) return 1;
        return b[1].total - a[1].total;
      })
      .map(([currency, data]) => ({ currency, ...data }));
  }, [filtered, defaultCurrency]);

  const clearDateFilter = () => { setDatePreset("all"); setDateFrom(undefined); setDateTo(undefined); };


  const activeDateLabel = datePreset !== "all"
    ? datePreset === "custom"
      ? `${dateFrom ? format(dateFrom, "dd/MM/yyyy") : "..."} – ${dateTo ? format(dateTo, "dd/MM/yyyy") : "..."}`
      : datePreset.replace("_", " ")
    : null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const processFile = useCallback(
    async (file: File) => {
      if (!user) return;

      // Enforce file size limit
      const maxBytes = maxFileSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        toast.error(`File "${file.name}" exceeds the ${maxFileSizeMB}MB limit.`);
        return;
      }

      const id = Math.random().toString(36).slice(2);
      setFiles((prev) => [{ id, name: file.name, size: formatSize(file.size), status: "uploading", progress: 20 }, ...prev]);
      try {
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress: 40 } : f)));
        await new Promise((r) => setTimeout(r, 200));
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "processing", progress: 60 } : f)));
        await uploadMutation.mutateAsync(file);
        setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "done", progress: 100 } : f)));
      } catch (err: any) {
        setFiles((prev) => prev.map((f) => f.id === id ? { ...f, status: "error", progress: 100, error: err.message } : f));
      }
    },
    [user, uploadMutation, maxFileSizeMB]
  );

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); Array.from(e.dataTransfer.files).forEach(processFile); };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { Array.from(e.target.files || []).forEach(processFile); e.target.value = ""; };
  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  if (!user) return <div className="text-center py-12 text-muted-foreground">Please log in to view income.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">


      {/* Upload Box */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative p-4 text-center transition-all cursor-pointer border-2 border-dashed rounded-lg ${
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/50"
            }`}
            onClick={() => document.getElementById("income-file-input")?.click()}
          >
            <div className="flex items-center justify-center gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${dragOver ? "bg-primary/10" : "bg-muted"}`}>
                <Upload className={`h-4 w-4 transition-colors ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-foreground">{dragOver ? "Drop to upload" : "Upload Sales Invoices"}</h3>
                <p className="text-xs text-muted-foreground">Drop invoices here or click to browse · PDF, PNG, JPG</p>
              </div>
            </div>
            <input id="income-file-input" type="file" className="hidden" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileSelect} />
          </div>
        </CardContent>
      </Card>

      {/* Active Uploads */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-3 space-y-2">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                <div className="h-8 w-8 rounded-lg bg-card flex items-center justify-center shrink-0">
                  {file.status === "done" ? <CheckCircle2 className="h-4 w-4 text-primary" /> : file.status === "error" ? <AlertCircle className="h-4 w-4 text-destructive" /> : <Loader2 className="h-4 w-4 text-primary animate-spin" />}
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <span className="text-[11px] text-muted-foreground shrink-0 ml-2">{file.size}</span>
                  </div>
                  <Progress value={file.progress} className="h-1" />
                  <p className="text-[11px] text-muted-foreground">
                    {file.status === "uploading" && "Uploading..."}
                    {file.status === "processing" && "AI extracting income data..."}
                    {file.status === "done" && "Added to income"}
                    {file.status === "error" && (file.error || "Upload failed")}
                  </p>
                </div>
                <button className="h-6 w-6 flex items-center justify-center shrink-0 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search income..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Button size="sm" onClick={() => setManualIncomeOpen(true)} className="shrink-0 h-9">
          <Plus className="h-4 w-4 mr-1" /> Income
        </Button>
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
            {currencySummary.map((cs) => (
              <SelectItem key={cs.currency} value={cs.currency}>{cs.currency}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {categories.length > 0 && (
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
        )}
        {(datePreset !== "all" || currencyFilter !== "all" || categoryFilter !== "all" || search) && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => { clearDateFilter(); setCurrencyFilter("all"); setCategoryFilter("all"); setSearch(""); }}>
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Income Table / Cards */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            income.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <TrendingUp className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-base mb-1">No income yet</h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-xs">
                  Upload a sales invoice and AI will extract the data automatically.
                </p>
                <Button size="sm" onClick={() => document.getElementById("income-file-input")?.click()}>
                  <Upload className="h-4 w-4 mr-1" /> Upload Invoice
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <p className="text-sm text-muted-foreground">No results for the selected filters.</p>
                <Button variant="link" size="sm" className="h-auto p-0 text-sm" onClick={() => { clearDateFilter(); setCurrencyFilter("all"); setCategoryFilter("all"); setSearch(""); }}>
                  Clear all filters
                </Button>
              </div>
            )
          ) : isMobile ? (
            <div className="p-2 space-y-1">
              {groupedByMonth.map((group) => (
                <div key={group.key}>
                  <div className="flex items-center justify-between px-3 py-2.5 bg-accent/40 rounded-lg mb-1 mt-1 first:mt-0">
                    <span className="text-xs font-bold text-foreground">{group.label}</span>
                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                      {group.records.length} · {group.currencyTotals.map((ct) => fmtCurrencyValue(ct.total, ct.currency)).join(" · ")}
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
                          title={doc.customer_name}
                          subtitle={doc.invoice_number || undefined}
                          fields={[
                            { label: "Date", value: doc.invoice_date },
                            { label: "Due", value: doc.due_date || "—" },
                            { label: "Currency", value: doc.currency },
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
                    <th className="p-4 text-left text-xs font-medium text-muted-foreground">Customer</th>
                    <th className="p-4 text-left text-xs font-medium text-muted-foreground">Invoice #</th>
                    <th className="p-4 text-left text-xs font-medium text-muted-foreground">Date</th>
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
                        <td colSpan={9} className="px-4 py-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">{group.label}</span>
                            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                              {group.records.length} records · {group.currencyTotals.map((ct) => fmtCurrencyValue(ct.total, ct.currency)).join(" · ")}
                            </span>
                          </div>
                        </td>
                      </tr>
                      {group.records.map((doc) => (
                        <tr key={doc.id} className={cn("border-b border-border last:border-0 hover:bg-accent/40 transition-colors cursor-pointer", selectedIds.has(doc.id) && "bg-primary/5")} onClick={() => openEdit(doc)}>
                          <td className="pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                            <Checkbox checked={selectedIds.has(doc.id)} onCheckedChange={() => toggleSelect(doc.id)} />
                          </td>
                          <td className="p-4 text-sm font-medium">{doc.customer_name}</td>
                          <td className="p-4 text-sm text-muted-foreground">{doc.invoice_number || "—"}</td>
                          <td className="p-4 text-sm text-muted-foreground">{doc.invoice_date}</td>
                          <td className="p-4 text-sm text-muted-foreground">{doc.currency}</td>
                          <td className="p-4 text-sm text-right tabular-nums">{Number(doc.net_amount).toFixed(2)}</td>
                          <td className="p-4 text-sm text-muted-foreground text-right tabular-nums">{Number(doc.vat_amount).toFixed(2)}</td>
                          <td className="p-4 text-sm font-medium text-right tabular-nums">{Number(doc.total_amount).toFixed(2)}</td>
                          <td className="p-4">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(doc); }}>
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
            className="fixed bottom-6 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50 flex items-center justify-center gap-2 md:gap-3 bg-card border border-border shadow-lg rounded-xl px-3 md:px-5 py-3"
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
            <AlertDialogTitle>Delete {selectedIds.size} record{selectedIds.size > 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected income records. This action cannot be undone.
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

      <EditIncomeDialog
        record={selectedRecord}
        open={!!selectedId}
        onOpenChange={(o) => { if (!o) closeEdit(); }}
      />

      <ManualIncomeDialog open={manualIncomeOpen} onOpenChange={setManualIncomeOpen} />
    </div>
  );
}
