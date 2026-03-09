import { Link } from "react-router-dom";
import { MarketingCTA } from "@/components/MarketingCTA";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Upload, Mail, Brain, Eye, FolderOpen, Download,
  Users, ArrowRight, CheckCircle2, FileText, Inbox,
  Search, Filter, Edit3, Zap, Shield, BarChart3,
  UserPlus, Activity, Sparkles, Tag, Building2,
  ArrowLeftRight, UserCheck, Layers, FileOutput,
}from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

interface FeatureSectionProps {
  title: string;
  description: string;
  capabilities: { icon: React.ElementType; text: string }[];
  visual: React.ReactNode;
  reversed?: boolean;
  index: number;
}

function FeatureSection({ title, description, capabilities, visual, reversed, index }: FeatureSectionProps) {
  return (
    <section className={`py-20 ${index % 2 === 1 ? "surface-sunken" : ""}`}>
      <div className="container max-w-5xl">
        <div className={`grid md:grid-cols-2 gap-12 lg:gap-16 items-center ${reversed ? "md:[direction:rtl]" : ""}`}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className={reversed ? "md:[direction:ltr]" : ""}>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{title}</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">{description}</p>
            <ul className="space-y-3">
              {capabilities.map((cap) => (
                <li key={cap.text} className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-md bg-brand-soft flex items-center justify-center shrink-0">
                    <cap.icon className="h-3.5 w-3.5 text-primary-icon" />
                  </div>
                  <span className="text-sm font-medium">{cap.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            className={reversed ? "md:[direction:ltr]" : ""}>
            {visual}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function VisualCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`surface-elevated rounded-2xl border border-border p-6 md:p-8 ${className}`}>
      {children}
    </div>
  );
}

export default function FeaturesPage() {
  const features: Omit<FeatureSectionProps, "index">[] = [
    {
      title: "Upload invoices",
      description: "Drag and drop PDF, JPG, or PNG files. Upload invoices, receipts, and supplier bills directly to Charmy.",
      capabilities: [
        { icon: Upload, text: "Drag and drop document uploads" },
        { icon: FileText, text: "Bulk upload multiple invoices" },
        { icon: CheckCircle2, text: "Support for PDF, JPG, and PNG" },
        { icon: Zap, text: "Automatic document processing" },
      ],
      visual: (
        <VisualCard>
          <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="h-14 w-14 rounded-2xl bg-brand-soft flex items-center justify-center mx-auto mb-4"
            >
              <Upload className="h-7 w-7 text-primary-icon" />
            </motion.div>
            <p className="font-medium text-sm mb-1">Drop invoices here</p>
            <p className="text-xs text-muted-foreground">PDF · PNG · JPG</p>
          </div>
          <div className="mt-4 space-y-2">
            {["invoice-march-2026.pdf", "receipt-coffee.jpg", "supplier-bill.pdf"].map((f, i) => (
              <motion.div
                key={f}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-accent/50 border border-border/50"
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium truncate">{f}</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-primary-icon ml-auto shrink-0" />
              </motion.div>
            ))}
          </div>
        </VisualCard>
      ),
    },
    {
      title: "Email invoice import",
      description: "Forward supplier invoices directly to your Charmy email address. The system automatically imports attachments and processes them.",
      capabilities: [
        { icon: Inbox, text: "Dedicated email address for your workspace" },
        { icon: Mail, text: "Forward supplier invoices directly" },
        { icon: Zap, text: "Automatic document import" },
        { icon: FileText, text: "Supports multiple attachments per email" },
      ],
      reversed: true,
      visual: (
        <VisualCard>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 border border-border/50">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="h-8 w-8 rounded-lg bg-brand-soft flex items-center justify-center shrink-0"
              >
                <Mail className="h-4 w-4 text-primary-icon" />
              </motion.div>
              <div className="min-w-0">
                <p className="text-xs font-medium">Your import address</p>
                <p className="text-[11px] text-muted-foreground font-mono truncate">docs-a7x9k@imports.charmy.app</p>
              </div>
            </div>
            <div className="border-l-2 border-border ml-4 pl-4 space-y-3">
              {[
                { from: "accounting@supplier.com", subject: "Invoice #4821", status: "Imported" },
                { from: "bills@cloudhost.io", subject: "Monthly hosting", status: "Processing" },
              ].map((email) => (
                <motion.div
                  key={email.subject}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="p-3 rounded-lg bg-accent/30 border border-border/40"
                >
                  <p className="text-[11px] text-muted-foreground">{email.from}</p>
                  <p className="text-xs font-medium mt-0.5">{email.subject}</p>
                  <span className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${email.status === "Imported" ? "bg-brand-soft text-primary" : "bg-accent text-muted-foreground"}`}>
                    {email.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </VisualCard>
      ),
    },
    {
      title: "AI data extraction",
      description: "Charmy extracts supplier, invoice number, VAT, totals, currency, and dates from your documents automatically.",
      capabilities: [
        { icon: Brain, text: "Supplier name and details" },
        { icon: FileText, text: "Invoice number and dates" },
        { icon: BarChart3, text: "Subtotal, VAT, and total amounts" },
        { icon: Shield, text: "Currency and VAT number" },
      ],
      visual: (
        <VisualCard>
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Extracted Fields</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Supplier", value: "CloudTech GmbH" },
              { label: "Invoice #", value: "INV-2026-0847" },
              { label: "Date", value: "Feb 28, 2026" },
              { label: "Currency", value: "EUR" },
              { label: "Subtotal", value: "€2,450.00" },
              { label: "VAT", value: "€465.50" },
            ].map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="p-2.5 rounded-lg bg-accent/50 border border-border/40"
              >
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</div>
                <div className="text-sm font-semibold mt-0.5 tabular-nums">{f.value}</div>
              </motion.div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg border border-border bg-brand-soft/50 flex items-center justify-between">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-lg font-bold text-primary tabular-nums">€2,915.50</span>
          </div>
        </VisualCard>
      ),
    },
    {
      title: "Fast document review",
      description: "Verify extracted data quickly with document preview. Process many invoices quickly with a clean review interface.",
      capabilities: [
        { icon: Eye, text: "Side-by-side document preview" },
        { icon: Edit3, text: "Editable extracted fields" },
        { icon: Zap, text: "Fast review workflow" },
        { icon: CheckCircle2, text: "Process many invoices quickly" },
      ],
      reversed: true,
      visual: (
        <VisualCard className="p-0 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="p-5">
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Preview</div>
              <div className="aspect-[3/4] rounded-lg bg-accent/50 border border-border/50 flex items-center justify-center">
                <FileText className="h-10 w-10 text-muted-foreground/30" />
              </div>
            </div>
            <div className="p-5 space-y-2.5">
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">Fields</div>
              {[
                { label: "Supplier", value: "CloudTech GmbH" },
                { label: "Invoice #", value: "INV-0847" },
                { label: "Amount", value: "€2,915.50" },
                { label: "Status", value: "Needs Review" },
              ].map((f) => (
                <div key={f.label}>
                  <div className="text-[10px] text-muted-foreground">{f.label}</div>
                  <div className="text-xs font-medium mt-0.5 p-1.5 rounded bg-accent/50 border border-border/40">{f.value}</div>
                </div>
              ))}
              <Button size="sm" className="w-full mt-3 text-xs">Approve</Button>
            </div>
          </div>
        </VisualCard>
      ),
    },
    {
      title: "Automatic categorization",
      description: "Create rules to categorize expenses automatically. Search, filter, and manage your entire document history.",
      capabilities: [
        { icon: Tag, text: "Create automatic categorization rules" },
        { icon: Search, text: "Search documents instantly" },
        { icon: Filter, text: "Filter by supplier, date, amount, or status" },
        { icon: FolderOpen, text: "Organize expenses and income invoices" },
      ],
      visual: (
        <VisualCard>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 h-8 rounded-md bg-accent/50 border border-border/50 flex items-center px-3">
              <Search className="h-3.5 w-3.5 text-muted-foreground mr-2" />
              <span className="text-xs text-muted-foreground">Search documents…</span>
            </div>
            <div className="h-8 px-3 rounded-md bg-accent/50 border border-border/50 flex items-center">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
          <div className="space-y-2">
            {[
              { name: "CloudTech GmbH", num: "INV-0847", amount: "€2,915.50", category: "IT Services" },
              { name: "Office Supplies Ltd", num: "INV-0912", amount: "€184.20", category: "Office" },
              { name: "SaaS Platform Inc", num: "INV-1003", amount: "€499.00", category: "Software" },
            ].map((doc, i) => (
              <motion.div
                key={doc.num}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 border border-border/40"
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{doc.name}</p>
                  <p className="text-[10px] text-muted-foreground">{doc.num}</p>
                </div>
                <span className="text-xs font-semibold tabular-nums">{doc.amount}</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-soft text-primary shrink-0">
                  {doc.category}
                </span>
              </motion.div>
            ))}
          </div>
        </VisualCard>
      ),
    },
    {
      title: "Export financial data",
      description: "Export expenses and income data to CSV, Excel, or PDF. One-click export of accountant-ready reports.",
      capabilities: [
        { icon: Download, text: "CSV exports" },
        { icon: FileText, text: "Excel exports" },
        { icon: BarChart3, text: "Accountant-ready reports" },
        { icon: Zap, text: "One-click export" },
      ],
      reversed: true,
      visual: (
        <VisualCard>
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">Export Options</div>
          <div className="space-y-3">
            {[
              { format: "CSV", desc: "Comma-separated values", icon: FileText },
              { format: "Excel", desc: "XLSX spreadsheet", icon: BarChart3 },
              { format: "Report", desc: "Formatted PDF report", icon: Download },
            ].map((exp, i) => (
              <motion.div
                key={exp.format}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 border border-border/40"
              >
                <div className="h-8 w-8 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                  <exp.icon className="h-4 w-4 text-primary-icon" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium">{exp.format}</p>
                  <p className="text-[10px] text-muted-foreground">{exp.desc}</p>
                </div>
                <Button variant="outline" size="sm" className="text-[10px] h-7 px-3">Export</Button>
              </motion.div>
            ))}
          </div>
        </VisualCard>
      ),
    },
  ];

  return (
    <div>
      <section className="py-20 md:py-28">
        <div className="container text-center max-w-3xl">
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-5">
            Everything you need to process invoices{" "}
            <span className="text-gradient">automatically</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Charmy converts invoices and receipts into structured financial data using AI.
          </motion.p>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild className="text-base px-8">
              <Link to="/signup">Get Started — €29.99 <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="text-base px-8">
              <Link to="/demo">Try Demo</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {features.map((feature, i) => (
        <FeatureSection key={i} {...feature} index={i} />
      ))}

      {/* ── Multi-Client Workspaces for Accounting Firms ── */}
      <section className="py-20 md:py-28 surface-sunken">
        <div className="container max-w-5xl">
          {/* Header */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-5">
              <Building2 className="h-3.5 w-3.5" />
              For Accounting Firms
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] mb-5">
              Multi-Client Workspaces for{" "}
              <span className="text-gradient">Accounting Firms</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              Charmy helps accountants and bookkeeping firms manage invoices and receipts for multiple client companies without losing organization.
            </p>
          </motion.div>

          {/* Animated workspace dashboard illustration */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
            className="mb-20"
          >
            <div className="surface-elevated rounded-2xl border border-border p-6 md:p-8 overflow-hidden">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-5">Firm Dashboard</div>
              
              {/* Workspace switcher bar */}
              <div className="flex items-center gap-2 mb-6 p-2 rounded-xl bg-accent/40 border border-border/40">
                {["All Workspaces", "Active (6)", "Archived (1)"].map((tab, i) => (
                  <motion.button
                    key={tab}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      i === 0 ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab}
                  </motion.button>
                ))}
              </div>

              {/* Workspace cards grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { name: "ABC Consulting", docs: 47, color: "hsl(var(--primary))" },
                  { name: "Smith & Partners", docs: 23, color: "hsl(220 70% 55%)" },
                  { name: "Tech Solutions BV", docs: 89, color: "hsl(150 60% 45%)" },
                  { name: "Riverside Bakery", docs: 12, color: "hsl(30 80% 55%)" },
                  { name: "Nordic Design Co", docs: 34, color: "hsl(280 60% 55%)" },
                  { name: "GreenLeaf BV", docs: 56, color: "hsl(100 50% 45%)" },
                ].map((ws, i) => (
                  <motion.div
                    key={ws.name}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="p-4 rounded-xl bg-card border border-border/60 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: ws.color }}
                      >
                        {ws.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{ws.name}</p>
                        <p className="text-[10px] text-muted-foreground">{ws.docs} documents</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-1.5">
                        {[0, 1].map((a) => (
                          <div key={a} className="h-5 w-5 rounded-full bg-accent border-2 border-card" />
                        ))}
                      </div>
                      <span className="text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        Open <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Feature highlights */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {[
              {
                icon: Layers,
                title: "Separate Workspaces for Each Client",
                desc: "Each client company has its own workspace with separate invoices, receipts, contacts, and exports.",
              },
              {
                icon: ArrowLeftRight,
                title: "Instant Workspace Switching",
                desc: "Move between companies with a single click without logging in and out.",
              },
              {
                icon: UserCheck,
                title: "Client Document Collaboration",
                desc: "Invite clients to upload invoices and receipts directly into their workspace.",
              },
              {
                icon: Brain,
                title: "Organized Data for Accounting",
                desc: "Charmy extracts financial data automatically and keeps records structured.",
              },
              {
                icon: FileOutput,
                title: "Export Data Per Client",
                desc: "Generate exports and financial data for each client independently.",
              },
              {
                icon: Shield,
                title: "Complete Data Isolation",
                desc: "Every workspace is fully isolated — client data never mixes between workspaces.",
              },
            ].map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className="surface-elevated rounded-2xl border border-border p-6 group hover:border-primary/30 transition-colors"
              >
                <div className="h-10 w-10 rounded-xl bg-brand-soft flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <feat.icon className="h-5 w-5 text-primary-icon" />
                </div>
                <h3 className="font-semibold mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Accounting firm plan CTA */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="glass-card rounded-2xl p-8 md:p-12 relative overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary mb-3">
                  <Building2 className="h-3.5 w-3.5" />
                  Accounting Firm Plan
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-3">
                  Manage up to 10 client workspaces
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-4 max-w-lg">
                  The Accounting Firm plan allows you to manage up to 10 client workspaces from one Charmy account.
                  Perfect for accounting firms, bookkeeping services, and financial consultants.
                </p>
                <ul className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
                  {["10 client workspaces", "One-time €99 payment", "Lifetime access", "All Pro features included"].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button size="lg" asChild className="text-base px-8">
                  <Link to="/activate-trial?plan=firm">
                    Get Firm Plan — €99 <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="shrink-0">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="h-24 w-24 rounded-3xl bg-hero-gradient flex items-center justify-center shadow-xl shadow-primary/20"
                >
                  <Building2 className="h-10 w-10 text-primary-foreground" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Demo reinforcement */}
      <section className="py-20">
        <div className="container max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center glass-card rounded-2xl p-10 md:p-14 relative overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="h-14 w-14 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/20"
            >
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Try Charmy instantly</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Upload an invoice or receipt and see how Charmy extracts financial data automatically.
            </p>
            <Button size="lg" asChild className="text-base px-8">
              <Link to="/demo">Try Demo <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <MarketingCTA />
    </div>
  );
}
