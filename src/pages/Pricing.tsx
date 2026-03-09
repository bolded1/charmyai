import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2, Loader2, Sparkles, Shield, Zap, Users, FileText,
  Mail, Download, FolderOpen, ChevronDown, ArrowRight,
} from "lucide-react";
import { useSubscription, STRIPE_PLANS } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

const featureIcons: Record<string, React.ElementType> = {
  "Unlimited documents": FileText,
  "AI data extraction": Sparkles,
  "Team access (up to 10 users)": Users,
  "Priority support": Zap,
  "Email import": Mail,
  "Custom export templates": Download,
  "Contacts management": FolderOpen,
  "CSV & Excel exports": Download,
};

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const { user } = useAuth();
  const subscription = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const navigate = useNavigate();

  const handleCheckout = async (priceId: string) => {
    if (!user) { navigate("/signup"); return; }
    setCheckoutLoading(priceId);
    try { await subscription?.startCheckout(priceId); }
    catch (err: any) { toast.error(err.message || "Failed to start checkout"); }
    finally { setCheckoutLoading(null); }
  };

  const proPriceId = billingCycle === "yearly"
    ? STRIPE_PLANS.pro.price_id_yearly
    : STRIPE_PLANS.pro.price_id_monthly;

  const plan = {
    name: "Pro",
    price: billingCycle === "monthly" ? "€9.99" : "€99",
    period: billingCycle === "monthly" ? "/month" : "/year",
    desc: "Everything you need to process invoices and manage expenses effortlessly.",
    features: STRIPE_PLANS.pro.features,
    current: subscription?.plan === "pro",
    savings: billingCycle === "yearly" ? "Save €20.88/year" : null,
  };

  const faqs = [
    { q: "Can I switch between monthly and yearly?", a: "Yes, you can switch at any time. Changes take effect immediately with prorated billing." },
    { q: "What happens after my trial ends?", a: "After your 7-day trial, you'll be charged automatically. You can cancel anytime before the trial ends." },
    { q: "What document formats are supported?", a: "We support PDF, PNG, and JPG files. Scanned documents work too." },
    { q: "Is my data secure?", a: "Yes. All documents are encrypted at rest and in transit. We never share your data." },
    { q: "Do I need a credit card for the trial?", a: "Yes, a credit card is required to start the trial, but you won't be charged until the 7-day trial period ends." },
  ];

  return (
    <div className="relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-br from-primary/8 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Hero */}
      <section className="relative pt-20 pb-12">
        <div className="container max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              7-day free trial · No commitment
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4">
              Save hours of manual bookkeeping
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Let Charmy process your invoices automatically so you can focus on more important work.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Billing toggle */}
      <section className="relative pb-6">
        <div className="container flex justify-center">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/80 backdrop-blur-sm border border-border/50">
            <button onClick={() => setBillingCycle("monthly")}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${billingCycle === "monthly" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              Monthly
            </button>
            <button onClick={() => setBillingCycle("yearly")}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${billingCycle === "yearly" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              Yearly
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">SAVE 17%</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Plan card */}
      <section className="relative pb-20">
        <div className="container max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }} className="relative">
            <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 via-violet-500/10 to-teal-400/10 rounded-3xl blur-xl opacity-60" />
            <div className="relative glass-card rounded-2xl p-8 md:p-10 border border-primary/20">
              {plan.current && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg">Your Current Plan</span>
                </div>
              )}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary/10 mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
              </div>
              <div className="text-center mb-2">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl md:text-6xl font-bold tracking-tight">{plan.price}</span>
                  <span className="text-muted-foreground text-lg">{plan.period}</span>
                </div>
                {plan.savings && (
                  <motion.p key={billingCycle} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-emerald-600 font-medium mt-1">
                    {plan.savings}
                  </motion.p>
                )}
              </div>
              <p className="text-center text-xs text-muted-foreground mb-8">7-day free trial included · Cancel anytime</p>
              {plan.current ? (
                <Button className="w-full h-12 text-base rounded-xl" variant="outline" onClick={() => subscription?.openCustomerPortal()}>
                  Manage Subscription
                </Button>
              ) : (
                <Button className="w-full h-12 text-base rounded-xl bg-hero-gradient hover:opacity-90 transition-opacity" disabled={!!checkoutLoading}
                  onClick={() => proPriceId && handleCheckout(proPriceId)}>
                  {checkoutLoading === proPriceId ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : <>Start 7-Day Free Trial <ArrowRight className="h-4 w-4 ml-2" /></>}
                </Button>
              )}
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
                <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground font-medium">Everything included</span></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {plan.features.map((f) => {
                  const Icon = featureIcons[f] || CheckCircle2;
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
      </section>

      {/* Trust bar */}
      <section className="pb-16">
        <div className="container max-w-3xl">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-muted-foreground">
            {["GDPR Compliant", "End-to-end encrypted", "Cancel anytime"].map((text) => (
              <div key={text} className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-primary" />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-t border-border/50">
        <div className="container max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full glass-card rounded-xl p-5 text-left group transition-all hover:shadow-md">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="font-semibold text-sm">{faq.q}</h4>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                  </div>
                  {openFaq === i && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="text-sm text-muted-foreground mt-3 leading-relaxed">
                      {faq.a}
                    </motion.p>
                  )}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo reminder */}
      <section className="py-16">
        <div className="container max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="glass-card rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl" />
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="mx-auto mb-4"
            >
              <Sparkles className="h-8 w-8 text-primary mx-auto" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-2">Try Charmy before signing up</h3>
            <p className="text-muted-foreground mb-6">Upload a sample invoice and see how Charmy extracts financial data instantly.</p>
            <Button size="lg" className="rounded-xl" asChild>
              <a href="/#demo-upload">Try Demo <ArrowRight className="h-4 w-4 ml-2" /></a>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
