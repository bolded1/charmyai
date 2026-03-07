import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Receipt, Loader2, CalendarIcon, X, Pencil, Download, FileText, ExternalLink } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useExpenseRecords, useUpdateExpense, getDocumentSignedUrl } from "@/hooks/useDocuments";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editData, setEditData] = useState<ExpenseEdit | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [signedFileUrl, setSignedFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const { user } = useAuth();
  const { data: expenses = [], isLoading } = useExpenseRecords();
  const updateExpense = useUpdateExpense();

  const selectedExpense = expenses.find((e) => e.id === selectedId);

  // Load file preview when opening dialog
  useEffect(() => {
    if (!selectedExpense?.document_id) {
      setFileUrl((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return null;
      });
      setSignedFileUrl(null);
      setFileType(null);
      return;
    }

    setFileUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
    setSignedFileUrl(null);
    setFileType(null);

    let cancelled = false;
    setLoadingFile(true);

    (async () => {
      // Get the document record to find file_path and file_type
      const { data: doc } = await supabase
        .from("documents")
        .select("file_path, file_type")
        .eq("id", selectedExpense.document_id)
        .single();

      if (cancelled || !doc) { setLoadingFile(false); return; }

      const signedUrl = await getDocumentSignedUrl(doc.file_path);
      if (cancelled || !signedUrl) { setLoadingFile(false); return; }

      try {
        // Fetch as blob to avoid cross-origin issues in preview
        const response = await fetch(signedUrl);
        const rawBlob = await response.blob();
        // Ensure blob has correct MIME type for proper rendering
        const typedBlob = new Blob([rawBlob], { type: doc.file_type || rawBlob.type });
        const blobUrl = URL.createObjectURL(typedBlob);
        if (!cancelled) {
          setFileUrl(blobUrl);
          setSignedFileUrl(signedUrl);
          setFileType(doc.file_type);
          setLoadingFile(false);
        }
      } catch {
        if (!cancelled) {
          setFileUrl(signedUrl);
          setSignedFileUrl(signedUrl);
          setFileType(doc.file_type);
          setLoadingFile(false);
        }
      }
    })();

    return () => {
      cancelled = true;
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
    setSignedFileUrl(null);
    setFileType(null);
  };

  const handleSave = async () => {
    if (!selectedId || !editData) return;
    await updateExpense.mutateAsync({ id: selectedId, updates: editData });
    closeEdit();
  };

  const handleDownload = async () => {
    if (!fileUrl) return;
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = selectedExpense?.supplier_name
        ? `${selectedExpense.supplier_name}-invoice${fileType === "application/pdf" ? ".pdf" : fileType?.startsWith("image/") ? ".png" : ""}`
        : "document";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab
      window.open(fileUrl, "_blank");
    }
  };

  const handleOpenFile = async () => {
    const sourceUrl = signedFileUrl || fileUrl;
    if (!sourceUrl) return;

    try {
      const response = await fetch(sourceUrl);
      const rawBlob = await response.blob();
      const typedBlob = new Blob([rawBlob], {
        type: fileType || rawBlob.type || "application/octet-stream",
      });
      const blobUrl = URL.createObjectURL(typedBlob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch {
      window.open(sourceUrl, "_blank", "noopener,noreferrer");
    }
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

  const filtered = useMemo(() => {
    return expenses.filter((d) => {
      const matchesSearch =
        (d.supplier_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (d.invoice_number || "").toLowerCase().includes(search.toLowerCase());
      const matchesCurrency = currencyFilter === "all" || d.currency === currencyFilter;
      let matchesDate = true;
      if (dateRange.from || dateRange.to) {
        const docDate = d.invoice_date ? new Date(d.invoice_date) : null;
        if (!docDate) matchesDate = false;
        else {
          if (dateRange.from && docDate < dateRange.from) matchesDate = false;
          if (dateRange.to && docDate > dateRange.to) matchesDate = false;
        }
      }
      return matchesSearch && matchesCurrency && matchesDate;
    });
  }, [expenses, search, currencyFilter, dateRange]);

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
    <div className="space-y-4">
      {/* Currency summary cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Expenses EUR</span>
              <Badge variant="outline" className="text-xs">EUR</Badge>
            </div>
            <div className="text-2xl font-bold">€{totalEur.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">{eurCount} records{activeDateLabel ? ` · ${activeDateLabel}` : ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-muted-foreground">Expenses USD</span>
              <Badge variant="outline" className="text-xs">USD</Badge>
            </div>
            <div className="text-2xl font-bold">${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground mt-1">{usdCount} records{activeDateLabel ? ` · ${activeDateLabel}` : ""}</p>
          </CardContent>
        </Card>
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
        {(datePreset !== "all" || currencyFilter !== "all" || search) && (
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => { clearDateFilter(); setCurrencyFilter("all"); setSearch(""); }}>
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Table */}
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
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="p-3 text-xs font-medium text-muted-foreground">Supplier</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Invoice #</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Date</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Category</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Currency</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Net</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">VAT</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground">Total</th>
                    <th className="p-3 text-xs font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => (
                    <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Receipt className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{doc.supplier_name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{doc.invoice_number || "—"}</td>
                      <td className="p-3 text-sm text-muted-foreground">{doc.invoice_date}</td>
                      <td className="p-3"><Badge variant="secondary" className="text-xs">{doc.category || "—"}</Badge></td>
                      <td className="p-3"><Badge variant="outline" className="text-xs">{doc.currency}</Badge></td>
                      <td className="p-3 text-sm">{Number(doc.net_amount).toFixed(2)}</td>
                      <td className="p-3 text-sm text-muted-foreground">{Number(doc.vat_amount).toFixed(2)}</td>
                      <td className="p-3 text-sm font-medium">{Number(doc.total_amount).toFixed(2)}</td>
                      <td className="p-3">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(doc)}>
                          <Pencil className="h-4 w-4" />
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
                      <iframe src={fileUrl} className="w-full h-[300px]" title="Document preview" />
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
                  <Input className="h-8 text-sm" type="date" value={editData.invoice_date} onChange={(e) => setEditData({ ...editData, invoice_date: e.target.value })} />
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
                <Button size="sm" variant="outline" className="flex-1" onClick={closeEdit}>Cancel</Button>
                <Button size="sm" className="flex-1" onClick={handleSave} disabled={updateExpense.isPending}>
                  {updateExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
