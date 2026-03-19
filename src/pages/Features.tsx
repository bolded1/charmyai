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
  Send, Link2, ClipboardList, ExternalLink,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import quickbooksLogo from "@/assets/quickbooks-logo.png";
import xeroLogo from "@/assets/xero-logo.png";
import freshbooksLogo from "@/assets/freshbooks-logo.png";

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
  const { t } = useTranslation();

  const features: Omit<FeatureSectionProps, "index">[] = [
    {
      title: t("features.uploadTitle"),
      description: t("features.uploadDesc"),
      capabilities: [
        { icon: Upload, text: t("features.uploadCap1") },
        { icon: FileText, text: t("features.uploadCap2") },
        { icon: CheckCircle2, text: t("features.uploadCap3") },
        { icon: Zap, text: t("features.uploadCap4") },
      ],
      visual: (
        <VisualCard>
          <div className="rounded-xl border-2 border-dashed border-border p-8 text-center">
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="h-14 w-14 rounded-2xl bg-brand-soft flex items-center justify-center mx-auto mb-4">
              <Upload className="h-7 w-7 text-primary-icon" />
            </motion.div>
            <p className="font-medium text-sm mb-1">{t("features.dropInvoicesHere")}</p>
            <p className="text-xs text-muted-foreground">PDF · PNG · JPG</p>
          </div>
          <div className="mt-4 space-y-2">
            {["invoice-march-2026.pdf", "receipt-coffee.jpg", "supplier-bill.pdf"].map((f, i) => (
              <motion.div key={f} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-accent/50 border border-border/50">
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
      title: t("features.emailTitle"),
      description: t("features.emailDesc"),
      capabilities: [
        { icon: Inbox, text: t("features.emailCap1") },
        { icon: Mail, text: t("features.emailCap2") },
        { icon: Zap, text: t("features.emailCap3") },
        { icon: FileText, text: t("features.emailCap4") },
      ],
      reversed: true,
      visual: (
        <VisualCard>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 border border-border/50">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="h-8 w-8 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                <Mail className="h-4 w-4 text-primary-icon" />
              </motion.div>
              <div className="min-w-0">
                <p className="text-xs font-medium">{t("features.yourImportAddress")}</p>
                <p className="text-[11px] text-muted-foreground font-mono truncate">docs-a7x9k@imports.charmy.app</p>
              </div>
            </div>
            <div className="border-l-2 border-border ml-4 pl-4 space-y-3">
              {[
                { from: "accounting@supplier.com", subject: "Invoice #4821", status: t("features.imported") },
                { from: "bills@cloudhost.io", subject: "Monthly hosting", status: t("features.importProcessing") },
              ].map((email) => (
                <motion.div key={email.subject} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  className="p-3 rounded-lg bg-accent/30 border border-border/40">
                  <p className="text-[11px] text-muted-foreground">{email.from}</p>
                  <p className="text-xs font-medium mt-0.5">{email.subject}</p>
                  <span className={`inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full ${email.status === t("features.imported") ? "bg-brand-soft text-primary" : "bg-accent text-muted-foreground"}`}>
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
      title: t("features.aiTitle"),
      description: t("features.aiDesc"),
      capabilities: [
        { icon: Brain, text: t("features.aiCap1") },
        { icon: FileText, text: t("features.aiCap2") },
        { icon: BarChart3, text: t("features.aiCap3") },
        { icon: Shield, text: t("features.aiCap4") },
      ],
      visual: (
        <VisualCard>
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">{t("features.extractedFields")}</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Supplier", value: "CloudTech GmbH" },
              { label: "Invoice #", value: "INV-2026-0847" },
              { label: "Date", value: "Feb 28, 2026" },
              { label: "Currency", value: "EUR" },
              { label: "Subtotal", value: "€2,450.00" },
              { label: "VAT", value: "€465.50" },
            ].map((f, i) => (
              <motion.div key={f.label} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className="p-2.5 rounded-lg bg-accent/50 border border-border/40">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</div>
                <div className="text-sm font-semibold mt-0.5 tabular-nums">{f.value}</div>
              </motion.div>
            ))}
          </div>
          <div className="mt-3 p-3 rounded-lg border border-border bg-brand-soft/50 flex items-center justify-between">
            <span className="text-sm font-semibold">{t("common.total")}</span>
            <span className="text-lg font-bold text-primary tabular-nums">€2,915.50</span>
          </div>
        </VisualCard>
      ),
    },
    {
      title: t("features.reviewTitle"),
      description: t("features.reviewDesc"),
      capabilities: [
        { icon: Eye, text: t("features.reviewCap1") },
        { icon: Edit3, text: t("features.reviewCap2") },
        { icon: Zap, text: t("features.reviewCap3") },
        { icon: CheckCircle2, text: t("features.reviewCap4") },
      ],
      reversed: true,
      visual: (
        <VisualCard className="p-0 overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="p-5">
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">{t("features.preview")}</div>
              <div className="aspect-[3/4] rounded-lg bg-accent/50 border border-border/50 flex items-center justify-center">
                <FileText className="h-10 w-10 text-muted-foreground/30" />
              </div>
            </div>
            <div className="p-5 space-y-2.5">
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">{t("features.fields")}</div>
              {[
                { label: "Supplier", value: "CloudTech GmbH" },
                { label: "Invoice #", value: "INV-0847" },
                { label: "Amount", value: "€2,915.50" },
                { label: "Status", value: t("documents.needsReview") },
              ].map((f) => (
                <div key={f.label}>
                  <div className="text-[10px] text-muted-foreground">{f.label}</div>
                  <div className="text-xs font-medium mt-0.5 p-1.5 rounded bg-accent/50 border border-border/40">{f.value}</div>
                </div>
              ))}
              <Button size="sm" className="w-full mt-3 text-xs">{t("common.approve")}</Button>
            </div>
          </div>
        </VisualCard>
      ),
    },
    {
      title: t("features.catTitle"),
      description: t("features.catDesc"),
      capabilities: [
        { icon: Tag, text: t("features.catCap1") },
        { icon: Search, text: t("features.catCap2") },
        { icon: Filter, text: t("features.catCap3") },
        { icon: FolderOpen, text: t("features.catCap4") },
      ],
      visual: (
        <VisualCard>
          <div className="flex gap-2 mb-4">
            <div className="flex-1 h-8 rounded-md bg-accent/50 border border-border/50 flex items-center px-3">
              <Search className="h-3.5 w-3.5 text-muted-foreground mr-2" />
              <span className="text-xs text-muted-foreground">{t("features.searchDocuments")}</span>
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
              <motion.div key={doc.num} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 border border-border/40">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{doc.name}</p>
                  <p className="text-[10px] text-muted-foreground">{doc.num}</p>
                </div>
                <span className="text-xs font-semibold tabular-nums">{doc.amount}</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-soft text-primary shrink-0">{doc.category}</span>
              </motion.div>
            ))}
          </div>
        </VisualCard>
      ),
    },
    {
      title: t("features.exportTitle"),
      description: t("features.exportDesc"),
      capabilities: [
        { icon: Download, text: t("features.exportCap1") },
        { icon: FileText, text: t("features.exportCap2") },
        { icon: BarChart3, text: t("features.exportCap3") },
        { icon: Zap, text: t("features.exportCap4") },
      ],
      reversed: true,
      visual: (
        <VisualCard>
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">{t("exports.exportOptions")}</div>
          <div className="space-y-3">
            {[
              { format: t("exports.exportCsv"), desc: t("exports.csvDesc"), icon: FileText },
              { format: t("exports.exportExcel"), desc: t("exports.excelDesc"), icon: BarChart3 },
              { format: t("exports.downloadReport"), desc: t("exports.reportDesc"), icon: Download },
            ].map((exp, i) => (
              <motion.div key={exp.format} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 border border-border/40">
                <div className="h-8 w-8 rounded-lg bg-brand-soft flex items-center justify-center shrink-0">
                  <exp.icon className="h-4 w-4 text-primary-icon" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium">{exp.format}</p>
                  <p className="text-[10px] text-muted-foreground">{exp.desc}</p>
                </div>
                <Button variant="outline" size="sm" className="text-[10px] h-7 px-3">{t("common.export")}</Button>
              </motion.div>
            ))}
          </div>
        </VisualCard>
      ),
    },
    {
      title: t("features.docRequestTitle", "Document Requests"),
      description: t("features.docRequestDesc", "Request documents directly from your clients through secure, tokenised links. Clients upload files without needing an account — submissions land straight in your workspace, ready for review."),
      capabilities: [
        { icon: Send, text: t("features.docRequestCap1", "Send requests via email with one click") },
        { icon: ExternalLink, text: t("features.docRequestCap2", "Clients upload via secure public link") },
        { icon: ClipboardList, text: t("features.docRequestCap3", "Track request status in real time") },
        { icon: CheckCircle2, text: t("features.docRequestCap4", "Auto-route uploads to correct workspace") },
      ],
      visual: (
        <VisualCard>
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">Pending Requests</div>
          <div className="space-y-3">
            {[
              { client: "Maria K.", doc: "Q1 VAT receipts", status: "Pending", statusColor: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
              { client: "Nikos P.", doc: "Bank statement — Feb", status: "Uploaded", statusColor: "bg-brand-soft text-primary" },
              { client: "Anna D.", doc: "Payroll summary", status: "Overdue", statusColor: "bg-destructive/10 text-destructive" },
            ].map((req, i) => (
              <motion.div key={req.doc} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 border border-border/40">
                <div className="h-8 w-8 rounded-full bg-accent border border-border flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                  {req.client.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{req.doc}</p>
                  <p className="text-[10px] text-muted-foreground">{req.client}</p>
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${req.statusColor}`}>{req.status}</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg border border-dashed border-border bg-accent/20 text-center">
            <p className="text-[11px] text-muted-foreground">Clients upload via <span className="font-medium text-foreground">secure link</span> — no account needed</p>
          </div>
        </VisualCard>
      ),
    },
    {
      title: t("features.integrationsTitle", "Accounting Integrations"),
      description: t("features.integrationsDesc", "Connect your favourite accounting platform and push expenses and invoices directly to your ledger. One-click sync keeps everything in one place."),
      reversed: true,
      capabilities: [
        { icon: Link2, text: t("features.integrationsCap1", "One-click OAuth connection") },
        { icon: Zap, text: t("features.integrationsCap2", "Push expenses & invoices instantly") },
        { icon: ArrowLeftRight, text: t("features.integrationsCap3", "Two-way sync status tracking") },
        { icon: Shield, text: t("features.integrationsCap4", "Secure token-based authentication") },
      ],
      visual: (
        <VisualCard>
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">Connected Platforms</div>
          <div className="space-y-3">
            {[
              { name: "QuickBooks Online", logo: quickbooksLogo, connected: true },
              { name: "Xero", logo: xeroLogo, connected: false },
              { name: "FreshBooks", logo: freshbooksLogo, connected: false },
            ].map((platform, i) => (
              <motion.div key={platform.name} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-lg border ${platform.connected ? "bg-brand-soft/30 border-primary/20" : "bg-accent/30 border-border/40"}`}>
                <div className="h-10 w-10 rounded-xl bg-white border border-border flex items-center justify-center shrink-0 overflow-hidden p-1.5">
                  <img src={platform.logo} alt={platform.name} className="h-full w-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{platform.name}</p>
                  <p className="text-[10px] text-muted-foreground">{platform.connected ? "Connected · Last sync 2h ago" : "Not connected"}</p>
                </div>
                {platform.connected ? (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-soft text-primary flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Active
                  </span>
                ) : (
                  <Button variant="outline" size="sm" className="text-[10px] h-7 px-3">Connect</Button>
                )}
              </motion.div>
            ))}
          </div>
        </VisualCard>
      ),
    },
    {
      title: t("features.contactsTitle", "Contact Management"),
      description: t("features.contactsDesc", "Automatically build a supplier and customer directory from your invoices. View per-contact financial breakdowns, manage details, and export everything in one click."),
      capabilities: [
        { icon: BookUser, text: t("features.contactsCap1", "Auto-populated from extracted invoices") },
        { icon: Search, text: t("features.contactsCap2", "Search and filter your contact list") },
        { icon: BarChart3, text: t("features.contactsCap3", "Per-currency financial breakdowns") },
        { icon: Download, text: t("features.contactsCap4", "Export contacts as ZIP archive") },
      ],
      reversed: true,
      visual: (
        <VisualCard>
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">Contact Directory</div>
          <div className="space-y-2.5">
            {[
              { name: "CloudTech GmbH", type: "Supplier", total: "€12,450.00", invoices: 8, color: "hsl(var(--primary))" },
              { name: "Riverside Bakery", type: "Customer", total: "€8,320.00", invoices: 5, color: "hsl(172 66% 40%)" },
              { name: "Nordic Design Co", type: "Supplier", total: "€3,680.50", invoices: 3, color: "hsl(265 55% 55%)" },
            ].map((contact, i) => (
              <motion.div key={contact.name} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-accent/30 border border-border/40">
                <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: contact.color }}>
                  {contact.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{contact.name}</p>
                  <p className="text-[10px] text-muted-foreground">{contact.invoices} invoices · {contact.type}</p>
                </div>
                <span className="text-xs font-semibold tabular-nums">{contact.total}</span>
              </motion.div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "Total Contacts", value: "42" },
              { label: "Suppliers", value: "28" },
              { label: "Customers", value: "14" },
            ].map((stat) => (
              <div key={stat.label} className="p-2 rounded-lg bg-brand-soft/50 border border-border/30 text-center">
                <div className="text-sm font-bold text-primary tabular-nums">{stat.value}</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </VisualCard>
      ),
    },
    {
      title: t("features.reportsTitle", "Reports & Analytics"),
      description: t("features.reportsDesc", "Visualise your income, expenses, and net profit with interactive charts. Filter by time period and currency, then export professional PDF reports with one click."),
      capabilities: [
        { icon: PieChart, text: t("features.reportsCap1", "Expense breakdown by category") },
        { icon: TrendingUp, text: t("features.reportsCap2", "Revenue vs expenses trend charts") },
        { icon: Filter, text: t("features.reportsCap3", "Filter by period and currency") },
        { icon: FileBarChart, text: t("features.reportsCap4", "One-click professional PDF export") },
      ],
      visual: (
        <VisualCard>
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">Financial Overview</div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "Income", value: "€24,580", trend: "+12%", positive: true },
              { label: "Expenses", value: "€18,240", trend: "+5%", positive: false },
              { label: "Net Profit", value: "€6,340", trend: "+28%", positive: true },
            ].map((metric) => (
              <div key={metric.label} className="p-2.5 rounded-lg bg-accent/50 border border-border/40 text-center">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{metric.label}</div>
                <div className="text-sm font-bold mt-0.5 tabular-nums">{metric.value}</div>
                <div className={`text-[10px] font-semibold mt-0.5 ${metric.positive ? "text-primary" : "text-destructive"}`}>{metric.trend}</div>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-accent/30 border border-border/40">
            <div className="flex items-end gap-1.5 h-20 justify-between px-1">
              {[
                { income: 60, expense: 45 },
                { income: 75, expense: 50 },
                { income: 55, expense: 60 },
                { income: 80, expense: 55 },
                { income: 70, expense: 48 },
                { income: 90, expense: 65 },
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex items-end gap-0.5">
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: `${bar.income}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.5 }}
                    className="flex-1 rounded-t-sm bg-primary/70"
                  />
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: `${bar.expense}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.35 + i * 0.08, duration: 0.5 }}
                    className="flex-1 rounded-t-sm bg-muted-foreground/25"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-sm bg-primary/70" />
                <span className="text-[9px] text-muted-foreground">Income</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-sm bg-muted-foreground/25" />
                <span className="text-[9px] text-muted-foreground">Expenses</span>
              </div>
            </div>
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
            {t("features.heroTitle").split("<1>")[0]}{" "}
            <span className="text-gradient">{t("features.heroTitle").split("<1>")[1]?.split("</1>")[0]}</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            {t("features.heroDesc")}
          </motion.p>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild className="text-base px-8">
              <Link to="/signup">{t("features.getStartedPrice")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="text-base px-8">
              <Link to="/demo">{t("marketing.tryDemo")}</Link>
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
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-5">
              <Building2 className="h-3.5 w-3.5" />
              {t("features.firmSectionBadge")}
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.1] mb-5">
              {t("features.firmSectionTitle").split("<1>")[0]}
              <span className="text-gradient">{t("features.firmSectionTitle").split("<1>")[1]?.split("</1>")[0]}</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
              {t("features.firmSectionDesc")}
            </p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="mb-20">
            <div className="surface-elevated rounded-2xl border border-border p-6 md:p-8 overflow-hidden">
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-5">{t("features.firmDashboard")}</div>
              <div className="flex items-center gap-2 mb-6 p-2 rounded-xl bg-accent/40 border border-border/40">
                {["All Workspaces", "Active (6)", "Archived (1)"].map((tab, i) => (
                  <motion.button key={tab} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1 }}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${i === 0 ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                    {tab}
                  </motion.button>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { name: "ABC Consulting", docs: 47, color: "hsl(var(--primary))" },
                  { name: "Smith & Partners", docs: 23, color: "hsl(220 70% 55%)" },
                  { name: "Tech Solutions BV", docs: 89, color: "hsl(150 60% 45%)" },
                  { name: "Riverside Bakery", docs: 12, color: "hsl(30 80% 55%)" },
                  { name: "Nordic Design Co", docs: 34, color: "hsl(280 60% 55%)" },
                  { name: "GreenLeaf BV", docs: 56, color: "hsl(100 50% 45%)" },
                ].map((ws, i) => (
                  <motion.div key={ws.name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.08, duration: 0.4 }} whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="p-4 rounded-xl bg-card border border-border/60 cursor-pointer group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: ws.color }}>
                        {ws.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{ws.name}</p>
                        <p className="text-[10px] text-muted-foreground">{ws.docs} {t("common.documents")}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-1.5">
                        {[0, 1].map((a) => (<div key={a} className="h-5 w-5 rounded-full bg-accent border-2 border-card" />))}
                      </div>
                      <span className="text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        {t("common.open")} <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {[
              { icon: Layers, title: t("features.separateWorkspaces"), desc: t("features.separateWorkspacesDesc") },
              { icon: ArrowLeftRight, title: t("features.instantSwitching"), desc: t("features.instantSwitchingDesc") },
              { icon: UserCheck, title: t("features.clientCollaboration"), desc: t("features.clientCollaborationDesc") },
              { icon: Brain, title: t("features.organizedData"), desc: t("features.organizedDataDesc") },
              { icon: FileOutput, title: t("features.exportPerClient"), desc: t("features.exportPerClientDesc") },
              { icon: Shield, title: t("features.dataIsolation"), desc: t("features.dataIsolationDesc") },
            ].map((feat, i) => (
              <motion.div key={feat.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.45 }}
                className="surface-elevated rounded-2xl border border-border p-6 group hover:border-primary/30 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-brand-soft flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <feat.icon className="h-5 w-5 text-primary-icon" />
                </div>
                <h3 className="font-semibold mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="glass-card rounded-2xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-primary mb-3">
                  <Building2 className="h-3.5 w-3.5" />
                  {t("features.accountingFirmPlan")}
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-3">{t("features.firmManage")}</h3>
                <p className="text-muted-foreground leading-relaxed mb-4 max-w-lg">{t("features.firmManageDesc")}</p>
                <ul className="flex flex-wrap gap-x-6 gap-y-2 mb-6">
                  {t("features.firmPlanItems").split(",").map((item: string) => (
                    <li key={item} className="flex items-center gap-2 text-sm font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button size="lg" asChild className="text-base px-8">
                  <Link to="/payment?plan=firm">{t("features.getFirmPlan")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
              <div className="shrink-0">
                <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="h-24 w-24 rounded-3xl bg-hero-gradient flex items-center justify-center shadow-xl shadow-primary/20">
                  <Building2 className="h-10 w-10 text-primary-foreground" />
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20">
        <div className="container max-w-3xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center glass-card rounded-2xl p-10 md:p-14 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="h-14 w-14 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/20">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">{t("marketing.tryInstantly")}</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">{t("marketing.tryInstantlyDesc")}</p>
            <Button size="lg" asChild className="text-base px-8">
              <Link to="/demo">{t("marketing.tryDemo")} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <MarketingCTA />
    </div>
  );
}
