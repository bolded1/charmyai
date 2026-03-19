import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowRight, CheckCircle2, Shield, Lock, Sparkles, Clock,
  FileText, Zap, Eye, Download, Brain,
} from "lucide-react";
import { DemoUploader } from "@/components/demo/DemoUploader";
import { MarketingCTA } from "@/components/MarketingCTA";
import { useTranslation } from "react-i18next";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function DemoPage() {
  const { t } = useTranslation();

  return (
    <div>
      <section className="pt-24 md:pt-28 pb-4 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(152 63% 32% / 0.5), transparent 70%)' }} />
        <div className="absolute top-[10%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(17 69% 60% / 0.5), transparent 70%)' }} />
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.06, 0.12, 0.06] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[900px] h-[400px] rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, hsl(172 66% 40% / 0.25), transparent 70%)' }} />

        <div className="container max-w-3xl text-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            {t("demo.badge", "Live Demo — No Sign Up Required")}
          </motion.div>

          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-5">
            {t("demo.heroTitle1", "See Charmy")} <span className="text-gradient">{t("demo.heroTitle2", "in action")}</span>
          </motion.h1>

          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            {t("demo.heroDesc", "Upload any invoice or receipt and watch Charmy extract supplier details, amounts, VAT, dates, and more — in seconds.")}
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-12">
            {[
              { icon: Lock, text: t("marketing.noAccountRequired") },
              { icon: Shield, text: t("marketing.deletedAfterProcessing") },
              { icon: Clock, text: t("demo.resultsIn30s", "Results in under 30 seconds") },
            ].map((badge) => (
              <div key={badge.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                <badge.icon className="h-3.5 w-3.5 text-primary" />
                <span>{badge.text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="mt-10">
          <DemoUploader />
        </motion.div>
      </section>

      <section className="py-20">
        <div className="container max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t("demo.whatExtracts1", "What Charmy")} <span className="text-gradient">{t("demo.whatExtracts2", "extracts")}</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {t("demo.whatExtractsDesc", "Upload a document above and Charmy will automatically identify and extract these fields.")}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: FileText, label: t("documents.supplier"), example: "CloudTech GmbH", color: "icon-bg-blue" },
              { icon: FileText, label: t("documents.invoiceNumber"), example: "INV-2026-0847", color: "icon-bg-violet" },
              { icon: Clock, label: t("demo.invoiceDueDates", "Invoice & Due Dates"), example: "Feb 28 → Mar 30", color: "icon-bg-teal" },
              { icon: Brain, label: t("demo.netVatAmounts", "Net & VAT Amounts"), example: "€2,450 + €465.50", color: "icon-bg-amber" },
              { icon: Zap, label: t("documents.totalAmount"), example: "€2,915.50", color: "icon-bg-emerald" },
              { icon: Shield, label: t("demo.vatCurrency", "VAT Number & Currency"), example: "DE123456789 · EUR", color: "icon-bg-rose" },
            ].map((field, i) => (
              <motion.div key={field.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
                className={`p-4 rounded-2xl ${field.color} border border-border/30 hover:scale-[1.03] transition-transform duration-200`}>
                <div className="flex items-center gap-3 mb-2">
                  <field.icon className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{field.label}</span>
                </div>
                <div className="text-sm font-bold tabular-nums">{field.example}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
        <div className="container max-w-4xl relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("demo.howDemoWorks", "How the demo works")}</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "1", title: t("demo.step1Title", "Upload a document"), desc: t("demo.step1Desc", "Drag and drop or click to upload any invoice, receipt, or bill. PDF, JPG, and PNG supported up to 10MB."), icon: FileText },
              { step: "2", title: t("demo.step2Title", "AI reads your document"), desc: t("demo.step2Desc", "Charmy's AI analyzes the document, identifies key fields, and extracts structured financial data in seconds."), icon: Eye },
              { step: "3", title: t("demo.step3Title", "Review the results"), desc: t("demo.step3Desc", "See every extracted field clearly presented. That's exactly what the full platform does — at scale, with exports and team collaboration."), icon: CheckCircle2 },
            ].map((item, i) => (
              <motion.div key={item.step} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className="text-center">
                <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
                  className="h-14 w-14 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/20">
                  <item.icon className="h-6 w-6 text-primary-foreground" />
                </motion.div>
                <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Step {item.step}</div>
                <h3 className="text-base font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <MarketingCTA />
    </div>
  );
}
