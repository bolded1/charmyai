import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Upload, Mail, Search, ClipboardCheck, Download,
  ArrowRight, CheckCircle2, FileText, Clock, Receipt,
  FolderOpen, ChevronRight, Sparkles, Zap, Shield,
  Smartphone, Monitor, Share, Plus, MoreVertical,
} from "lucide-react";
import { DemoUploader } from "@/components/demo/DemoUploader";
import { usePageContent } from "@/hooks/usePageContent";
import { homepageDefaults } from "@/lib/cms-defaults";

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
  const { content: c } = usePageContent("homepage", homepageDefaults);

  const steps = [
    { title: c.step1Title, desc: c.step1Desc },
    { title: c.step2Title, desc: c.step2Desc },
    { title: c.step3Title, desc: c.step3Desc },
    { title: c.step4Title, desc: c.step4Desc },
  ];

  const benefits = [
    { icon: Clock, text: c.benefit1, color: "icon-bg-blue", textColor: "text-primary" },
    { icon: Receipt, text: c.benefit2, color: "icon-bg-violet", textColor: "text-violet" },
    { icon: Mail, text: c.benefit3, color: "icon-bg-teal", textColor: "text-teal" },
    { icon: Download, text: c.benefit4, color: "icon-bg-amber", textColor: "text-amber" },
    { icon: FolderOpen, text: c.benefit5, color: "icon-bg-emerald", textColor: "text-emerald" },
    { icon: Shield, text: c.benefit6, color: "icon-bg-rose", textColor: "text-rose" },
  ];

  return (
    <div>
      {/* ═══ Hero with Demo ═══ */}
      <section className="pt-16 md:pt-24 pb-8 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(224 76% 48% / 0.5), transparent 70%)' }} />
        <div className="absolute top-[10%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(262 83% 58% / 0.5), transparent 70%)' }} />

        <div className="container max-w-4xl text-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            {c.badge}
          </motion.div>
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-5">
            {c.heroTitle}{" "}
            <span className="text-gradient">{c.heroTitleGradient}</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            {c.heroSubtitle}
          </motion.p>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="text-sm text-muted-foreground mb-10">
            {c.heroDisclaimer}
          </motion.p>
        </div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}>
          <DemoUploader />
        </motion.div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
        <div className="container max-w-5xl relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{c.howItWorksTitle}</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">{c.howItWorksSubtitle}</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div key={step.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="glass-card rounded-2xl p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className={`h-12 w-12 rounded-2xl ${stepIcons[i].gradient} flex items-center justify-center mx-auto mb-4 shadow-lg ${stepIcons[i].shadow}`}>
                  {(() => { const Icon = stepIcons[i].icon; return <Icon className="h-5 w-5 text-white" />; })()}
                </div>
                <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Step {i + 1}</div>
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
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {c.fieldsTitle} <span className="text-gradient">{c.fieldsTitleGradient}</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">{c.fieldsSubtitle}</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="glass-card rounded-2xl p-6 md:p-8">
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
                <div key={field.label} className={`p-3 rounded-xl ${field.color} border border-border/30 hover:scale-105 transition-transform duration-200`}>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{field.label}</div>
                  <div className="text-sm font-bold tabular-nums">{field.example}</div>
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
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {c.benefitsTitle} <span className="text-gradient">{c.benefitsTitleGradient}</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {benefits.map((b, i) => (
              <motion.div key={b.text} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="flex items-center gap-4 p-4 glass-card rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className={`h-10 w-10 rounded-xl ${b.color} flex items-center justify-center shrink-0`}>
                  <b.icon className={`h-5 w-5 ${b.textColor}`} />
                </div>
                <span className="text-sm font-semibold">{b.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Install as App ═══ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
        <div className="container max-w-5xl relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-5">
              <Smartphone className="h-3.5 w-3.5" />
              Progressive Web App
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Install Charmy on <span className="text-gradient">Any Device</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              No app store needed. Add Charmy to your home screen or desktop for instant access, offline support, and a native app experience.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {/* Chrome / Edge */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="glass-card rounded-2xl p-6 text-center group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="h-14 w-14 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/20"
              >
                <Monitor className="h-7 w-7 text-white" />
              </motion.div>
              <h3 className="text-sm font-bold mb-2">Chrome / Edge</h3>
              <div className="space-y-2.5 text-left">
                <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-primary">1</span>
                  </div>
                  <span>Click the <strong className="text-foreground">install icon</strong> in the address bar</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-primary">2</span>
                  </div>
                  <span>Click <strong className="text-foreground">"Install"</strong> in the prompt</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-primary">3</span>
                  </div>
                  <span>Charmy opens as a <strong className="text-foreground">standalone app</strong></span>
                </div>
              </div>
            </motion.div>

            {/* iOS Safari */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
              className="glass-card rounded-2xl p-6 text-center group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                className="h-14 w-14 rounded-2xl bg-gradient-cool flex items-center justify-center mx-auto mb-5 shadow-lg shadow-teal/20"
              >
                <Smartphone className="h-7 w-7 text-white" />
              </motion.div>
              <h3 className="text-sm font-bold mb-2">iPhone / iPad</h3>
              <div className="space-y-2.5 text-left">
                <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <div className="h-5 w-5 rounded-full bg-teal/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-teal">1</span>
                  </div>
                  <span>Tap the <strong className="text-foreground"><Share className="inline h-3 w-3" /> Share</strong> button in Safari</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <div className="h-5 w-5 rounded-full bg-teal/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-teal">2</span>
                  </div>
                  <span>Select <strong className="text-foreground"><Plus className="inline h-3 w-3" /> Add to Home Screen</strong></span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <div className="h-5 w-5 rounded-full bg-teal/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-teal">3</span>
                  </div>
                  <span>Launch from your <strong className="text-foreground">home screen</strong></span>
                </div>
              </div>
            </motion.div>

            {/* Android */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={3}
              className="glass-card rounded-2xl p-6 text-center group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                className="h-14 w-14 rounded-2xl bg-gradient-sunset flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet/20"
              >
                <Download className="h-7 w-7 text-white" />
              </motion.div>
              <h3 className="text-sm font-bold mb-2">Android</h3>
              <div className="space-y-2.5 text-left">
                <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <div className="h-5 w-5 rounded-full bg-violet/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-violet">1</span>
                  </div>
                  <span>Tap <strong className="text-foreground"><MoreVertical className="inline h-3 w-3" /> Menu</strong> in Chrome</span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <div className="h-5 w-5 rounded-full bg-violet/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-violet">2</span>
                  </div>
                  <span>Select <strong className="text-foreground">"Install app"</strong> or <strong className="text-foreground">"Add to Home Screen"</strong></span>
                </div>
                <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                  <div className="h-5 w-5 rounded-full bg-violet/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-violet">3</span>
                  </div>
                  <span>Charmy appears as a <strong className="text-foreground">native app</strong></span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* PWA features pills */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={4}
            className="flex flex-wrap justify-center gap-3 mt-10">
            {[
              { icon: Zap, label: "Instant Launch" },
              { icon: Shield, label: "Offline Ready" },
              { icon: Sparkles, label: "Auto Updates" },
              { icon: FileText, label: "Home Screen Icon" },
            ].map((feat) => (
              <div key={feat.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 text-xs font-semibold text-muted-foreground shadow-sm">
                <feat.icon className="h-3.5 w-3.5 text-primary" />
                {feat.label}
              </div>
            ))}
          </motion.div>
        </div>
      </section>


      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-gradient" />
        <div className="absolute inset-0 opacity-20" style={{ background: 'radial-gradient(circle at 30% 50%, hsl(262 83% 58% / 0.5), transparent 50%), radial-gradient(circle at 70% 50%, hsl(172 66% 40% / 0.3), transparent 50%)' }} />
        <div className="container text-center max-w-2xl relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
            {c.ctaTitle}{" "}
            <span className="opacity-90">{c.ctaTitleFaded}</span>
          </h2>
          <p className="text-primary-foreground/75 mb-8 max-w-md mx-auto">{c.ctaSubtitle}</p>
          <Button size="lg" variant="secondary" asChild className="text-base px-8 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <Link to="/signup">
              {c.ctaButton} <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
