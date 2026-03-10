import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles, CreditCard, Building2, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import ctaInvoice from "@/assets/cta-invoice.png";
import ctaEmail from "@/assets/cta-email.png";
import ctaAi from "@/assets/cta-ai.png";

export function MarketingCTA() {
  const { t } = useTranslation();

  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-gradient" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(circle at 20% 40%, hsl(262 83% 58% / 0.5), transparent 50%), radial-gradient(circle at 80% 60%, hsl(172 66% 40% / 0.4), transparent 50%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsla(0,0%,100%,0.3) 1px, transparent 1px), linear-gradient(90deg, hsla(0,0%,100%,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <motion.img src={ctaInvoice} alt="" aria-hidden className="absolute hidden md:block w-28 lg:w-36 top-8 left-[5%] lg:left-[10%] opacity-80 select-none pointer-events-none drop-shadow-2xl"
        animate={{ y: [0, -14, 0], rotate: [-3, 2, -3] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
      <motion.img src={ctaEmail} alt="" aria-hidden className="absolute hidden md:block w-24 lg:w-32 bottom-10 left-[8%] lg:left-[14%] opacity-70 select-none pointer-events-none drop-shadow-2xl"
        animate={{ y: [0, 12, 0], rotate: [2, -3, 2] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />
      <motion.img src={ctaAi} alt="" aria-hidden className="absolute hidden md:block w-24 lg:w-32 top-12 right-[6%] lg:right-[11%] opacity-75 select-none pointer-events-none drop-shadow-2xl"
        animate={{ y: [0, -10, 0], rotate: [0, 8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }} />

      <motion.div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsla(0,0%,100%,0.08), transparent 70%)" }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />

      <div className="container text-center max-w-3xl relative z-10">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-primary-foreground text-xs font-semibold mb-6">
          <Sparkles className="h-3 w-3" />
          {t("marketing.ctaBadge")}
        </motion.div>

        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 text-primary-foreground leading-tight">
          {t("marketing.startProcessing")}
        </motion.h2>

        <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
          className="text-primary-foreground/75 mb-10 max-w-lg mx-auto text-base md:text-lg">
          {t("marketing.ctaDesc")}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.25 }}
          className="grid sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-10">
          <motion.div whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-5 text-left">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary-foreground">{t("pricing.proPlan")}</p>
                <p className="text-lg font-bold text-primary-foreground">€29.99</p>
              </div>
            </div>
            <p className="text-xs text-primary-foreground/65 mb-4 leading-relaxed">{t("marketing.proCtaDesc")}</p>
            <div className="space-y-1.5 mb-4">
              {["Unlimited documents", "AI data extraction", "Email import"].map((f) => (
                <div key={f} className="flex items-center gap-2 text-[11px] text-primary-foreground/80">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <Button size="sm" variant="secondary" asChild className="w-full rounded-xl text-sm shadow-lg">
              <Link to="/activate-trial?plan=pro">
                Get Pro — €29.99 <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </motion.div>

          <motion.div whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-5 text-left relative overflow-hidden">
            <div className="absolute top-0 right-0 px-2.5 py-0.5 rounded-bl-lg bg-white/15 text-[9px] font-bold text-primary-foreground uppercase tracking-wider">
              {t("marketing.multiClient")}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-white/15 flex items-center justify-center">
                <Building2 className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary-foreground">{t("pricing.firmPlan")}</p>
                <p className="text-lg font-bold text-primary-foreground">€99</p>
              </div>
            </div>
            <p className="text-xs text-primary-foreground/65 mb-4 leading-relaxed">{t("marketing.firmCtaDesc")}</p>
            <div className="space-y-1.5 mb-4">
              {["10 client workspaces", "Workspace switching", "All Pro features"].map((f) => (
                <div key={f} className="flex items-center gap-2 text-[11px] text-primary-foreground/80">
                  <CheckCircle2 className="h-3 w-3 shrink-0" />
                  {f}
                </div>
              ))}
            </div>
            <Button size="sm" variant="secondary" asChild className="w-full rounded-xl text-sm shadow-lg">
              <Link to="/activate-trial?plan=firm">
                {t("pricing.firmPlan")} — €99 <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.35 }}>
          <Button size="lg" variant="ghost" className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10 text-base px-8 border border-white/15" asChild>
            <Link to="/demo">{t("marketing.tryDemo")}</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
