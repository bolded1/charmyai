import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight, CheckCircle2, FileText, Building2, Calendar,
  Hash, Shield, Sparkles, Zap, Lock, BarChart3,
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
  isProcessing?: boolean;
  processingStep?: string;
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

const stagger = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.1 },
    },
  },
  item: {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  },
};

const processingSteps = [
  { label: "Uploading document", icon: FileText },
  { label: "Analyzing layout", icon: BarChart3 },
  { label: "Extracting fields", icon: Sparkles },
  { label: "Validating data", icon: Shield },
];

export function DemoResultsModal({
  open,
  onClose,
  extractedData,
  fileName,
  previewUrl,
  isProcessing = false,
  processingStep = "",
}: DemoResultsModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [showResults, setShowResults] = useState(false);

  // Animate through processing steps
  useEffect(() => {
    if (isProcessing) {
      setShowResults(false);
      setActiveStep(0);
      const interval = setInterval(() => {
        setActiveStep((prev) => Math.min(prev + 1, processingSteps.length - 1));
      }, 1800);
      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  // When data arrives, show results with a short delay for polish
  useEffect(() => {
    if (extractedData && !isProcessing && open) {
      const timer = setTimeout(() => setShowResults(true), 300);
      return () => clearTimeout(timer);
    }
  }, [extractedData, isProcessing, open]);

  const confidence = extractedData?.confidence ?? 0;
  const currency = extractedData?.currency || "EUR";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[640px] max-h-[92vh] overflow-y-auto p-0 gap-0 border-border/60">
        <AnimatePresence mode="wait">
          {isProcessing && !showResults ? (
            /* ── Processing State ── */
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="p-8 py-12"
            >
              <div className="text-center mb-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-brand-soft mb-4"
                >
                  <Sparkles className="h-7 w-7 text-primary" />
                </motion.div>
                <h3 className="text-lg font-semibold mb-1">Analyzing Your Document</h3>
                <p className="text-sm text-muted-foreground">{fileName}</p>
              </div>

              <div className="max-w-xs mx-auto space-y-4">
                {processingSteps.map((step, i) => {
                  const isActive = i === activeStep;
                  const isDone = i < activeStep;
                  return (
                    <motion.div
                      key={step.label}
                      initial={{ opacity: 0.4 }}
                      animate={{
                        opacity: isDone || isActive ? 1 : 0.35,
                      }}
                      transition={{ duration: 0.3 }}
                      className="flex items-center gap-3"
                    >
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-300 ${
                          isDone
                            ? "bg-primary/10"
                            : isActive
                            ? "bg-brand-soft"
                            : "bg-accent"
                        }`}
                      >
                        {isDone ? (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        ) : (
                          <step.icon
                            className={`h-4 w-4 transition-colors ${
                              isActive ? "text-primary" : "text-muted-foreground"
                            }`}
                          />
                        )}
                      </div>
                      <span
                        className={`text-sm transition-colors duration-300 ${
                          isActive ? "font-medium text-foreground" : isDone ? "text-muted-foreground" : "text-muted-foreground/60"
                        }`}
                      >
                        {step.label}
                        {isActive && (
                          <motion.span
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity }}
                          >
                            …
                          </motion.span>
                        )}
                      </span>
                    </motion.div>
                  );
                })}
              </div>

              <div className="mt-8">
                <Progress value={(activeStep + 1) / processingSteps.length * 100} className="h-1" />
              </div>
            </motion.div>
          ) : showResults && extractedData ? (
            /* ── Results State ── */
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* Header */}
              <div className="p-5 pb-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">Extraction Complete</h3>
                      <p className="text-xs text-muted-foreground">AI processed in seconds</p>
                    </div>
                  </div>
                  <ConfidenceBadge value={confidence} />
                </div>

                {/* Document bar */}
                <motion.div
                  variants={stagger.item}
                  initial="hidden"
                  animate="show"
                  className="flex items-center gap-3 p-3 rounded-lg bg-accent/70 border border-border/50"
                >
                  <div className="h-8 w-8 rounded-lg bg-card flex items-center justify-center border border-border/50">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium truncate">{fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {docTypeLabels[extractedData.document_type || ""] || "Document"}
                      {extractedData.category && (
                        <span className="ml-1.5 inline-flex items-center">
                          · <span className="ml-1.5 px-1.5 py-0.5 rounded bg-accent text-[10px] font-medium">{extractedData.category}</span>
                        </span>
                      )}
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Preview (image only) */}
              {previewUrl && (
                <motion.div
                  variants={stagger.item}
                  initial="hidden"
                  animate="show"
                  className="mx-5 mt-3 rounded-lg border overflow-hidden bg-accent/30 max-h-40 flex items-center justify-center"
                >
                  <img src={previewUrl} alt="Document preview" className="max-h-40 object-contain" />
                </motion.div>
              )}

              {/* Extracted Fields */}
              <motion.div
                variants={stagger.container}
                initial="hidden"
                animate="show"
                className="p-5 pt-4 space-y-4"
              >
                <motion.div variants={stagger.item}>
                  <h4 className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mb-2.5">
                    Extracted Fields
                  </h4>
                </motion.div>
                <div className="grid grid-cols-2 gap-2">
                  <AnimatedField icon={Building2} label="Supplier" value={extractedData.supplier_name} delay={0} />
                  <AnimatedField icon={Building2} label="Customer" value={extractedData.customer_name} delay={1} />
                  <AnimatedField icon={Hash} label="Invoice #" value={extractedData.invoice_number} delay={2} />
                  <AnimatedField icon={Calendar} label="Invoice Date" value={formatDate(extractedData.invoice_date)} delay={3} />
                  <AnimatedField icon={Calendar} label="Due Date" value={formatDate(extractedData.due_date)} delay={4} />
                  <AnimatedField icon={Shield} label="VAT Number" value={extractedData.vat_number} delay={5} />
                </div>

                {/* Amounts Card */}
                <motion.div variants={stagger.item}>
                  <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-border/40 bg-accent/30">
                      <h4 className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
                        Financial Summary
                      </h4>
                    </div>
                    <div className="p-4 space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-muted-foreground">Subtotal</span>
                        <span className="text-[13px] font-medium tabular-nums">
                          {formatCurrency(extractedData.net_amount, currency)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[13px] text-muted-foreground">VAT</span>
                        <span className="text-[13px] font-medium tabular-nums">
                          {formatCurrency(extractedData.vat_amount, currency)}
                        </span>
                      </div>
                      <Separator className="!my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold">Total</span>
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5, duration: 0.4, type: "spring" }}
                          className="text-xl font-bold text-primary tabular-nums"
                        >
                          {formatCurrency(extractedData.total_amount, currency)}
                        </motion.span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Locked features hint */}
                <motion.div
                  variants={stagger.item}
                  className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border"
                >
                  <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">With a free account:</span>{" "}
                    Save records, edit fields, manage contacts, and export CSV for your accountant.
                  </p>
                </motion.div>

                {/* CTA */}
                <motion.div
                  variants={stagger.item}
                  className="rounded-xl bg-hero-gradient p-6 text-center relative overflow-hidden"
                >
                  {/* Subtle glow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-primary-foreground/5" />
                  <div className="relative">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-foreground/15 text-primary-foreground text-xs font-medium mb-3">
                      <Zap className="h-3 w-3" />
                      Free to start · No credit card
                    </div>
                    <h3 className="text-lg font-bold text-primary-foreground mb-1.5">
                      Ready to automate your accounting?
                    </h3>
                    <p className="text-primary-foreground/75 text-sm mb-5 max-w-sm mx-auto">
                      Process hundreds of invoices in minutes. Save, review, and export — all in one place.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
                      <Button size="lg" variant="secondary" asChild className="shadow-lg">
                        <Link to="/signup">
                          Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        size="lg"
                        variant="ghost"
                        className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
                        asChild
                      >
                        <Link to="/contact">Book a Demo</Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>

                <p className="text-[11px] text-center text-muted-foreground pt-1">
                  Demo only — your file is automatically deleted within 1 hour.
                </p>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  const color =
    value >= 90
      ? "bg-success-soft text-success border-success/20"
      : value >= 70
      ? "bg-warning-soft text-warning border-warning/20"
      : "bg-danger-soft text-danger border-danger/20";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3, type: "spring" }}
    >
      <Badge variant="outline" className={`${color} text-xs font-semibold px-2.5 py-1`}>
        {value}% confidence
      </Badge>
    </motion.div>
  );
}

function AnimatedField({
  icon: Icon,
  label,
  value,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined;
  delay: number;
}) {
  return (
    <motion.div
      variants={stagger.item}
      className="flex items-start gap-2 p-2.5 rounded-lg bg-accent/40 border border-border/30 hover:bg-accent/60 transition-colors"
    >
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        <p className="text-[13px] font-medium truncate mt-0.5">{value || "—"}</p>
      </div>
    </motion.div>
  );
}
