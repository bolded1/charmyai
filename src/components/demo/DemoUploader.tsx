import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DemoResultsModal } from "./DemoResultsModal";
import { useTranslation } from "react-i18next";

const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
const MAX_SIZE_MB = 10;

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

export function DemoUploader() {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [fileName, setFileName] = useState("");
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSampleDocument = () => {
    const sampleData: ExtractedData = {
      document_type: "expense_invoice",
      supplier_name: "CloudTech Solutions GmbH",
      customer_name: "Acme Corp",
      invoice_number: "INV-2026-0847",
      invoice_date: "2026-02-28",
      due_date: "2026-03-30",
      currency: "EUR",
      net_amount: 2450.0,
      vat_amount: 465.5,
      total_amount: 2915.5,
      vat_number: "DE123456789",
      category: "IT Services",
      confidence: 96,
    };
    setExtractedData(sampleData);
    setFileName("sample-invoice.pdf");
    setFilePreviewUrl(null);
    setShowResults(true);
  };

  const processFile = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(t("demoUploader.unsupportedType"));
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(t("demoUploader.fileTooLarge", { size: MAX_SIZE_MB }));
      return;
    }

    setIsProcessing(true);
    setShowResults(true);
    setFileName(file.name);
    setProcessingStep(t("demoUploader.uploading"));

    try {
      const sessionId = crypto.randomUUID();
      const filePath = `demo/${sessionId}/${file.name}`;

      setProcessingStep(t("demoUploader.uploading"));
      const { error: uploadErr } = await supabase.storage
        .from("demo-uploads")
        .upload(filePath, file, { contentType: file.type });

      if (uploadErr) throw new Error("Upload failed: " + uploadErr.message);

      setProcessingStep("Preparing for AI analysis...");
      const { data: demoRecord, error: insertErr } = await (supabase as any)
        .from("demo_uploads")
        .insert({
          session_id: sessionId,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
        })
        .select("id")
        .single();

      if (insertErr || !demoRecord)
        throw new Error("Failed to create demo record: " + (insertErr?.message || "No data returned"));

      if (file.type.startsWith("image/")) {
        setFilePreviewUrl(URL.createObjectURL(file));
      } else {
        setFilePreviewUrl(null);
      }

      setProcessingStep("AI is reading your document...");
      const { data: result, error: fnErr } = await supabase.functions.invoke("demo-extract", {
        body: { demoUploadId: demoRecord.id },
      });

      if (fnErr) throw new Error("Extraction failed");
      if (result?.error) throw new Error(result.error);

      setProcessingStep("Extraction complete!");
      setExtractedData(result.extracted);
      setShowResults(true);
    } catch (err: any) {
      console.error("Demo processing error:", err);
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <section className="pb-16">
        <div className="container max-w-xl">
          {/* Demo Card */}
          <div className="glass-card rounded-2xl p-6 md:p-8 relative overflow-hidden">
            {/* Decorative gradient blobs */}
            <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.8), transparent 70%)' }} />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(var(--violet) / 0.6), transparent 70%)' }} />

            <div className="text-center mb-5 relative z-10">
              <h2 className="text-lg font-semibold mb-1">
                Try Charmy — <span className="text-gradient">No Account Needed</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                Upload an invoice or receipt and see how Charmy extracts financial data instantly.
              </p>
            </div>

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`
                relative rounded-2xl border-2 border-dashed p-8 md:p-10 text-center cursor-pointer
                transition-all duration-300 group z-10
                ${isDragging
                  ? "border-primary bg-primary/8 scale-[1.02] shadow-glow"
                  : "border-primary/30 hover:border-primary/60 hover:bg-primary/5 hover:shadow-md"
                }
                ${isProcessing ? "pointer-events-none opacity-80" : ""}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileSelect}
              />

              <AnimatePresence mode="wait">
                {isProcessing ? (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <div>
                      <p className="font-medium text-sm">{processingStep}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This usually takes a few seconds
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3"
                  >
                    <div className="h-14 w-14 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-110 transition-all duration-300">
                      <Upload className="h-6 w-6 text-primary-foreground transition-colors" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        Drag and drop a file or click to upload
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF · PNG · JPG — up to {MAX_SIZE_MB}MB
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sample link */}
            <div className="flex items-center justify-center mt-4 gap-1.5">
              <span className="text-xs text-muted-foreground">No file handy?</span>
              <Button
                variant="link"
                size="sm"
                className="text-primary p-0 h-auto text-xs"
                onClick={handleSampleDocument}
                disabled={isProcessing}
              >
                <FileText className="h-3 w-3 mr-1" />
                Try a sample invoice
              </Button>
            </div>
          </div>
        </div>
      </section>

      <DemoResultsModal
        open={showResults}
        onClose={() => {
          setShowResults(false);
          setIsProcessing(false);
        }}
        extractedData={extractedData}
        fileName={fileName}
        previewUrl={filePreviewUrl}
        isProcessing={isProcessing}
        processingStep={processingStep}
      />
    </>
  );
}
