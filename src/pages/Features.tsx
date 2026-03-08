import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Upload, Mail, Brain, Eye, FolderOpen, Download,
  Users, ArrowRight, CheckCircle2, FileText, Inbox,
  Search, Filter, Edit3, Zap, Shield, BarChart3,
  UserPlus, Activity,
} from "lucide-react";
import { usePageContent } from "@/hooks/usePageContent";
import { featuresDefaults } from "@/lib/cms-defaults";

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
  const { content: c } = usePageContent("features", featuresDefaults);

  const features: Omit<FeatureSectionProps, "index">[] = [
    {
      title: c.feature1Title,
      description: c.feature1Desc,
      capabilities: [
        { icon: Upload, text: "Drag and drop document uploads" },
        { icon: FileText, text: "Bulk upload multiple invoices" },
        { icon: CheckCircle2, text: "Support for PDF, JPG, and PNG" },
        { icon: Zap, text: "Automatic document processing" },
      ],
      visual: (
        <VisualCard>
          <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
            <div className="h-14 w-14 rounded-2xl bg-brand-soft flex items-center justify-center mx-auto mb-4">
              <Upload className="h-7 w-7 text-primary-icon" />
            </div>
            <p className="font-medium text-sm mb-1">Drop invoices here</p>
            <p className="text-xs text-muted-foreground">PDF · PNG · JPG</p>
          </div>
          <div className="mt-4 space-y-2">
            {["invoice-march-2026.pdf", "receipt-coffee.jpg", "supplier-bill.pdf"].map((f) => (
              <div key={f} className="flex items-center gap-3 p-2.5 rounded-lg bg-accent/50 border border-border/50">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium truncate">{f}</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-primary-icon ml-auto shrink-0" />
              </div>
            ))}
          </div>
        </VisualCard>
      ),
    },
    {
      title: c.feature2Title,
      description: c.feature2Desc,
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
              <div className="h-8 w-8 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-primary-icon" />
              </div>
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
                <div key={email.subject} className="p-3 rounded-lg bg-accent/30 border border-border/40">
                  <p className="text-[11px] text-muted-foreground">{email.from}</p>
                  <p className="text-xs font-medium mt-0.5">{email.subject}</p>
                  <span className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${email.status === "Imported" ? "bg-brand-soft text-primary" : "bg-accent text-muted-foreground"}`}>
                    {email.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </VisualCard>
      ),
    },
    {
      title: c.feature3Title,
      description: c.feature3Desc,
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
            ].map((f) => (
              <div key={f.label} className="p-2.5 rounded-lg bg-accent/50 border border-border/40">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</div>
                <div className="text-sm font-semibold mt-0.5 tabular-nums">{f.value}</div>
              </div>
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
      title: c.feature4Title,
      description: c.feature4Desc,
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
      title: c.feature5Title,
      description: c.feature5Desc,
      capabilities: [
        { icon: Search, text: "Search documents instantly" },
        { icon: Filter, text: "Filter by supplier, date, amount, or status" },
        { icon: FolderOpen, text: "Organize expenses and income invoices" },
        { icon: Activity, text: "Maintain a clear document history" },
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
              { name: "CloudTech GmbH", num: "INV-0847", amount: "€2,915.50", status: "Approved" },
              { name: "Office Supplies Ltd", num: "INV-0912", amount: "€184.20", status: "Needs Review" },
              { name: "SaaS Platform Inc", num: "INV-1003", amount: "€499.00", status: "Approved" },
            ].map((doc) => (
              <div key={doc.num} className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 border border-border/40">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{doc.name}</p>
                  <p className="text-[10px] text-muted-foreground">{doc.num}</p>
                </div>
                <span className="text-xs font-semibold tabular-nums">{doc.amount}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${doc.status === "Approved" ? "bg-brand-soft text-primary" : "bg-accent text-muted-foreground"}`}>
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        </VisualCard>
      ),
    },
    {
      title: c.feature6Title,
      description: c.feature6Desc,
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
            ].map((exp) => (
              <div key={exp.format} className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 border border-border/40">
                <div className="h-8 w-8 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                  <exp.icon className="h-4 w-4 text-primary-icon" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium">{exp.format}</p>
                  <p className="text-[10px] text-muted-foreground">{exp.desc}</p>
                </div>
                <Button variant="outline" size="sm" className="text-[10px] h-7 px-3">Export</Button>
              </div>
            ))}
          </div>
        </VisualCard>
      ),
    },
    {
      title: c.feature7Title,
      description: c.feature7Desc,
      capabilities: [
        { icon: Users, text: "Multiple users" },
        { icon: Shield, text: "Role-based access" },
        { icon: Activity, text: "Activity tracking" },
        { icon: UserPlus, text: "Team collaboration" },
      ],
      visual: (
        <VisualCard>
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">Team Members</div>
          <div className="space-y-2.5">
            {[
              { name: "Maria Schmidt", role: "Admin", initials: "MS" },
              { name: "Thomas Weber", role: "Reviewer", initials: "TW" },
              { name: "Anna Klein", role: "Member", initials: "AK" },
            ].map((member) => (
              <div key={member.name} className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 border border-border/40">
                <div className="h-8 w-8 rounded-full bg-brand-soft flex items-center justify-center text-xs font-semibold text-primary">{member.initials}</div>
                <div className="flex-1">
                  <p className="text-xs font-medium">{member.name}</p>
                  <p className="text-[10px] text-muted-foreground">{member.role}</p>
                </div>
              </div>
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
            {c.heroTitle}{" "}
            <span className="text-gradient">{c.heroTitleGradient}</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {c.heroSubtitle}
          </motion.p>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild className="text-base px-8">
              <Link to="/signup">Start Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="text-base px-8">
              <Link to="/#demo">Try the Demo</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {features.map((feature, i) => (
        <FeatureSection key={i} {...feature} index={i} />
      ))}

      <section className="py-20 bg-hero-gradient">
        <div className="container text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">{c.ctaTitle}</h2>
          <p className="text-primary-foreground/75 mb-8 max-w-lg mx-auto">{c.ctaSubtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" variant="secondary" asChild className="text-base px-8">
              <Link to="/signup">Start Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="ghost" className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10 text-base px-8" asChild>
              <Link to="/#demo">Try the Demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
