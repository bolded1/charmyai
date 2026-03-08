import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Upload, Mail, Search, ClipboardCheck, Download,
  ArrowRight, CheckCircle2, FileText, Clock, Receipt,
  FolderOpen, ChevronRight, Sparkles, Zap, Shield,
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

const stepIcons = [
  { icon: Upload, gradient: "bg-hero-gradient", shadow: "shadow-primary/20" },
  { icon: Search, gradient: "bg-gradient-cool", shadow: "shadow-teal/20" },
  { icon: ClipboardCheck, gradient: "bg-gradient-sunset", shadow: "shadow-violet/20" },
  { icon: Download, gradient: "bg-gradient-warm", shadow: "shadow-rose/20" },
];

export default function HomePage() {
  return (
    <div>
      {/* ═══ Hero with Demo ═══ */}
      <section className="pt-16 md:pt-24 pb-8 relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(224 76% 48% / 0.5), transparent 70%)' }} />
        <div className="absolute top-[10%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(262 83% 58% / 0.5), transparent 70%)' }} />

        <div className="container max-w-4xl text-center relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered invoice extraction
          </motion.div>
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-5"
          >
            Stop typing invoice data.{" "}
            <span className="text-gradient">Let Charmy extract it instantly.</span>
          </motion.h1>
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
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
            custom={3}
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
          custom={4}
        >
          <DemoUploader />
        </motion.div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
        <div className="container max-w-5xl relative z-10">
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
              { title: "Upload or Email", desc: "Upload invoices or forward them to your unique Charmy email address." },
              { title: "Extract", desc: "Charmy automatically reads and extracts all financial data fields." },
              { title: "Review", desc: "Confirm the extracted fields. Edit anything that needs correction." },
              { title: "Export", desc: "Export structured, accountant-ready CSV files in one click." },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="glass-card rounded-2xl p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`h-12 w-12 rounded-2xl ${stepIcons[i].gradient} flex items-center justify-center mx-auto mb-4 shadow-lg ${stepIcons[i].shadow}`}>
                  {(() => { const Icon = stepIcons[i].icon; return <Icon className="h-5 w-5 text-white" />; })()}
                </div>
                <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                  Step {i + 1}
                </div>
                <h3 className="text-base font-bold mb-2">{step.title}</h3>
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
              Every Field, <span className="text-gradient">Captured Automatically</span>
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
            className="glass-card rounded-2xl p-6 md:p-8"
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { label: "Supplier", example: "CloudTech GmbH", color: "icon-bg-blue" },
                { label: "Invoice Number", example: "INV-2026-0847", color: "icon-bg-violet" },
                { label: "Invoice Date", example: "Feb 28, 2026", color: "icon-bg-teal" },
                { label: "Due Date", example: "Mar 30, 2026", color: "icon-bg-amber" },
                { label: "Currency", example: "EUR", color: "icon-bg-emerald" },
                { label: "Subtotal", example: "€2,450.00", color: "icon-bg-blue" },
                { label: "VAT Amount", example: "€465.50", color: "icon-bg-rose" },
                { label: "Total Amount", example: "€2,915.50", color: "icon-bg-violet" },
              ].map((field) => (
                <div
                  key={field.label}
                  className={`p-3 rounded-xl ${field.color} border border-border/30 hover:scale-105 transition-transform duration-200`}
                >
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    {field.label}
                  </div>
                  <div className="text-sm font-bold tabular-nums">
                    {field.example}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ Benefits ═══ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
        <div className="container max-w-4xl relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Why Teams Choose <span className="text-gradient">Charmy</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[
              { icon: Clock, text: "Save hours of manual bookkeeping", color: "icon-bg-blue", textColor: "text-primary" },
              { icon: Receipt, text: "Capture invoices instantly", color: "icon-bg-violet", textColor: "text-violet" },
              { icon: Mail, text: "Import documents by upload or email", color: "icon-bg-teal", textColor: "text-teal" },
              { icon: Download, text: "Prepare accountant-ready exports", color: "icon-bg-amber", textColor: "text-amber" },
              { icon: FolderOpen, text: "Keep documents organized", color: "icon-bg-emerald", textColor: "text-emerald" },
              { icon: Shield, text: "Enterprise-grade security", color: "icon-bg-rose", textColor: "text-rose" },
            ].map((b, i) => (
              <motion.div
                key={b.text}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="flex items-center gap-4 p-4 glass-card rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className={`h-10 w-10 rounded-xl ${b.color} flex items-center justify-center shrink-0`}>
                  <b.icon className={`h-5 w-5 ${b.textColor}`} />
                </div>
                <span className="text-sm font-semibold">{b.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 30% 50%, hsl(262 83% 58% / 0.5), transparent 50%), radial-gradient(circle at 70% 50%, hsl(172 66% 40% / 0.3), transparent 50%)' }} />
        <div className="container text-center max-w-2xl relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
            Upload invoices. Forward emails.{" "}
            <span className="opacity-90">Charmy extracts the data.</span>
          </h2>
          <p className="text-primary-foreground/75 mb-8 max-w-md mx-auto">
            Start processing documents in minutes. No credit card required.
          </p>
          <Button size="lg" variant="secondary" asChild className="text-base px-8 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <Link to="/signup">
              Start Free Trial <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
