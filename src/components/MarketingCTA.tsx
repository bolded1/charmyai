import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap, FileText, Mail } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import ctaInvoice from "@/assets/cta-invoice.png";
import ctaEmail from "@/assets/cta-email.png";
import ctaAi from "@/assets/cta-ai.png";

const floatingItems = [
  { label: "Invoice #2847", icon: FileText, delay: 0 },
  { label: "Receipt scanned", icon: Zap, delay: 1.2 },
  { label: "Email imported", icon: Mail, delay: 2.4 },
];

export function MarketingCTA() {
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-20 relative overflow-hidden">
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

      {/* Floating images */}
      <motion.img src={ctaInvoice} alt="" aria-hidden className="absolute hidden md:block w-28 lg:w-36 top-8 left-[5%] lg:left-[10%] opacity-80 select-none pointer-events-none drop-shadow-2xl"
        animate={{ y: [0, -14, 0], rotate: [-3, 2, -3] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
      <motion.img src={ctaEmail} alt="" aria-hidden className="absolute hidden md:block w-24 lg:w-32 bottom-10 left-[8%] lg:left-[14%] opacity-70 select-none pointer-events-none drop-shadow-2xl"
        animate={{ y: [0, 12, 0], rotate: [2, -3, 2] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />
      <motion.img src={ctaAi} alt="" aria-hidden className="absolute hidden md:block w-24 lg:w-32 top-12 right-[6%] lg:right-[11%] opacity-75 select-none pointer-events-none drop-shadow-2xl"
        animate={{ y: [0, -10, 0], rotate: [0, 8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }} />

      {/* Glowing orb */}
      <motion.div className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsla(0,0%,100%,0.08), transparent 70%)" }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />

      <div className="container text-center max-w-3xl relative z-10">
        {/* Badge */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-primary-foreground text-xs font-semibold mb-6">
          <Sparkles className="h-3 w-3" />
          {t("marketing.ctaBadge")}
        </motion.div>

        {/* Headline */}
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 text-primary-foreground leading-tight">
          {t("marketing.startProcessing")}
        </motion.h2>

        <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
          className="text-primary-foreground/75 mb-8 max-w-lg mx-auto text-base md:text-lg">
          {t("marketing.ctaDesc")}
        </motion.p>

        {/* Animated processing feed */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.25 }}
          className="flex flex-col items-center gap-3 mb-12">
          {floatingItems.map((item) => (
            <motion.div
              key={item.label}
              className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-primary-foreground"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 + item.delay * 0.15 }}
              animate={{
                y: [0, -4, 0],
                boxShadow: [
                  "0 0 0px hsla(0,0%,100%,0)",
                  "0 0 20px hsla(0,0%,100%,0.1)",
                  "0 0 0px hsla(0,0%,100%,0)",
                ],
              }}
              // @ts-ignore
              transition2={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: item.delay }}
            >
              <motion.div
                className="h-9 w-9 rounded-xl bg-white/15 flex items-center justify-center"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: item.delay }}
              >
                <item.icon className="h-4 w-4" />
              </motion.div>
              <span className="text-sm font-medium">{item.label}</span>
              <motion.div
                className="ml-2 h-2 w-2 rounded-full bg-emerald-400"
                animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: item.delay }}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" variant="secondary" asChild className="text-base px-8 rounded-xl shadow-lg h-12">
            <Link to="/signup">
              {t("marketing.getStartedPrice")} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="ghost" className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10 text-base px-8 border border-white/15 rounded-xl h-12" asChild>
            <Link to="/demo">{t("marketing.tryDemo")}</Link>
          </Button>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 }}
          className="text-primary-foreground/50 text-xs mt-6">
          {t("billing.oneTimePayment")} · {t("pricing.noSubscription")}
        </motion.p>
      </div>
    </section>
  );
}
