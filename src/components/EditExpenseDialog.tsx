import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, ExternalLink, FileText, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateExpense, useDeleteExpense } from "@/hooks/useDocuments";
import { CategorySelect } from "@/components/CategorySelect";
import { ContactCombobox } from "@/components/ContactCombobox";

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
  notes: string;
}

interface EditExpenseDialogProps {
  record: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditExpenseDialog({ record, open, onOpenChange }: EditExpenseDialogProps) {
  const [editData, setEditData] = useState<ExpenseEdit | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [loadingFile, setLoadingFile] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const initialDataRef = useRef<string>("");

  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  // Populate editData when record/open changes
  useEffect(() => {
    if (record && open) {
      const data = {
        supplier_name: record.supplier_name || "",
        invoice_number: record.invoice_number || "",
        invoice_date: record.invoice_date || "",
        category: record.category || "",
        currency: record.currency || "EUR",
        net_amount: Number(record.net_amount || 0),
        vat_amount: Number(record.vat_amount || 0),
        total_amount: Number(record.total_amount || 0),
        vat_number: record.vat_number || "",
        notes: (record as any).notes || "",
      };
      setEditData(data);
      initialDataRef.current = JSON.stringify(data);
    } else {
      setEditData(null);
      initialDataRef.current = "";
    }
  }, [record?.id, open]);

  // Load file preview
  useEffect(() => {
    if (!open || !record?.document_id) {
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
        .eq("id", record.document_id)
        .single();

      if (cancelled || !doc) { setLoadingFile(false); return; }

      const { data: fileBlob, error: fileError } = await supabase.storage
        .from("documents")
        .download(doc.file_path);

      if (cancelled) return;

      if (fileError || !fileBlob) {
        console.error("Document download failed:", fileError?.message, "path:", doc.file_path);
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
  }, [record?.document_id, open]);

  const isDirty = editData ? JSON.stringify(editData) !== initialDataRef.current : false;

  const handleClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
      return;
    }
    doClose();
  };

  const doClose = () => {
    if (fileUrl?.startsWith("blob:")) URL.revokeObjectURL(fileUrl);
    setFileUrl(null);
    setFileType(null);
    setShowDiscardConfirm(false);
    onOpenChange(false);
  };

  const handleSave = async () => {
    if (!record?.id || !editData) return;
    try {
      await updateExpense.mutateAsync({ id: record.id, updates: editData, documentId: record?.document_id });
      doClose();
    } catch {
      // error toast handled by mutation onError
    }
  };

  const handleDownload = () => {
    if (!fileUrl) return;
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = record?.supplier_name
      ? `${record.supplier_name}-invoice${fileType === "application/pdf" ? ".pdf" : fileType?.startsWith("image/") ? ".png" : ""}`
      : "document";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 3000);
  };

  const handleOpenFile = () => {
    if (!fileUrl) return;
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  const isImage = fileType?.startsWith("image/");
  const isPdf = fileType === "application/pdf";

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          {editData && (
            <div className="space-y-5">
              {/* File Preview */}
              {record?.document_id && (
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
                        <p className="text-sm">{fileUrl ? "Preview not available" : "Document could not be loaded"}</p>
                        <p className="text-xs mt-1">{!fileUrl && "The file may have been moved or you may not have access"}</p>
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
              <fieldset disabled={updateExpense.isPending} className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Supplier</Label>
                  <ContactCombobox
                    value={editData.supplier_name}
                    onChange={(name, vat) => setEditData({ ...editData, supplier_name: name, vat_number: vat ?? editData.vat_number })}
                    placeholder="Search or type supplier…"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Invoice #</Label>
                  <Input className="h-8 text-sm" value={editData.invoice_number} onChange={(e) => setEditData({ ...editData, invoice_number: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Invoice Date</Label>
                  <Input
                    className="h-8 min-h-0 text-sm appearance-none [&::-webkit-date-and-time-value]:text-sm [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:h-3 [&::-webkit-calendar-picker-indicator]:w-3"
                    type="date"
                    value={editData.invoice_date}
                    onChange={(e) => setEditData({ ...editData, invoice_date: e.target.value })}
                  />
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
                      {["EUR","USD","GBP","CHF","JPY","CAD","AUD","NZD","SEK","NOK","DKK","PLN","HUF","CZK","RON","BGN","TRY","RUB","AED","SAR","ILS","INR","SGD","MYR","THB","PHP","IDR","VND","KRW","CNY","HKD","TWD","ZAR","BRL","MXN","ARS","NGN","KES","MAD","EGP"].map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">VAT Number</Label>
                  <Input className="h-8 text-sm" value={editData.vat_number} onChange={(e) => setEditData({ ...editData, vat_number: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Net Amount</Label>
                  <Input className="h-8 text-sm" type="number" min="0" step="0.01" value={editData.net_amount} onChange={(e) => setEditData({ ...editData, net_amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">VAT Amount</Label>
                  <Input className="h-8 text-sm" type="number" min="0" step="0.01" value={editData.vat_amount} onChange={(e) => setEditData({ ...editData, vat_amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total Amount</Label>
                  <Input className="h-8 text-sm" type="number" min="0" step="0.01" value={editData.total_amount} onChange={(e) => setEditData({ ...editData, total_amount: parseFloat(e.target.value) || 0 })} />
                </div>
              </fieldset>

              <div>
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Textarea className="text-sm resize-none" rows={3} placeholder="Add notes..." value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} />
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="destructive" onClick={() => setDeleteConfirmId(record?.id)} disabled={deleteExpense.isPending}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
                <div className="flex-1" />
                <Button size="sm" variant="outline" onClick={handleClose}>Cancel</Button>
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
                  doClose();
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>You have unsaved changes. Closing will discard them.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction onClick={doClose} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
