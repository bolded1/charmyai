import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileText, Paperclip, X } from "lucide-react";
import { CategorySelect } from "@/components/CategorySelect";
import { useCreateManualIncome, type CreateManualIncomeInput } from "@/hooks/useDocuments";
import { ContactCombobox } from "@/components/ContactCombobox";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCurrency?: string;
}

const CURRENCIES = [
  // Major
  "EUR", "USD", "GBP", "CHF", "JPY", "CAD", "AUD", "NZD",
  // European
  "SEK", "NOK", "DKK", "PLN", "HUF", "CZK", "RON", "BGN", "HRK", "RSD", "TRY", "RUB",
  // Middle East / Africa
  "AED", "SAR", "QAR", "KWD", "BHD", "OMR", "ILS", "MAD", "EGP", "NGN", "KES", "GHS", "ZAR",
  // Asia
  "INR", "PKR", "BDT", "SGD", "MYR", "THB", "PHP", "IDR", "VND", "KRW", "CNY", "HKD", "TWD",
  // Americas
  "BRL", "MXN", "ARS", "CLP", "COP", "PEN", "UYU",
];

export function ManualIncomeDialog({ open, onOpenChange, defaultCurrency = "EUR" }: Props) {
  const createIncome = useCreateManualIncome();
  const today = format(new Date(), "yyyy-MM-dd");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customerName, setCustomerName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(today);
  const [dueDate, setDueDate] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [category, setCategory] = useState("");
  const [netAmount, setNetAmount] = useState("");
  const [vatAmount, setVatAmount] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Auto-compute total from net + vat
  useEffect(() => {
    const net = parseFloat(netAmount) || 0;
    const vat = parseFloat(vatAmount) || 0;
    setTotalAmount((net + vat).toFixed(2));
  }, [netAmount, vatAmount]);

  // Receipt file preview
  useEffect(() => {
    if (!receiptFile) { setReceiptPreview(null); return; }
    if (receiptFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(receiptFile);
      setReceiptPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setReceiptPreview(null);
  }, [receiptFile]);

  const reset = () => {
    setCustomerName("");
    setVatNumber("");
    setInvoiceNumber("");
    setInvoiceDate(today);
    setDueDate("");
    setCurrency(defaultCurrency);
    setCategory("");
    setNetAmount("");
    setVatAmount("");
    setTotalAmount("");
    setNotes("");
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const isDirty = !!(customerName || invoiceNumber || netAmount || vatAmount || notes || receiptFile);

  const handleClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      reset();
      onOpenChange(false);
    }
  };

  const confirmDiscard = () => {
    setShowDiscardConfirm(false);
    reset();
    onOpenChange(false);
  };

  const isValid = () => {
    return !!customerName.trim() && !!invoiceDate && parseFloat(totalAmount) > 0;
  };

  const handleSubmit = async () => {
    if (!isValid()) return;

    const input: CreateManualIncomeInput = {
      customer_name: customerName.trim(),
      invoice_number: invoiceNumber || undefined,
      invoice_date: invoiceDate,
      due_date: dueDate || undefined,
      currency,
      net_amount: parseFloat(netAmount) || 0,
      vat_amount: parseFloat(vatAmount) || 0,
      total_amount: parseFloat(totalAmount) || 0,
      vat_number: vatNumber || undefined,
      category: category || undefined,
      notes: notes || undefined,
      receipt_file: receiptFile || undefined,
    };

    await createIncome.mutateAsync(input);
    reset();
    onOpenChange(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setReceiptFile(file);
  };

  const removeFile = () => {
    setReceiptFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved data. Closing will discard all entered information.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDiscard}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Manual Income</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Customer */}
            <div>
              <Label className="text-xs text-muted-foreground">Customer / Client *</Label>
              <ContactCombobox
                value={customerName}
                onChange={(name, vat) => {
                  setCustomerName(name);
                  if (vat) setVatNumber(vat);
                }}
                placeholder="e.g. Acme Corp"
              />
            </div>

            {/* Invoice # and Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Invoice #</Label>
                <Input
                  className="h-8 text-sm"
                  placeholder="Optional"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Invoice Date *</Label>
                <Input
                  className="h-8 text-sm"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
            </div>

            {/* Due Date and VAT Number */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Due Date</Label>
                <Input
                  className="h-8 text-sm"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">VAT Number</Label>
                <Input
                  className="h-8 text-sm"
                  placeholder="Optional"
                  value={vatNumber}
                  onChange={(e) => setVatNumber(e.target.value)}
                />
              </div>
            </div>

            {/* Currency and Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Category</Label>
                <CategorySelect value={category} onValueChange={setCategory} />
              </div>
            </div>

            {/* Amounts */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Net Amount</Label>
                <Input
                  className="h-8 text-sm"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={netAmount}
                  onChange={(e) => setNetAmount(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">VAT Amount</Label>
                <Input
                  className="h-8 text-sm"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={vatAmount}
                  onChange={(e) => setVatAmount(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Total *</Label>
                <Input
                  className="h-8 text-sm"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Input
                className="h-8 text-sm"
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Receipt attachment */}
            <div>
              <Label className="text-xs text-muted-foreground">Attach Invoice / Receipt (optional)</Label>
              {receiptFile ? (
                <div className="mt-1 flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                  {receiptPreview ? (
                    <img src={receiptPreview} alt="Preview" className="h-8 w-8 rounded object-cover shrink-0" />
                  ) : (
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-xs flex-1 truncate">{receiptFile.name}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={removeFile}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-1 w-full border-dashed text-xs text-muted-foreground h-9"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                  Upload photo or PDF
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleSubmit}
                disabled={!isValid() || createIncome.isPending}
              >
                {createIncome.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Add Income
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
