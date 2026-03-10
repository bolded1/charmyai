import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FileText, Search, Filter, Loader2, AlertTriangle, CheckCircle2, Mail, Copy, Trash2, CheckCheck, X } from "lucide-react";
import { useState, useMemo } from "react";
import { useDocuments, useUpdateDocument, useApproveDocument, useBulkApproveDocuments, useBulkDeleteDocuments, type DocumentRecord } from "@/hooks/useDocuments";
import { CategorySelect } from "@/components/CategorySelect";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileRecordCard } from "@/components/ui/responsive-table";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const { data: documents = [], isLoading } = useDocuments(statusFilter);
  const updateDoc = useUpdateDocument();
  const approveDoc = useApproveDocument();
  const bulkApprove = useBulkApproveDocuments();
  const bulkDelete = useBulkDeleteDocuments();

  const filtered = documents.filter((d) => {
    const matchesSearch =
      d.file_name.toLowerCase().includes(search.toLowerCase()) ||
      (d.supplier_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.customer_name || "").toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const allSelected = filtered.length > 0 && filtered.every((d) => selectedIds.has(d.id));
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
      setSelectedIds(new Set(filtered.map((d) => d.id)));
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
      await updateDoc.mutateAsync({
        id: selected.id,
        updates: { ...editData, user_corrections: editData },
      });
      setSelected(null);
      toast.success("Document updated");
    } catch {}
  };

  const handleApprove = async () => {
    if (!selected) return;
    const merged = { ...selected, ...editData, user_corrections: editData };
    try {
      await approveDoc.mutateAsync(merged);
      setSelected(null);
    } catch {}
  };

  if (!user) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Please log in to view documents.
      </div>
    );
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case "processing": return "Processing";
      case "processed":
      case "needs_review": return "Needs Review";
      case "approved": return "Approved";
      case "exported": return "Exported";
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="needs_review">Needs Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="exported">Exported</SelectItem>
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
              {selectedIds.size} selected
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
              Delete
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
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground text-sm">
            No documents found. Upload your first document to get started.
          </CardContent>
        </Card>
      ) : isMobile ? (
        /* Mobile card view */
        <div className="space-y-2">
          {filtered.map((doc) => (
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
      ) : (
        /* Desktop table */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                 <thead>
                   <tr className="border-b text-left">
                     <th className="p-3 w-10">
                       <Checkbox
                         checked={allSelected}
                         onCheckedChange={toggleSelectAll}
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
                  {filtered.map((doc) => (
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
                          <span className="block text-xs text-emerald font-normal">
                            Discount: -{(doc.currency || "EUR")} {Math.abs((doc as any).extracted_data.discount_amount).toFixed(2)}
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
                  <Input
                    className="h-8 text-sm"
                    value={editData.currency || "EUR"}
                    onChange={(e) => setEditData((p) => ({ ...p, currency: e.target.value }))}
                  />
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
