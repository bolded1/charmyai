import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, Search, Filter, Loader2, AlertTriangle, CheckCircle2, Mail, Copy, Trash2, CheckCheck, X, CalendarDays, StickyNote, CalendarIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useState, useMemo } from "react";
import { useDocuments, useUpdateDocument, useApproveDocument, useBulkApproveDocuments, useBulkDeleteDocuments, type DocumentRecord } from "@/hooks/useDocuments";
import { CategorySelect } from "@/components/CategorySelect";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileRecordCard } from "@/components/ui/responsive-table";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { format, isToday, isYesterday, parseISO, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from "date-fns";

const statusColors: Record<string, string> = {
  processing: "bg-muted text-muted-foreground",
  needs_review: "bg-accent text-accent-foreground",
  approved: "bg-primary/10 text-primary",
  exported: "bg-secondary text-secondary-foreground",
};

export default function DocumentsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<DocumentRecord | null>(null);
  const [editData, setEditData] = useState<Partial<DocumentRecord>>({});
  const [notes, setNotes] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);
  const [datePreset, setDatePreset] = useState<"all" | "this_month" | "last_month" | "this_quarter" | "this_year">("all");
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const { data: documents = [], isLoading } = useDocuments(statusFilter);
  const updateDoc = useUpdateDocument();
  const approveDoc = useApproveDocument();
  const bulkApprove = useBulkApproveDocuments();
  const bulkDelete = useBulkDeleteDocuments();

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (datePreset) {
      case "this_month": return { from: startOfMonth(now), to: endOfMonth(now) };
      case "last_month": { const l = new Date(now.getFullYear(), now.getMonth() - 1, 1); return { from: startOfMonth(l), to: endOfMonth(l) }; }
      case "this_quarter": return { from: startOfQuarter(now), to: endOfQuarter(now) };
      case "this_year": return { from: startOfYear(now), to: endOfYear(now) };
      default: return { from: undefined, to: undefined };
    }
  }, [datePreset]);

  const allFiltered = documents.filter((d) => {
    const matchesSearch =
      d.file_name.toLowerCase().includes(search.toLowerCase()) ||
      (d.supplier_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.customer_name || "").toLowerCase().includes(search.toLowerCase());
    let matchesDate = true;
    if (dateRange.from || dateRange.to) {
      const docDate = d.invoice_date ? new Date(d.invoice_date) : null;
      if (!docDate) matchesDate = false;
      else {
        if (dateRange.from && docDate < dateRange.from) matchesDate = false;
        if (dateRange.to && docDate > dateRange.to) matchesDate = false;
      }
    }
    return matchesSearch && matchesDate;
  });
  const filtered = allFiltered.slice(0, visibleCount);

  // Group documents by upload date (created_at)
  const groupedByDay = useMemo(() => {
    const groups: { label: string; sortKey: string; docs: typeof filtered }[] = [];
    const map = new Map<string, typeof filtered>();
    for (const doc of filtered) {
      const dateKey = (doc as any).created_at ? (doc as any).created_at.slice(0, 10) : "unknown";
      if (!map.has(dateKey)) map.set(dateKey, []);
      map.get(dateKey)!.push(doc);
    }
    for (const [dateKey, docs] of map) {
      let label: string;
      if (dateKey === "unknown") {
        label = "Unknown date";
      } else {
        const d = parseISO(dateKey);
        if (isToday(d)) label = "Today";
        else if (isYesterday(d)) label = "Yesterday";
        else label = format(d, "EEEE, MMMM d, yyyy");
      }
      groups.push({ label, sortKey: dateKey, docs });
    }
    return groups;
  }, [filtered]);

  const allSelected = allFiltered.length > 0 && allFiltered.every((d) => selectedIds.has(d.id));
  const someSelected = selectedIds.size > 0;

  const selectedDocs = useMemo(
    () => filtered.filter((d) => selectedIds.has(d.id)),
    [filtered, selectedIds]
  );

  const approvableCount = selectedDocs.filter(
    (d) => d.status !== "approved" && d.status !== "exported" && d.status !== "processing"
  ).length;

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allFiltered.map((d) => d.id)));
    }
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleBulkApprove = async () => {
    const toApprove = selectedDocs.filter(
      (d) => d.status !== "approved" && d.status !== "exported" && d.status !== "processing"
    );
    if (toApprove.length === 0) return;
    await bulkApprove.mutateAsync(toApprove);
    clearSelection();
  };

  const handleBulkDelete = async () => {
    await bulkDelete.mutateAsync(Array.from(selectedIds));
    clearSelection();
    setDeleteConfirmOpen(false);
  };

  const openReview = (doc: DocumentRecord) => {
    setSelected(doc);
    setNotes((doc.user_corrections as any)?._notes ?? "");
    const discount = (doc as any).extracted_data?.discount_amount ?? (doc as any).user_corrections?.discount_amount ?? "";
    setEditData({
      document_type: doc.document_type,
      supplier_name: doc.supplier_name,
      customer_name: doc.customer_name,
      invoice_number: doc.invoice_number,
      invoice_date: doc.invoice_date,
      due_date: doc.due_date,
      currency: doc.currency,
      net_amount: doc.net_amount,
      vat_amount: doc.vat_amount,
      total_amount: doc.total_amount,
      vat_number: doc.vat_number,
      category: doc.category,
      discount_amount: discount,
    } as any);
  };

  const handleSave = async () => {
    if (!selected) return;
    try {
      const { discount_amount, ...columnData } = editData as any;
      await updateDoc.mutateAsync({
        id: selected.id,
        updates: { ...columnData, user_corrections: { ...editData, _notes: notes.trim() || null } },
      });
      setSelected(null);
      toast.success("Document updated");
    } catch (err: any) {
      toast.error(err?.message || "Failed to save document.");
    }
  };

  const handleApprove = async () => {
    if (!selected) return;
    const merged = { ...selected, ...editData, user_corrections: { ...editData, _notes: notes.trim() || null } };
    try {
      await approveDoc.mutateAsync(merged);
      setSelected(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve document.");
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t("documents.pleaseLogin")}
      </div>
    );
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case "processing": return t("common.processing");
      case "processed":
      case "needs_review": return t("documents.needsReview");
      case "approved": return t("documents.approved");
      case "exported": return t("documents.exported");
      default: return status;
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input aria-label={t("documents.searchDocuments")} placeholder={t("documents.searchDocuments")} className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={datePreset} onValueChange={(v) => setDatePreset(v as typeof datePreset)}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
            <SelectItem value="this_quarter">This Quarter</SelectItem>
            <SelectItem value="this_year">This Year</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("documents.allStatus")}</SelectItem>
            <SelectItem value="processing">{t("common.processing")}</SelectItem>
            <SelectItem value="needs_review">{t("documents.needsReview")}</SelectItem>
            <SelectItem value="approved">{t("documents.approved")}</SelectItem>
            <SelectItem value="exported">{t("documents.exported")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {someSelected && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/15"
          >
            <span className="text-sm font-semibold text-primary">
              {selectedIds.size} {t("common.selected")}
            </span>
            <div className="flex-1" />
            {approvableCount > 0 && (
              <Button
                size="sm"
                variant="default"
                className="h-8 text-xs gap-1.5 rounded-lg"
                onClick={handleBulkApprove}
                disabled={bulkApprove.isPending}
              >
                {bulkApprove.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                Approve {approvableCount}
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              className="h-8 text-xs gap-1.5 rounded-lg"
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={bulkDelete.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("common.delete")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs rounded-lg"
              onClick={clearSelection}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : allFiltered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-sm">
            <p className="text-muted-foreground">{t("documents.noDocuments")}</p>
            {(search || statusFilter !== "all") && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                Active:{" "}
                {[search && `search "${search}"`, statusFilter !== "all" && `status "${statusFilter}"`]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            {(search || statusFilter !== "all") && (
              <button
                className="mt-2 text-xs text-primary underline-offset-2 hover:underline"
                onClick={() => { setSearch(""); setStatusFilter("all"); }}
              >
                Clear filters
              </button>
            )}
          </CardContent>
        </Card>
      ) : isMobile ? (
        /* Mobile card view */
        <div className="space-y-1">
          {groupedByDay.map((group) => (
            <div key={group.sortKey}>
              <div className="flex items-center gap-2 py-2 px-1">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{group.label}</span>
                <span className="text-xs text-muted-foreground/60">({group.docs.length})</span>
              </div>
              {group.docs.map((doc) => (
                <div key={doc.id} className="flex items-start gap-2">
                  <div className="pt-3 pl-1">
                    <Checkbox
                      checked={selectedIds.has(doc.id)}
                      onCheckedChange={() => toggleSelect(doc.id)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <MobileRecordCard
                      title={doc.file_name}
                      subtitle={doc.supplier_name || doc.customer_name || undefined}
                      badge={{
                        label: (doc as any).potential_duplicate_of
                          ? "⚠ Duplicate"
                          : statusLabel(doc.status),
                        className: (doc as any).potential_duplicate_of
                          ? "bg-amber-500/15 text-amber-600 border-amber-500/20"
                          : statusColors[doc.status] || "",
                      }}
                      fields={[
                        { label: "Type", value: (doc.document_type || "—").replace("_", " ") },
                        { label: "Date", value: doc.invoice_date || "—" },
                        { label: "Amount", value: doc.total_amount && Number(doc.total_amount) > 0
                          ? `${doc.currency || "EUR"} ${Number(doc.total_amount).toFixed(2)}`
                          : "—"
                        },
                        { label: "Source", value: (doc as any).source === "email_import" ? "Email" : "Upload" },
                      ]}
                      onClick={() => openReview(doc)}
                    />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        /* Desktop table */
        <div className="space-y-4">
          {groupedByDay.map((group) => (
            <div key={group.sortKey}>
              <div className="flex items-center gap-2 py-2 px-1">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{group.label}</span>
                <span className="text-xs text-muted-foreground/60">({group.docs.length})</span>
              </div>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="p-3 w-10">
                            <Checkbox
                              checked={group.docs.every((d) => selectedIds.has(d.id))}
                              onCheckedChange={() => {
                                const allInGroup = group.docs.every((d) => selectedIds.has(d.id));
                                setSelectedIds((prev) => {
                                  const next = new Set(prev);
                                  group.docs.forEach((d) => allInGroup ? next.delete(d.id) : next.add(d.id));
                                  return next;
                                });
                              }}
                            />
                          </th>
                          <th className="p-3 text-xs font-medium text-muted-foreground">Document</th>
                          <th className="p-3 text-xs font-medium text-muted-foreground">Source</th>
                          <th className="p-3 text-xs font-medium text-muted-foreground">Type</th>
                          <th className="p-3 text-xs font-medium text-muted-foreground">Supplier/Customer</th>
                          <th className="p-3 text-xs font-medium text-muted-foreground">Date</th>
                          <th className="p-3 text-xs font-medium text-muted-foreground">Amount</th>
                          <th className="p-3 text-xs font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.docs.map((doc) => (
                          <tr
                            key={doc.id}
                            className={`border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer ${
                              selectedIds.has(doc.id) ? "bg-primary/5" : ""
                            }`}
                            onClick={() => openReview(doc)}
                          >
                            <td className="p-3" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedIds.has(doc.id)}
                                onCheckedChange={() => toggleSelect(doc.id)}
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium truncate max-w-[200px]">{doc.file_name}</span>
                              </div>
                            </td>
                            <td className="p-3">
                              {(doc as any).source === "email_import" ? (
                                <Badge variant="secondary" className="text-[10px] gap-1">
                                  <Mail className="h-3 w-3" /> Email
                                </Badge>
                              ) : (doc as any).source === "document_request" ? (
                                <Badge variant="secondary" className="text-[10px] gap-1">
                                  Request
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">Upload</span>
                              )}
                            </td>
                            <td className="p-3 text-sm text-muted-foreground capitalize">
                              {(doc.document_type || "—").replace("_", " ")}
                            </td>
                            <td className="p-3 text-sm">{doc.supplier_name || doc.customer_name || "—"}</td>
                            <td className="p-3 text-sm text-muted-foreground">{doc.invoice_date || "—"}</td>
                            <td className="p-3 text-sm font-medium">
                              {doc.total_amount && Number(doc.total_amount) > 0
                                ? `${doc.currency || "EUR"} ${Number(doc.total_amount).toFixed(2)}`
                                : "—"}
                              {(doc as any).extracted_data?.discount_amount != null && (doc as any).extracted_data.discount_amount !== 0 && (
                                <span className="block text-xs text-emerald-600 font-normal">
                                  Discount: -{doc.currency || "EUR"} {Math.abs((doc as any).extracted_data.discount_amount).toFixed(2)}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1.5">
                                <Badge variant="secondary" className={statusColors[doc.status] || ""}>
                                  {doc.status === "needs_review" ? (
                                    <span className="flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" /> needs review
                                    </span>
                                  ) : doc.status === "processing" ? (
                                    <span className="flex items-center gap-1">
                                      <Loader2 className="h-3 w-3 animate-spin" /> processing
                                    </span>
                                  ) : doc.status === "approved" ? (
                                    <span className="flex items-center gap-1">
                                      <CheckCircle2 className="h-3 w-3" /> approved
                                    </span>
                                  ) : (
                                    doc.status.replace("_", " ")
                                  )}
                                </Badge>
                                {(doc.user_corrections as any)?._notes && (
                                  <StickyNote className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                )}
                                {(doc as any).potential_duplicate_of && (
                                  <Badge variant="secondary" className="bg-amber-500/15 text-amber-600 border-amber-500/20">
                                    <Copy className="h-3 w-3 mr-1" /> duplicate
                                  </Badge>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {allFiltered.length > visibleCount && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => setVisibleCount((c) => c + 50)}>
            Show more ({allFiltered.length - visibleCount} remaining)
          </Button>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} document(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected documents and their associated files. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkDelete.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-4 w-4 mr-1" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Review Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Document Review
              {selected?.confidence_score && (
                <Badge variant="secondary" className="text-xs">
                  {Number(selected.confidence_score).toFixed(0)}% confidence
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {(selected as any).potential_duplicate_of && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                  <Copy className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-700">Potential Duplicate Detected</p>
                    <p className="text-xs text-amber-600/80 mt-0.5">
                      This document matches an existing record with the same supplier, amount, or invoice number. Please review before approving.
                    </p>
                  </div>
                </div>
              )}

              {selected.validation_errors && Array.isArray(selected.validation_errors) && (selected.validation_errors as any[]).filter(e => e?.field !== "duplicate").length > 0 && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 space-y-1">
                  <p className="text-xs font-medium text-destructive">Validation Issues:</p>
                  {(selected.validation_errors as any[])
                    .filter(err => err?.field !== "duplicate")
                    .map((err, i) => (
                    <p key={i} className="text-xs text-destructive/80">• {err?.message || err?.field || JSON.stringify(err)}</p>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">File</Label>
                  <p className="text-sm font-medium">{selected.file_name}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Document Type</Label>
                  <Select
                    value={editData.document_type || "expense_invoice"}
                    onValueChange={(v) => setEditData((p) => ({ ...p, document_type: v }))}
                  >
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense_invoice">Expense Invoice</SelectItem>
                      <SelectItem value="sales_invoice">Sales Invoice</SelectItem>
                      <SelectItem value="receipt">Receipt</SelectItem>
                      <SelectItem value="credit_note">Credit Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Invoice #</Label>
                  <Input
                    className="h-8 text-sm"
                    value={editData.invoice_number || ""}
                    onChange={(e) => setEditData((p) => ({ ...p, invoice_number: e.target.value }))}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Supplier</Label>
                  <Input
                    className="h-8 text-sm"
                    value={editData.supplier_name || ""}
                    onChange={(e) => setEditData((p) => ({ ...p, supplier_name: e.target.value }))}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Customer</Label>
                  <Input
                    className="h-8 text-sm"
                    value={editData.customer_name || ""}
                    onChange={(e) => setEditData((p) => ({ ...p, customer_name: e.target.value }))}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Invoice Date</Label>
                  <Input
                    className="h-8 text-sm"
                    type="date"
                    value={editData.invoice_date || ""}
                    onChange={(e) => setEditData((p) => ({ ...p, invoice_date: e.target.value }))}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Due Date</Label>
                  <Input
                    className="h-8 text-sm"
                    type="date"
                    value={editData.due_date || ""}
                    onChange={(e) => setEditData((p) => ({ ...p, due_date: e.target.value }))}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Currency</Label>
                  <Select value={editData.currency || "EUR"} onValueChange={(v) => setEditData((p) => ({ ...p, currency: v }))}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["EUR","USD","GBP","CHF","JPY","CAD","AUD","NZD","SEK","NOK","DKK","PLN","HUF","CZK","RON","BGN","HRK","RSD","TRY","RUB","AED","SAR","QAR","KWD","BHD","ILS","INR","PKR","SGD","MYR","THB","PHP","IDR","VND","KRW","CNY","HKD","TWD","ZAR","BRL","MXN","ARS","CLP","COP","PEN","NGN","KES","GHS","MAD","EGP"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">VAT Number</Label>
                  <Input
                    className="h-8 text-sm"
                    value={editData.vat_number || ""}
                    onChange={(e) => setEditData((p) => ({ ...p, vat_number: e.target.value }))}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Net Amount</Label>
                  <Input
                    className="h-8 text-sm"
                    type="number"
                    step="0.01"
                    value={editData.net_amount ?? ""}
                    onChange={(e) => setEditData((p) => ({ ...p, net_amount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">VAT Amount</Label>
                  <Input
                    className="h-8 text-sm"
                    type="number"
                    step="0.01"
                    value={editData.vat_amount ?? ""}
                    onChange={(e) => setEditData((p) => ({ ...p, vat_amount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Total Amount</Label>
                  <Input
                    className="h-8 text-sm"
                    type="number"
                    step="0.01"
                    value={editData.total_amount ?? ""}
                    onChange={(e) => setEditData((p) => ({ ...p, total_amount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Discount</Label>
                  <Input
                    className="h-8 text-sm"
                    type="number"
                    step="0.01"
                    value={(editData as any).discount_amount ?? ""}
                    onChange={(e) => setEditData((p) => ({ ...p, discount_amount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <CategorySelect
                    value={editData.category || ""}
                    onValueChange={(v) => setEditData((p) => ({ ...p, category: v }))}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">{t("documents.notes")}</Label>
                <Textarea
                  placeholder={t("documents.notesPlaceholder")}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1" onClick={handleSave} disabled={updateDoc.isPending}>
                  {updateDoc.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Save Changes
                </Button>
                {selected.status !== "approved" && selected.status !== "exported" && (
                  <Button size="sm" className="flex-1" onClick={handleApprove} disabled={approveDoc.isPending}>
                    {approveDoc.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Approve
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
