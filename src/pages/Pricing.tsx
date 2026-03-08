import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useSubscription, STRIPE_PLANS } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { usePageContent } from "@/hooks/usePageContent";
import { pricingDefaults } from "@/lib/cms-defaults";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const { user } = useAuth();
  const subscription = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { content: c } = usePageContent("pricing", pricingDefaults);

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
    key: "pro", name: c.proTitle,
    price: billingCycle === "monthly" ? "€9.99" : "€99",
    period: billingCycle === "monthly" ? "/month" : "/year",
    desc: c.proDesc, features: STRIPE_PLANS.pro.features,
    current: subscription?.plan === "pro",
    savings: billingCycle === "yearly" ? "Save €20.88/year" : null,
  };

  const faqs = [
    { q: c.faq1Q, a: c.faq1A },
    { q: c.faq2Q, a: c.faq2A },
    { q: c.faq3Q, a: c.faq3A },
    { q: c.faq4Q, a: c.faq4A },
    { q: c.faq5Q, a: c.faq5A },
  ];

  return (
    <div>
      <section className="py-20">
        <div className="container max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{c.heroTitle}</h1>
          <p className="text-lg text-muted-foreground mb-8">{c.heroSubtitle}</p>
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted">
            <button onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${billingCycle === "monthly" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </button>
            <button onClick={() => setBillingCycle("yearly")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${billingCycle === "yearly" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}>
              Yearly <span className="text-xs text-primary ml-1">Save 17%</span>
            </button>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container max-w-3xl">
          <div className="grid md:grid-cols-2 gap-8">
            {plans.map((plan) => (
              <div key={plan.key} className={`surface-elevated rounded-xl p-8 flex flex-col ${plan.popular ? 'ring-2 ring-primary relative' : ''}`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">Most Popular</span>
                )}
                {plan.current && (
                  <span className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium">Your Plan</span>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-6">{plan.desc}</p>
                <div className="mb-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                {plan.savings && <p className="text-xs text-primary font-medium mb-5">{plan.savings}</p>}
                {!plan.savings && <div className="mb-5" />}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                {plan.key === "free" ? (
                  plan.current ? (
                    <Button className="w-full" variant="outline" disabled>Current Plan</Button>
                  ) : (
                    <Button className="w-full" variant="outline" asChild><Link to="/signup">Get Started Free</Link></Button>
                  )
                ) : (
                  plan.current ? (
                    <Button className="w-full" variant="outline" onClick={() => subscription?.openCustomerPortal()}>Manage Subscription</Button>
                  ) : (
                    <Button className="w-full" disabled={!!checkoutLoading} onClick={() => proPriceId && handleCheckout(proPriceId)}>
                      {checkoutLoading === proPriceId ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</> : "Start 14-Day Free Trial"}
                    </Button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-t">
        <div className="container max-w-3xl text-center">
          <h2 className="text-2xl font-bold mb-4">{c.faqTitle}</h2>
          <div className="text-left space-y-6 mt-8">
            {faqs.map((faq) => (
              <div key={faq.q} className="surface-elevated rounded-lg p-5">
                <h4 className="font-semibold text-sm">{faq.q}</h4>
                <p className="text-sm text-muted-foreground mt-1">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
