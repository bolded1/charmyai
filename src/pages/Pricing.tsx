import { useState } from "react";
import { MarketingCTA } from "@/components/MarketingCTA";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, Loader2, Sparkles, Shield, Zap, Users, FileText,
  Mail, Download, FolderOpen, ArrowRight, HelpCircle, Building2, LayoutDashboard, ArrowLeftRight,
} from "lucide-react";
import { useSubscription, STRIPE_PLANS } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const proFeatureIcons: Record<string, React.ElementType> = {
  "Unlimited documents": FileText,
  "AI data extraction": Sparkles,
  "Team access (up to 10 users)": Users,
  "Priority support": Zap,
  "Email import": Mail,
  "Custom export templates": Download,
  "Contacts management": FolderOpen,
  "CSV & Excel exports": Download,
};

const firmFeatureIcons: Record<string, React.ElementType> = {
  "Up to 10 client workspaces": Building2,
  "Accountant dashboard": LayoutDashboard,
  "Workspace switching": ArrowLeftRight,
  "Document processing per workspace": FileText,
  "Exports per workspace": Download,
  "Team access support": Users,
  "All Pro features included": Sparkles,
  "One-time payment — no recurring fees": Shield,
};

export default function PricingPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const subscription = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCheckout = async (priceId: string) => {
    if (!user) { navigate("/signup"); return; }
    setCheckoutLoading(priceId);
    try { await subscription?.startCheckout(priceId); }
    catch (err: any) { toast.error(err.message || "Failed to start checkout"); }
    finally { setCheckoutLoading(null); }
  };

  const proPlan = {
    name: t("pricing.proPlan"),
    price: "€29.99",
    period: t("pricing.oneTime"),
    desc: t("pricing.proDesc"),
    features: STRIPE_PLANS.pro.features,
    current: subscription?.plan === "pro",
  };

  const firmPlan = {
    name: t("pricing.firmPlan"),
    price: "€99",
    period: t("pricing.oneTime"),
    desc: t("pricing.firmDesc"),
    features: STRIPE_PLANS.firm.features,
    current: subscription?.plan === "firm",
  };

  const firmFaqs = [
    { q: t("pricing.firmFaq1Q"), a: t("pricing.firmFaq1A") },
    { q: t("pricing.firmFaq2Q"), a: t("pricing.firmFaq2A") },
    { q: t("pricing.firmFaq3Q"), a: t("pricing.firmFaq3A") },
    { q: t("pricing.firmFaq4Q"), a: t("pricing.firmFaq4A") },
    { q: t("pricing.firmFaq5Q"), a: t("pricing.firmFaq5A") },
    { q: t("pricing.firmFaq6Q"), a: t("pricing.firmFaq6A") },
    { q: t("pricing.firmFaq7Q"), a: t("pricing.firmFaq7A") },
    { q: t("pricing.firmFaq8Q"), a: t("pricing.firmFaq8A") },
  ];

  const faqs = [
    { q: t("pricing.faq1Q"), a: t("pricing.faq1A") },
    { q: t("pricing.faq2Q"), a: t("pricing.faq2A") },
    { q: t("pricing.faq3Q"), a: t("pricing.faq3A") },
    { q: t("pricing.faq4Q"), a: t("pricing.faq4A") },
    { q: t("pricing.faq5Q"), a: t("pricing.faq5A") },
    { q: t("pricing.faq6Q"), a: t("pricing.faq6A") },
    { q: t("pricing.faq7Q"), a: t("pricing.faq7A") },
    { q: t("pricing.faq8Q"), a: t("pricing.faq8A") },
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-primary/8 via-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Hero */}
      <section className="relative pt-20 pb-12">
        <div className="container max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              {t("pricing.badge")}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              {t("pricing.heroTitle")}
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              {t("pricing.heroDesc")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Plan cards */}
      <section className="relative pb-10">
        <div className="container max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Pro Plan */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }} className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 rounded-3xl blur-xl opacity-60" />
              <div className="relative glass-card rounded-2xl p-8 border border-primary/20 h-full flex flex-col">
                {proPlan.current && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg">{t("pricing.yourCurrentPlan")}</span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold">{proPlan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{proPlan.desc}</p>
                </div>
                <div className="text-center mb-2">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold tracking-tight">{proPlan.price}</span>
                    <span className="text-muted-foreground text-lg">{proPlan.period}</span>
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground mb-8">{t("billing.oneTimePayment")}</p>
                {proPlan.current ? (
                  <Button className="w-full h-12 text-base rounded-xl" variant="outline" onClick={() => subscription?.openCustomerPortal()}>
                    {t("billing.managePlan")}
                  </Button>
                ) : (
                  <Button className="w-full h-12 text-base rounded-xl bg-hero-gradient hover:opacity-90 transition-opacity" disabled={!!checkoutLoading}
                    onClick={() => handleCheckout(STRIPE_PLANS.pro.price_id)}>
                    {checkoutLoading === STRIPE_PLANS.pro.price_id ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("common.processing")}</> : <>{t("billing.getLifetimeAccess")} <ArrowRight className="h-4 w-4 ml-2" /></>}
                  </Button>
                )}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
                  <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground font-medium">{t("billing.everythingIncluded")}</span></div>
                </div>
                <div className="grid grid-cols-1 gap-3 flex-1">
                  {proPlan.features.map((f) => {
                    const Icon = proFeatureIcons[f] || CheckCircle2;
                    return (
                      <div key={f} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-primary/5 transition-colors">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{f}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Firm Plan */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }} className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 rounded-3xl blur-xl opacity-60" />
              <div className="relative glass-card rounded-2xl p-8 border border-primary/20 h-full flex flex-col">
                {firmPlan.current && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg">{t("pricing.yourCurrentPlan")}</span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-4">
                    <Building2 className="h-3.5 w-3.5" />
                    {t("pricing.firmBadge")}
                  </div>
                  <h3 className="text-2xl font-bold">{firmPlan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{firmPlan.desc}</p>
                </div>
                <div className="text-center mb-2">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold tracking-tight">{firmPlan.price}</span>
                    <span className="text-muted-foreground text-lg">{firmPlan.period}</span>
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground mb-8">{t("billing.oneTimePayment")}</p>
                {firmPlan.current ? (
                  <Button className="w-full h-12 text-base rounded-xl border-primary/30" variant="outline" onClick={() => subscription?.openCustomerPortal()}>
                    {t("billing.managePlan")}
                  </Button>
                ) : (
                  <Button className="w-full h-12 text-base rounded-xl bg-hero-gradient text-primary-foreground hover:opacity-90 transition-opacity" disabled={!!checkoutLoading}
                    onClick={() => handleCheckout(STRIPE_PLANS.firm.price_id)}>
                    {checkoutLoading === STRIPE_PLANS.firm.price_id ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t("common.processing")}</> : <>{t("pricing.startWith10")} <ArrowRight className="h-4 w-4 ml-2" /></>}
                  </Button>
                )}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
                  <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground font-medium">{t("billing.everythingIncluded")}</span></div>
                </div>
                <div className="grid grid-cols-1 gap-3 flex-1">
                  {firmPlan.features.map((f) => {
                    const Icon = firmFeatureIcons[f] || CheckCircle2;
                    return (
                      <div key={f} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-primary/5 transition-colors">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{f}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Firm plan explanation */}
      <section className="relative pb-20">
        <div className="container max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="glass-card rounded-2xl p-8 md:p-10 border border-border/50 text-center space-y-4">
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 mx-auto">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-lg font-bold">{t("pricing.whyAccountants")}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
              {t("pricing.whyAccountantsDesc1")}
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto" dangerouslySetInnerHTML={{ __html: t("pricing.whyAccountantsDesc2") }} />
            <p className="text-xs text-muted-foreground pt-1">
              {t("pricing.whyAccountantsNote")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="pb-16">
        <div className="container max-w-3xl">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-muted-foreground">
            {[t("pricing.gdprCompliant"), t("pricing.encrypted"), t("pricing.securePayments")].map((text) => (
              <div key={text} className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-primary" />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Firm FAQ */}
      <section className="py-20 md:py-28 border-t border-border/50">
        <div className="container max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-5">
              <Building2 className="h-3.5 w-3.5" />
              {t("pricing.firmPlan")}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t("pricing.firmFaqTitle")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {t("pricing.firmFaqDesc")}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.5 }}>
            <Accordion type="single" collapsible className="w-full">
              {firmFaqs.map((faq, i) => (
                <AccordionItem key={i} value={`firm-faq-${i}`} className="border-b border-border/50 last:border-b-0">
                  <AccordionTrigger className="text-left text-[15px] font-semibold py-5 hover:no-underline hover:text-primary transition-colors [&[data-state=open]]:text-primary">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      {/* General FAQ */}
      <section className="py-20 md:py-28 border-t border-border/50">
        <div className="container max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-5">
              <HelpCircle className="h-3.5 w-3.5" />
              {t("faq.badge")}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t("pricing.generalFaqTitle")}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {t("pricing.generalFaqDesc")}
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.5 }}>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border/50 last:border-b-0">
                  <AccordionTrigger className="text-left text-[15px] font-semibold py-5 hover:no-underline hover:text-primary transition-colors [&[data-state=open]]:text-primary">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </section>

      <MarketingCTA />
    </div>
  );
}
