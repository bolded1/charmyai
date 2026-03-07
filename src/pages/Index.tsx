import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Upload, Mail, Search, ClipboardCheck, Download,
  ArrowRight, CheckCircle2, FileText, Clock, Receipt,
  FolderOpen, ChevronRight,
} from "lucide-react";
import { DemoUploader } from "@/components/demo/DemoUploader";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function HomePage() {
  return (
    <div>
      {/* ═══ Hero with Demo ═══ */}
      <section className="pt-16 md:pt-24 pb-8">
        <div className="container max-w-4xl text-center">
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-5"
          >
            Stop typing invoice data.{" "}
            <span className="text-gradient">Let Charmy extract it instantly.</span>
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4"
          >
            Upload invoices, scan receipts, or forward expense emails. Charmy
            automatically extracts supplier, invoice number, VAT, totals, and
            more — in seconds.
          </motion.p>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-sm text-muted-foreground mb-10"
          >
            No account required · Documents are processed temporarily and deleted automatically.
          </motion.p>
        </div>

        {/* Demo Uploader — hero focal point */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={3}
        >
          <DemoUploader />
        </motion.div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section className="py-20 surface-sunken">
        <div className="container max-w-5xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Four steps from document to structured accounting data.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Upload,
                title: "Upload or Email",
                desc: "Upload invoices or forward them to your unique Charmy email address.",
              },
              {
                icon: Search,
                title: "Extract",
                desc: "Charmy automatically reads and extracts all financial data fields.",
              },
              {
                icon: ClipboardCheck,
                title: "Review",
                desc: "Confirm the extracted fields. Edit anything that needs correction.",
              },
              {
                icon: Download,
                title: "Export",
                desc: "Export structured, accountant-ready CSV files in one click.",
              },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="surface-elevated rounded-xl p-6 text-center"
              >
                <div className="h-12 w-12 rounded-xl bg-brand-soft flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Step {i + 1}
                </div>
                <h3 className="text-base font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Extracted Fields ═══ */}
      <section className="py-20">
        <div className="container max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Every Field, Captured Automatically
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Charmy extracts the data your accountant needs — no manual entry required.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="surface-elevated rounded-xl border border-border p-6 md:p-8"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { label: "Supplier", example: "CloudTech GmbH" },
                { label: "Invoice Number", example: "INV-2026-0847" },
                { label: "Invoice Date", example: "Feb 28, 2026" },
                { label: "Due Date", example: "Mar 30, 2026" },
                { label: "Currency", example: "EUR" },
                { label: "Subtotal", example: "€2,450.00" },
                { label: "VAT Amount", example: "€465.50" },
                { label: "Total Amount", example: "€2,915.50" },
              ].map((field) => (
                <div
                  key={field.label}
                  className="p-3 rounded-lg bg-accent/50 border border-border/50"
                >
                  <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
                    {field.label}
                  </div>
                  <div className="text-sm font-semibold tabular-nums">
                    {field.example}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ Benefits ═══ */}
      <section className="py-20 surface-sunken">
        <div className="container max-w-4xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Why Teams Choose Charmy
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[
              { icon: Clock, text: "Save hours of manual bookkeeping" },
              { icon: Receipt, text: "Capture invoices instantly" },
              { icon: Mail, text: "Import documents by upload or email" },
              { icon: Download, text: "Prepare accountant-ready exports" },
              { icon: FolderOpen, text: "Keep documents organized" },
              { icon: FileText, text: "Auto-classify document types" },
            ].map((b, i) => (
              <motion.div
                key={b.text}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="flex items-center gap-3 p-4 surface-elevated rounded-xl"
              >
                <div className="h-9 w-9 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                  <b.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <span className="text-sm font-medium">{b.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="py-20 bg-hero-gradient">
        <div className="container text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
            Upload invoices. Forward emails.{" "}
            <span className="opacity-90">Charmy extracts the data.</span>
          </h2>
          <p className="text-primary-foreground/75 mb-8 max-w-md mx-auto">
            Start processing documents in minutes. No credit card required.
          </p>
          <Button size="lg" variant="secondary" asChild className="text-base px-8">
            <Link to="/signup">
              Start Free Trial <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
