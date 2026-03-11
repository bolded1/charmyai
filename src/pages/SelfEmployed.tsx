import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Receipt,
  Clock,
  CheckCircle2,
  Mail,
  Download,
  Shield,
  ArrowRight,
  Wallet,
  FileText,
  HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingCTA } from "@/components/MarketingCTA";
import { useTranslation } from "react-i18next";
import ctaInvoice from "@/assets/cta-invoice.png";
import ctaEmail from "@/assets/cta-email.png";
import ctaAi from "@/assets/cta-ai.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

export default function SelfEmployedPage() {
  const { t } = useTranslation();

  const pains = [
    { icon: Clock, title: t("selfEmployed.pain1Title"), desc: t("selfEmployed.pain1Desc") },
    { icon: Receipt, title: t("selfEmployed.pain2Title"), desc: t("selfEmployed.pain2Desc") },
    { icon: Wallet, title: t("selfEmployed.pain3Title"), desc: t("selfEmployed.pain3Desc") },
  ];

  const benefits = [
    { icon: FileText, title: t("selfEmployed.benefit1Title"), desc: t("selfEmployed.benefit1Desc") },
    { icon: Mail, title: t("selfEmployed.benefit2Title"), desc: t("selfEmployed.benefit2Desc") },
    { icon: CheckCircle2, title: t("selfEmployed.benefit3Title"), desc: t("selfEmployed.benefit3Desc") },
    { icon: Download, title: t("selfEmployed.benefit4Title"), desc: t("selfEmployed.benefit4Desc") },
  ];

  const steps = [
    { icon: Receipt, title: t("selfEmployed.step1Title"), desc: t("selfEmployed.step1Desc") },
    { icon: Sparkles, title: t("selfEmployed.step2Title"), desc: t("selfEmployed.step2Desc") },
    { icon: Download, title: t("selfEmployed.step3Title"), desc: t("selfEmployed.step3Desc") },
  ];

  return (
    <div>
      <section className="relative pt-24 md:pt-32 pb-20 overflow-hidden">
        <div className="absolute top-[-25%] left-[-10%] w-[560px] h-[560px] rounded-full opacity-25 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, hsl(224 76% 48% / 0.5), transparent 70%)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[480px] h-[480px] rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, hsl(262 83% 58% / 0.35), transparent 70%)" }} />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.14, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[18%] right-[15%] w-[320px] h-[320px] rounded-full blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, hsl(172 66% 40% / 0.35), transparent 70%)" }}
        />

        <motion.img
          src={ctaInvoice}
          alt=""
          aria-hidden
          className="absolute hidden lg:block w-28 top-28 left-[8%] opacity-80 pointer-events-none select-none drop-shadow-2xl"
          animate={{ y: [0, -12, 0], rotate: [-4, 2, -4] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.img
          src={ctaEmail}
          alt=""
          aria-hidden
          className="absolute hidden lg:block w-24 bottom-14 left-[12%] opacity-75 pointer-events-none select-none drop-shadow-2xl"
          animate={{ y: [0, 10, 0], rotate: [3, -2, 3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
        />
        <motion.img
          src={ctaAi}
          alt=""
          aria-hidden
          className="absolute hidden lg:block w-24 top-20 right-[10%] opacity-75 pointer-events-none select-none drop-shadow-2xl"
          animate={{ y: [0, -10, 0], rotate: [0, 7, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        />

        <div className="container max-w-5xl relative z-10">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
            <div>
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
                <HeartHandshake className="h-3.5 w-3.5" />
                {t("selfEmployed.badge")}
              </motion.div>

              <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.06] mb-5">
                {t("selfEmployed.heroTitle1")} <span className="text-gradient">{t("selfEmployed.heroTitle2")}</span>
              </motion.h1>

              <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
                className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl">
                {t("selfEmployed.heroDesc")}
              </motion.p>

              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
                className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Button asChild size="lg" className="h-12 px-7 rounded-2xl bg-hero-gradient hover:opacity-90 transition-all duration-300 shadow-xl shadow-primary/25 text-base font-semibold">
                  <Link to="/signup">
                    {t("selfEmployed.primaryCta")}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-12 px-7 rounded-2xl border-border/60 text-base">
                  <Link to="/demo">{t("selfEmployed.secondaryCta")}</Link>
                </Button>
              </motion.div>

              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4}
                className="mt-6 flex flex-wrap gap-3 text-sm text-muted-foreground">
                {[t("selfEmployed.heroPoint1"), t("selfEmployed.heroPoint2"), t("selfEmployed.heroPoint3")].map((text) => (
                  <div key={text} className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-background/70 border border-border/50 backdrop-blur-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    <span>{text}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={5}>
              <div className="surface-elevated rounded-[28px] border border-border/60 p-5 md:p-6 shadow-xl shadow-primary/5">
                <div className="grid gap-4">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
                    className="rounded-2xl bg-accent/40 border border-border/50 p-4"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-xl icon-bg-violet flex items-center justify-center">
                        <Receipt className="h-4.5 w-4.5 text-violet" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{t("selfEmployed.visual1Title")}</div>
                        <div className="text-xs text-muted-foreground">{t("selfEmployed.visual1Desc")}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        t("selfEmployed.visualField1"),
                        t("selfEmployed.visualField2"),
                        t("selfEmployed.visualField3"),
                        t("selfEmployed.visualField4"),
                      ].map((label, i) => (
                        <div key={label} className="flex items-center justify-between rounded-xl bg-background/80 border border-border/40 px-3 py-2">
                          <span className="text-xs text-muted-foreground">{label}</span>
                          <motion.span
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 2, repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}
                            className="text-xs font-semibold"
                          >
                            {[
                              t("selfEmployed.visualValue1"),
                              t("selfEmployed.visualValue2"),
                              t("selfEmployed.visualValue3"),
                              t("selfEmployed.visualValue4"),
                            ][i]}
                          </motion.span>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <motion.div
                      animate={{ y: [0, 6, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.25 }}
                      className="rounded-2xl bg-primary/5 border border-primary/15 p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">{t("selfEmployed.visual2Title")}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{t("selfEmployed.visual2Desc")}</p>
                    </motion.div>

                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 4.4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                      className="rounded-2xl bg-emerald-500/5 border border-emerald-500/15 p-4"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-semibold">{t("selfEmployed.visual3Title")}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{t("selfEmployed.visual3Desc")}</p>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
        <div className="container max-w-5xl relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("selfEmployed.painTitle")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t("selfEmployed.painIntro")}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {pains.map((item, i) => (
              <motion.div key={item.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="glass-card rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.25 }}
                  className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-primary" />
                </motion.div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <span className="text-xs font-semibold tracking-wider uppercase text-primary mb-3 block">{t("selfEmployed.benefitsLabel")}</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("selfEmployed.benefitsTitle")}</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">{t("selfEmployed.benefitsIntro")}</p>
              <div className="space-y-4">
                {benefits.map((item, i) => (
                  <motion.div key={item.title} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3 p-3 rounded-2xl bg-accent/30 border border-border/40">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-bold mb-1">{item.title}</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">{item.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
              <div className="surface-elevated rounded-3xl p-6 md:p-7 border border-border/60">
                <div className="mb-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-2">
                    {t("selfEmployed.stepsEyebrow")}
                  </div>
                  <h3 className="text-2xl font-bold">{t("selfEmployed.stepsTitle")}</h3>
                </div>

                <div className="space-y-4">
                  {steps.map((step, i) => (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      className="relative rounded-2xl bg-background border border-border/50 p-4 md:p-5"
                    >
                      {i < steps.length - 1 && (
                        <div className="absolute left-[1.55rem] top-[4.4rem] bottom-[-1.25rem] w-px bg-border/70" />
                      )}

                      <div className="flex items-start gap-4">
                        <div className="shrink-0">
                          <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: i * 0.35 }}
                            className="h-12 w-12 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-lg shadow-primary/15"
                          >
                            <step.icon className="h-5 w-5 text-white" />
                          </motion.div>
                        </div>

                        <div className="min-w-0 pt-0.5">
                          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary mb-2">
                            {t("common.step", { defaultValue: "Step" })} {i + 1}
                          </div>
                          <h4 className="text-base font-bold mb-1.5">{step.title}</h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 surface-sunken" />
        <div className="container max-w-4xl relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            className="text-center surface-elevated rounded-3xl border border-border/60 p-8 md:p-10">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t("selfEmployed.reassuranceTitle")}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-6">{t("selfEmployed.reassuranceDesc")}</p>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              {[t("selfEmployed.reassurancePoint1"), t("selfEmployed.reassurancePoint2"), t("selfEmployed.reassurancePoint3")].map((text) => (
                <div key={text} className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-primary/5 border border-primary/10">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <MarketingCTA />
    </div>
  );
}
