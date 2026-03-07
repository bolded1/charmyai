import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  FileText, Zap, Shield, Download, ArrowRight, CheckCircle2,
  Upload, Brain, ClipboardCheck, Star, ChevronRight
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="py-20 md:py-32">
        <div className="container text-center max-w-4xl">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
            <Zap className="h-3.5 w-3.5" />
            AI-Powered Document Processing
          </motion.div>
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            Turn Invoices and Receipts into{" "}
            <span className="text-gradient">Accounting Data</span> Automatically
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Upload invoices, receipts, and financial documents. AI reads them, extracts key data,
            and prepares everything for your accountant.
          </motion.p>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="text-base px-8">
              <Link to="/signup">Start Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="text-base px-8">
              <Link to="/features">See How It Works</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="border-y bg-card py-8">
        <div className="container">
          <p className="text-center text-sm text-muted-foreground mb-6">Trusted by accounting teams at</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-muted-foreground/40 font-bold text-xl">
            {["FinanceHub", "LedgerPro", "AccuBooks", "TaxFlow", "BizTrack"].map((n) => (
              <span key={n}>{n}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="py-20">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Manual data entry is <span className="text-destructive">costing you hours</span></h2>
              <p className="text-muted-foreground mb-6">
                Accountants spend up to 40% of their time on manual document processing. Copying invoice numbers,
                amounts, and dates into spreadsheets is tedious, error-prone, and expensive.
              </p>
              <ul className="space-y-3">
                {["Mistyped amounts cause reconciliation issues", "Hours wasted on repetitive data entry", "Documents pile up at month-end"].map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive mt-2 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="surface-elevated rounded-xl p-8">
              <h3 className="text-xl font-semibold mb-4 text-gradient">DocuLedger automates it all</h3>
              <ul className="space-y-4">
                {[
                  "Upload any invoice or receipt",
                  "AI extracts all financial fields",
                  "Review and approve in seconds",
                  "Export ready-made accounting data",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 surface-sunken">
        <div className="container max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            Three simple steps to turn your documents into structured accounting data.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Upload, title: "Upload Documents", desc: "Drag and drop invoices, receipts, or scanned documents. PDF, PNG, JPG supported." },
              { icon: Brain, title: "AI Extracts Data", desc: "Our AI reads each document and extracts supplier, amounts, dates, VAT, and more." },
              { icon: ClipboardCheck, title: "Review & Export", desc: "Verify extracted data, make corrections, and export accounting-ready CSV files." },
            ].map((step, i) => (
              <motion.div key={step.title} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i} className="surface-elevated rounded-xl p-6 text-center">
                <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Step {i + 1}</div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20">
        <div className="container max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "AI Data Extraction", desc: "Automatically capture supplier, amounts, dates, VAT and more from any document." },
              { icon: FileText, title: "Document Classification", desc: "Auto-detect document types: expense invoices, sales invoices, receipts, credit notes." },
              { icon: Shield, title: "Review & Approve", desc: "Verify every extracted field before saving. Full control over your data." },
              { icon: Download, title: "Accountant-Ready Exports", desc: "Export structured CSV files with all financial data for your accounting system." },
              { icon: Zap, title: "Instant Processing", desc: "Documents are processed in seconds, not hours. Upload and go." },
              { icon: Star, title: "Smart Contacts", desc: "Auto-link documents to suppliers and customers. Build your contact database." },
            ].map((f, i) => (
              <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i} className="surface-elevated rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 surface-sunken">
        <div className="container max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Simple Pricing</h2>
          <p className="text-center text-muted-foreground mb-12">Start free. Upgrade when you need more.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Starter", price: "Free", desc: "For individuals", features: ["50 documents/mo", "AI extraction", "CSV export", "1 user"] },
              { name: "Professional", price: "€49", desc: "For growing teams", features: ["500 documents/mo", "Everything in Starter", "Team access (5 users)", "Priority support"], popular: true },
              { name: "Enterprise", price: "€149", desc: "For large organizations", features: ["Unlimited documents", "Everything in Pro", "Unlimited users", "API access", "Dedicated support"] },
            ].map((plan) => (
              <div key={plan.name} className={`surface-elevated rounded-xl p-6 ${plan.popular ? 'ring-2 ring-primary relative' : ''}`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Most Popular
                  </span>
                )}
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
                <div className="text-3xl font-bold mb-1">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                <ul className="space-y-2 my-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />{f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What Our Users Say</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { quote: "DocuLedger cut our invoice processing time by 80%. What used to take our team a full day now happens in an hour.", name: "Maria Schmidt", role: "CFO, TechStart GmbH" },
              { quote: "Finally, a tool that understands accounting documents. The AI extraction is remarkably accurate.", name: "Thomas Weber", role: "Senior Accountant, Weber & Partners" },
            ].map((t) => (
              <div key={t.name} className="surface-elevated rounded-xl p-6">
                <div className="flex gap-1 mb-4">{[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-primary text-primary" />)}</div>
                <p className="text-sm mb-4 italic">"{t.quote}"</p>
                <div><div className="font-semibold text-sm">{t.name}</div><div className="text-xs text-muted-foreground">{t.role}</div></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-hero-gradient">
        <div className="container text-center max-w-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
            Ready to automate your accounting prep?
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Start processing documents in minutes. No credit card required.
          </p>
          <Button size="lg" variant="secondary" asChild className="text-base px-8">
            <Link to="/signup">Start Free Trial <ChevronRight className="ml-1 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
