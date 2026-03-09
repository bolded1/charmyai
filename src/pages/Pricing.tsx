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
    name: "Pro",
    price: "€29.99",
    period: "one-time",
    desc: "Everything you need to process invoices and manage expenses effortlessly.",
    features: STRIPE_PLANS.pro.features,
    current: subscription?.plan === "pro",
  };

  const firmPlan = {
    name: "Accounting Firm",
    price: "€99",
    period: "one-time",
    desc: "For accountants and bookkeeping firms. Manage up to 10 client companies from one account.",
    features: STRIPE_PLANS.firm.features,
    current: subscription?.plan === "firm",
  };

  const firmFaqs = [
    { q: "What is included in the Accounting Firm plan?", a: "The Accounting Firm plan gives you access to a dedicated accountant dashboard inside Charmy, where you can create and manage up to 10 separate client workspaces. Each workspace represents a different client or company and keeps documents, data, and exports fully separated." },
    { q: "How many client workspaces are included?", a: "The plan includes up to 10 client workspaces. This allows you to manage invoices, receipts, and financial documents for up to 10 different client companies from one Charmy account." },
    { q: "Can I create separate workspaces for each customer?", a: "Yes. Each client can have their own dedicated workspace with separate documents, settings, contacts, exports, and financial data." },
    { q: "Can my team access multiple client workspaces?", a: "Yes. You can invite team members and assign them access to one or more client workspaces depending on their role." },
    { q: "What happens when I reach 10 workspaces?", a: "Once you reach your workspace limit, you will not be able to create additional workspaces unless extra capacity is granted. Future upgrades or additional workspace packs can be added later." },
    { q: "Is the €99 fee one-time or recurring?", a: "The Accounting Firm plan is a €99 one-time fee. There are no recurring charges — you pay once and get lifetime access to up to 10 client workspaces." },
    { q: "Can I buy more workspaces later?", a: "Yes. The system is designed to support future add-on workspace packs or upgraded firm plans for firms that need more capacity." },
    { q: "Can I export data separately for each client?", a: "Yes. Each client workspace is fully isolated, so you can export financial data — invoices, expenses, and reports — separately for each company." },
  ];

  const faqs = [
    { q: "Is the Pro plan a one-time payment?", a: "Yes. The Pro plan is a one-time payment of €29.99. There are no recurring charges — you pay once and get lifetime access to all Pro features." },
    { q: "Can I cancel or get a refund?", a: "Since the Pro plan is a one-time purchase, there are no recurring charges to cancel. If you have any issues, please contact our support team." },
    { q: "What counts as a processed document?", a: "A processed document is any invoice, receipt, or financial document that Charmy reads and extracts financial data from — including supplier invoices, purchase receipts, expense documents, and income invoices." },
    { q: "Can accountants use Charmy for multiple clients?", a: "Yes. With the Accounting Firm plan, you get up to 10 separate client workspaces. Each workspace is fully isolated — documents, expenses, and exports stay separate per client." },
    { q: "What is the Accounting Firm plan?", a: "The Accounting Firm plan is a one-time purchase of €99 that gives you access to up to 10 client workspaces inside Charmy. It includes all Pro features plus multi-workspace management, an accountant dashboard, and team access." },
    { q: "Can I change my plan later?", a: "Yes. You can upgrade from Pro to the Accounting Firm plan at any time to get multi-workspace support." },
    { q: "Is my financial data secure?", a: "Yes. Charmy processes documents using secure cloud infrastructure and encrypted connections. Security measures include SSL encrypted data transfer, secure cloud infrastructure, and GDPR-compliant data handling. Your financial documents are only accessible to your account." },
    { q: "Can I try Charmy before paying?", a: "Yes. You can test Charmy instantly by uploading a sample invoice on the homepage demo. This allows you to see how the AI extracts financial data before purchasing." },
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

      {/* Plan cards */}
      <section className="relative pb-10">
        <div className="container max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Pro Plan */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }} className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 via-violet-500/10 to-teal-400/10 rounded-3xl blur-xl opacity-60" />
              <div className="relative glass-card rounded-2xl p-8 border border-primary/20 h-full flex flex-col">
                {proPlan.current && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg">Your Current Plan</span>
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
                  {proPlan.savings && (
                    <motion.p key={billingCycle} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-emerald-600 font-medium mt-1">
                      {proPlan.savings}
                    </motion.p>
                  )}
                </div>
                <p className="text-center text-xs text-muted-foreground mb-8">7-day free trial included · Cancel anytime</p>
                {proPlan.current ? (
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
              <div className="absolute -inset-1 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-rose-400/10 rounded-3xl blur-xl opacity-60" />
              <div className="relative glass-card rounded-2xl p-8 border border-amber-500/20 h-full flex flex-col">
                {firmPlan.current && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full bg-amber-600 text-white text-xs font-semibold shadow-lg">Your Current Plan</span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 text-[11px] font-semibold mb-4">
                    <Building2 className="h-3.5 w-3.5" />
                    For accountants & bookkeeping firms
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
                <p className="text-center text-xs text-muted-foreground mb-8">One-time payment · Lifetime access</p>
                {firmPlan.current ? (
                  <Button className="w-full h-12 text-base rounded-xl border-amber-500/30" variant="outline" onClick={() => subscription?.openCustomerPortal()}>
                    Manage Plan
                  </Button>
                ) : (
                  <Button className="w-full h-12 text-base rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 transition-opacity" disabled={!!checkoutLoading}
                    onClick={() => handleCheckout(STRIPE_PLANS.firm.price_id)}>
                    {checkoutLoading === STRIPE_PLANS.firm.price_id ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : <>Start with 10 Client Workspaces <ArrowRight className="h-4 w-4 ml-2" /></>}
                  </Button>
                )}
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
                  <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground font-medium">Everything included</span></div>
                </div>
                <div className="grid grid-cols-1 gap-3 flex-1">
                  {firmPlan.features.map((f) => {
                    const Icon = firmFeatureIcons[f] || CheckCircle2;
                    return (
                      <div key={f} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-amber-500/5 transition-colors">
                        <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-amber-600" />
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
            <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-amber-500/10 mx-auto">
              <Building2 className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold">Why accountants choose Charmy</h3>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Accountants often receive piles of invoices from multiple clients. Instead of chasing files across emails, folders, and spreadsheets — process client invoices in dedicated workspaces and export clean financial data faster.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
              The <span className="font-semibold text-foreground">Accounting Firm</span> plan is a one-time purchase of <span className="font-semibold text-foreground">€99</span> that gives you access to up to 10 client workspaces inside Charmy. Each workspace keeps documents fully separated, searchable, and ready to export.
            </p>
            <p className="text-xs text-muted-foreground pt-1">
              Ideal for firms managing documents for multiple clients from one central platform.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="pb-16">
        <div className="container max-w-3xl">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
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

      {/* Firm FAQ */}
      <section className="py-20 md:py-28 border-t border-border/50">
        <div className="container max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-semibold mb-5">
              <Building2 className="h-3.5 w-3.5" />
              Accounting Firm Plan
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Firm Plan <span className="text-gradient">FAQ</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Everything you need to know about managing multiple client workspaces.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.5 }}>
            <Accordion type="single" collapsible className="w-full">
              {firmFaqs.map((faq, i) => (
                <AccordionItem key={i} value={`firm-faq-${i}`} className="border-b border-border/50 last:border-b-0">
                  <AccordionTrigger className="text-left text-[15px] font-semibold py-5 hover:no-underline hover:text-amber-700 transition-colors [&[data-state=open]]:text-amber-700">
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
              Common Questions
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Everything you need to know about pricing, billing, and your free trial.
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
