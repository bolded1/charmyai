import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, Sparkles, Shield, Zap, Globe } from "lucide-react";
import { MarketingCTA } from "@/components/MarketingCTA";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

export default function AboutPage() {
  const { t } = useTranslation();

  const stats = [
    { stat: "10,000+", label: t("about.docsProcessed", "Documents Processed") },
    { stat: "500+", label: t("about.activeUsers", "Active Users") },
    { stat: "95%", label: t("about.accuracy", "Extraction Accuracy") },
    { stat: "< 30s", label: t("about.avgProcessing", "Average Processing") },
  ];

  const values = [
    { icon: Target, title: t("about.accuracyFirst", "Accuracy First"), desc: t("about.accuracyFirstDesc", "We obsess over extraction accuracy because your financial data must be correct. Every decimal matters.") },
    { icon: Sparkles, title: t("about.simplicityByDesign", "Simplicity by Design"), desc: t("about.simplicityDesc", "Complex technology, simple experience. We believe powerful tools should feel effortless to use.") },
    { icon: Shield, title: t("about.securityPrivacy", "Security & Privacy"), desc: t("about.securityPrivacyDesc", "GDPR-compliant from day one. Your documents are encrypted, protected, and never shared.") },
    { icon: Zap, title: t("about.speedEfficiency", "Speed & Efficiency"), desc: t("about.speedEfficiencyDesc", "Process documents in seconds, not hours. We're building the fastest invoice processing platform.") },
  ];

  return (
    <div>
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-25 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(351 63% 37% / 0.6), transparent 70%)' }} />
        <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(17 69% 60% / 0.4), transparent 70%)' }} />
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[40%] right-[15%] w-[250px] h-[250px] rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(172 66% 40% / 0.4), transparent 70%)' }} />

        <div className="container max-w-4xl relative z-10">
          <motion.div {...fadeUp()} className="text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-primary bg-primary/10 px-3 py-1 rounded-full mb-6">
              <Globe className="h-3.5 w-3.5" />
              {t("about.ourStory", "Our Story")}
            </span>
          </motion.div>
          <motion.h1 {...fadeUp(0.1)} className="text-4xl md:text-6xl font-bold text-center leading-tight">
            {t("about.whyExists1", "Why Charmy")} <span className="text-gradient">{t("about.whyExists2", "exists")}</span>
          </motion.h1>
          <motion.p {...fadeUp(0.2)} className="text-lg md:text-xl text-muted-foreground text-center mt-6 max-w-2xl mx-auto leading-relaxed">
            {t("about.heroDesc", "Accounting teams spend too much time manually entering invoice data. Charmy was created to eliminate repetitive financial document processing.")}
          </motion.p>
        </div>
      </section>

      <section className="py-2">
        <div className="container max-w-4xl">
          <motion.div {...fadeUp()} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <motion.div key={s.label} {...fadeUp(i * 0.1)}
                className="surface-elevated rounded-2xl p-6 text-center border border-border/50 hover:border-primary/20 transition-colors group">
                <div className="text-3xl md:text-4xl font-bold text-gradient mb-1">{s.stat}</div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <motion.div {...fadeUp()}>
              <span className="text-xs font-semibold tracking-wider uppercase text-primary mb-3 block">{t("about.mission")}</span>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                {t("about.missionSimple1", "Our mission is")} <span className="text-gradient">{t("about.missionSimple2", "simple")}</span>
              </h2>
            </motion.div>
            <motion.div {...fadeUp(0.15)} className="space-y-5 text-muted-foreground leading-relaxed">
              <p className="text-lg font-medium text-foreground">
                {t("about.missionStatement", "Turn financial documents into structured accounting data automatically.")}
              </p>
              <p>{t("about.missionP1", "Charmy was born from a simple observation: accountants and finance teams spend an enormous amount of time manually entering data from invoices and receipts into spreadsheets and accounting systems.")}</p>
              <p>{t("about.missionP2", "With advances in AI and document understanding, we saw an opportunity to automate this entire workflow. Upload a document, let AI extract the data, review it, and export it — all in minutes instead of hours.")}</p>
              <p>{t("about.missionP3", "Our team combines expertise in AI, fintech, and accounting to build a platform that truly understands financial documents and the needs of accounting professionals.")}</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 relative">
        <div className="absolute inset-0 surface-sunken" />
        <div className="container max-w-4xl relative z-10">
          <motion.div {...fadeUp()} className="text-center mb-14">
            <span className="text-xs font-semibold tracking-wider uppercase text-primary mb-3 block">{t("about.whatDrivesUs", "What Drives Us")}</span>
            <h2 className="text-3xl md:text-4xl font-bold">
              {t("about.builtOnValues1", "Built on")} <span className="text-gradient">{t("about.builtOnValues2", "core values")}</span>
            </h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <motion.div key={v.title} {...fadeUp(i * 0.1)}
                className="surface-elevated rounded-2xl p-6 border border-border/50 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all group">
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                  className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <v.icon className="h-5 w-5 text-primary" />
                </motion.div>
                <h3 className="font-semibold text-foreground mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <MarketingCTA />
    </div>
  );
}
