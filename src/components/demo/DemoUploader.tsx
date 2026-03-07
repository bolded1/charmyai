import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DemoResultsModal } from "./DemoResultsModal";

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
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [fileName, setFileName] = useState("");
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sample data
  const handleSampleDocument = () => {
    const sampleData: ExtractedData = {
      document_type: "expense_invoice",
      supplier_name: "CloudTech Solutions GmbH",
      customer_name: "Acme Corp",
      invoice_number: "INV-2026-0847",
      invoice_date: "2026-02-28",
      due_date: "2026-03-30",
      currency: "EUR",
      net_amount: 2450.00,
      vat_amount: 465.50,
      total_amount: 2915.50,
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
      toast.error("Unsupported file type. Please upload a PDF, PNG, or JPG.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_SIZE_MB}MB.`);
      return;
    }

    setIsProcessing(true);
    setShowResults(true);
    setFileName(file.name);
    setProcessingStep("Uploading document...");

    try {
      // Generate session ID
      const sessionId = crypto.randomUUID();
      const filePath = `demo/${sessionId}/${file.name}`;

      // Upload to demo-uploads bucket
      setProcessingStep("Uploading document...");
      const { error: uploadErr } = await supabase.storage
        .from("demo-uploads")
        .upload(filePath, file, { contentType: file.type });

      if (uploadErr) throw new Error("Upload failed: " + uploadErr.message);

      // Create demo_uploads record
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

      if (insertErr || !demoRecord) throw new Error("Failed to create demo record: " + (insertErr?.message || "No data returned"));

      // Create preview URL for images
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setFilePreviewUrl(url);
      } else {
        setFilePreviewUrl(null);
      }

      // Call demo-extract edge function
      setProcessingStep("AI is reading your document...");
      const { data: result, error: fnErr } = await supabase.functions.invoke("demo-extract", {
        body: { demoUploadId: demoRecord.id },
      });

      if (fnErr) throw new Error("Extraction failed");

      if (result?.error) {
        throw new Error(result.error);
      }

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
      <section className="py-20">
        <div className="container max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-soft border border-brand text-sm font-medium mb-4">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Try It Now — No Account Needed
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              See Scan AI in Action
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Upload an invoice or receipt to see how Scan AI extracts financial data instantly.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`
                relative rounded-xl border-2 border-dashed p-12 text-center cursor-pointer
                transition-all duration-300 group
                ${isDragging
                  ? "border-primary bg-brand-soft scale-[1.01]"
                  : "border-border hover:border-primary/50 hover:bg-brand-soft/50"
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
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="relative">
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                      <div className="absolute inset-0 h-12 w-12 rounded-full bg-primary/10 animate-pulse" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{processingStep}</p>
                      <p className="text-sm text-muted-foreground mt-1">This usually takes a few seconds</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center group-hover:bg-brand-soft transition-colors">
                      <Upload className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Drop your invoice or receipt here
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        or click to browse · PDF, PNG, JPG up to {MAX_SIZE_MB}MB
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-center mt-4 gap-2">
              <span className="text-sm text-muted-foreground">No file handy?</span>
              <Button
                variant="link"
                size="sm"
                className="text-primary p-0 h-auto"
                onClick={handleSampleDocument}
                disabled={isProcessing}
              >
                <FileText className="h-3.5 w-3.5 mr-1" />
                Try a sample invoice
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <DemoResultsModal
        open={showResults}
        onClose={() => { setShowResults(false); setIsProcessing(false); }}
        extractedData={extractedData}
        fileName={fileName}
        previewUrl={filePreviewUrl}
        isProcessing={isProcessing}
        processingStep={processingStep}
      />
    </>
  );
}
