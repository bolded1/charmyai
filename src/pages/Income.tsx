import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  Search, TrendingUp, Loader2, Upload, CheckCircle2, X, AlertCircle, CalendarIcon, Pencil, Download, FileText, ExternalLink, Trash2,
} from "lucide-react";
import { useState, useCallback, useMemo, useEffect, Fragment } from "react";
import { useIncomeRecords, useUploadIncomeDocument, useUpdateIncome, useDeleteIncome } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileRecordCard } from "@/components/ui/responsive-table";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

type DatePreset = "all" | "this_month" | "last_month" | "this_quarter" | "this_year" | "last_year" | "custom";

interface UploadingFile {
  id: string;
  name: string;
  size: string;
  status: "uploading" | "processing" | "done" | "error";
  progress: number;
  error?: string;
}

interface IncomeEdit {
  customer_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  category: string;
  currency: string;
  net_amount: number;
  vat_amount: number;
  total_amount: number;
  vat_number: string;
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editData, setEditData] = useState<IncomeEdit | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { data: income = [], isLoading } = useIncomeRecords();
  const uploadMutation = useUploadIncomeDocument();
  const updateIncome = useUpdateIncome();
  const deleteIncome = useDeleteIncome();

  const selectedRecord = income.find((e) => e.id === selectedId);

  // Load file preview when opening dialog
  useEffect(() => {
    if (!selectedRecord?.document_id) {
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
        .eq("id", selectedRecord.document_id)
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
  }, [selectedRecord?.document_id]);

  const openEdit = (record: typeof income[0]) => {
    setSelectedId(record.id);
    setEditData({
      customer_name: record.customer_name || "",
      invoice_number: record.invoice_number || "",
      invoice_date: record.invoice_date || "",
      due_date: record.due_date || "",
      category: record.category || "",
      currency: record.currency || "EUR",
      net_amount: Number(record.net_amount || 0),
      vat_amount: Number(record.vat_amount || 0),
      total_amount: Number(record.total_amount || 0),
      vat_number: record.vat_number || "",
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
    await updateIncome.mutateAsync({ id: selectedId, updates: editData });
    closeEdit();
  };

  const handleDownload = () => {
    if (!fileUrl) return;
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = selectedRecord?.customer_name
      ? `${selectedRecord.customer_name}-invoice${fileType === "application/pdf" ? ".pdf" : fileType?.startsWith("image/") ? ".png" : ""}`
      : "document";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenFile = () => {
    if (!fileUrl) return;
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

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

  const groupedByMonth = useMemo(() => {
    const groups: { key: string; label: string; records: typeof filtered; total: number }[] = [];
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
    [user, uploadMutation]
  );

  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragOver(false); Array.from(e.dataTransfer.files).forEach(processFile); };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { Array.from(e.target.files || []).forEach(processFile); e.target.value = ""; };
  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const isImage = fileType?.startsWith("image/");
  const isPdf = fileType === "application/pdf";

  if (!user) return <div className="text-center py-12 text-muted-foreground">Please log in to view income.</div>;

  return (
    <div className="max-w-6xl space-y-6">
      {/* Currency summary cards */}
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="stat-card-emerald rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-xl icon-bg-emerald flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Income EUR</p>
          </div>
          <p className="text-2xl font-bold">€{totalEur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground mt-1">{eurCount} records{activeDateLabel ? ` · ${activeDateLabel}` : ""}</p>
        </div>
        <div className="stat-card-amber rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-9 w-9 rounded-xl icon-bg-amber flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-amber" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Income USD</p>
          </div>
          <p className="text-2xl font-bold">${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-xs text-muted-foreground mt-1">{usdCount} records{activeDateLabel ? ` · ${activeDateLabel}` : ""}</p>
        </div>
      </div>

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
            <div className="text-center py-12 text-muted-foreground text-sm">
              No income records found for the selected filters.
            </div>
          ) : isMobile ? (
            <div className="p-2 space-y-2">
              {filtered.map((doc) => (
                <MobileRecordCard
                  key={doc.id}
                  title={doc.customer_name}
                  subtitle={doc.invoice_number || undefined}
                  fields={[
                    { label: "Date", value: doc.invoice_date },
                    { label: "Currency", value: doc.currency },
                    { label: "Net", value: Number(doc.net_amount).toFixed(2) },
                    { label: "Total", value: Number(doc.total_amount).toFixed(2) },
                  ]}
                  onClick={() => openEdit(doc)}
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
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
                  {filtered.map((doc) => (
                    <tr key={doc.id} className="border-b border-border last:border-0 hover:bg-accent/40 transition-colors cursor-pointer" onClick={() => openEdit(doc)}>
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
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!selectedId} onOpenChange={() => closeEdit()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Income Record</DialogTitle>
          </DialogHeader>
          {editData && (
            <div className="space-y-5">
              {/* File Preview */}
              {selectedRecord?.document_id && (
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
                  <Label className="text-xs text-muted-foreground">Customer</Label>
                  <Input className="h-8 text-sm" value={editData.customer_name} onChange={(e) => setEditData({ ...editData, customer_name: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Invoice #</Label>
                  <Input className="h-8 text-sm" value={editData.invoice_number} onChange={(e) => setEditData({ ...editData, invoice_number: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Invoice Date</Label>
                  <Input className="h-8 text-sm" type="date" value={editData.invoice_date} onChange={(e) => setEditData({ ...editData, invoice_date: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Due Date</Label>
                  <Input className="h-8 text-sm" type="date" value={editData.due_date} onChange={(e) => setEditData({ ...editData, due_date: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <Input className="h-8 text-sm" value={editData.category} onChange={(e) => setEditData({ ...editData, category: e.target.value })} />
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
                <Button size="sm" variant="destructive" onClick={() => setDeleteConfirmId(selectedId)} disabled={deleteIncome.isPending}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
                <div className="flex-1" />
                <Button size="sm" variant="outline" onClick={closeEdit}>Cancel</Button>
                <Button size="sm" onClick={handleSave} disabled={updateIncome.isPending}>
                  {updateIncome.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
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
            <AlertDialogTitle>Delete income record?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this income record. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteConfirmId) {
                  await deleteIncome.mutateAsync(deleteConfirmId);
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
