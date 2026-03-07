import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight, CheckCircle2, FileText, Building2, Calendar,
  Hash, Coins, Receipt, Shield,
} from "lucide-react";

interface ExtractedData {
  document_type?: string;
  supplier_name?: string;
  customer_name?: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  currency?: string;
  net_amount?: number;
  vat_amount?: number;
  total_amount?: number;
  vat_number?: string;
  category?: string;
  confidence?: number;
}

interface DemoResultsModalProps {
  open: boolean;
  onClose: () => void;
  extractedData: ExtractedData | null;
  fileName: string;
  previewUrl: string | null;
}

function formatCurrency(amount: number | undefined, currency: string = "EUR") {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string | undefined) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return date;
  }
}

const docTypeLabels: Record<string, string> = {
  expense_invoice: "Expense Invoice",
  sales_invoice: "Sales Invoice",
  receipt: "Receipt",
  credit_note: "Credit Note",
};

export function DemoResultsModal({
  open,
  onClose,
  extractedData,
  fileName,
  previewUrl,
}: DemoResultsModalProps) {
  if (!extractedData) return null;

  const confidence = extractedData.confidence ?? 0;
  const currency = extractedData.currency || "EUR";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              AI Extraction Complete
            </DialogTitle>
            <Badge
              variant="secondary"
              className={confidence >= 90
                ? "bg-success-soft text-success"
                : confidence >= 70
                ? "bg-warning-soft text-warning"
                : "bg-danger-soft text-danger"
              }
            >
              {confidence}% confidence
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-6 pt-4 space-y-5">
          {/* Document Info Bar */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-accent">
            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{fileName}</p>
              <p className="text-xs text-muted-foreground">
                {docTypeLabels[extractedData.document_type || ""] || extractedData.document_type || "Document"}
                {extractedData.category && ` · ${extractedData.category}`}
              </p>
            </div>
          </div>

          {/* Preview (image only) */}
          {previewUrl && (
            <div className="rounded-lg border overflow-hidden bg-accent max-h-48 flex items-center justify-center">
              <img src={previewUrl} alt="Document preview" className="max-h-48 object-contain" />
            </div>
          )}

          {/* Extracted Fields */}
          <div className="space-y-1">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Extracted Data
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldRow icon={Building2} label="Supplier" value={extractedData.supplier_name} />
              <FieldRow icon={Building2} label="Customer" value={extractedData.customer_name} />
              <FieldRow icon={Hash} label="Invoice #" value={extractedData.invoice_number} />
              <FieldRow icon={Calendar} label="Invoice Date" value={formatDate(extractedData.invoice_date)} />
              <FieldRow icon={Calendar} label="Due Date" value={formatDate(extractedData.due_date)} />
              <FieldRow icon={Shield} label="VAT Number" value={extractedData.vat_number} />
            </div>
          </div>

          <Separator />

          {/* Amounts */}
          <div className="space-y-1">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
              Amounts
            </h3>
            <div className="surface-elevated rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Subtotal (Net)</span>
                <span className="text-sm font-medium">{formatCurrency(extractedData.net_amount, currency)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">VAT</span>
                <span className="text-sm font-medium">{formatCurrency(extractedData.vat_amount, currency)}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(extractedData.total_amount, currency)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* CTA */}
          <div className="rounded-xl bg-hero-gradient p-6 text-center">
            <h3 className="text-lg font-bold text-primary-foreground mb-2">
              Ready to automate your accounting?
            </h3>
            <p className="text-primary-foreground/80 text-sm mb-4">
              Create a free account to save, review, and export your extracted data.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/signup">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="ghost" className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/contact">Book a Demo</Link>
              </Button>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            This is a demo preview. Your uploaded file will be automatically deleted within 1 hour.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined;
}) {
  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-accent/50">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value || "—"}</p>
      </div>
    </div>
  );
}
