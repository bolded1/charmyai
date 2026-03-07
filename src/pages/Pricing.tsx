import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const plans = [
  {
    name: "Starter", price: "Free", period: "forever",
    desc: "Perfect for freelancers and individuals getting started.",
    features: ["50 documents per month", "AI data extraction", "CSV export", "1 user", "Email support"],
  },
  {
    name: "Professional", price: "€49", period: "/month",
    desc: "For growing teams that need more power and collaboration.",
    features: ["500 documents per month", "Everything in Starter", "Team access (up to 5 users)", "Priority email support", "Contacts management", "Custom export templates"],
    popular: true,
  },
  {
    name: "Enterprise", price: "€149", period: "/month",
    desc: "For large organizations with high-volume processing needs.",
    features: ["Unlimited documents", "Everything in Professional", "Unlimited users", "API access", "Dedicated account manager", "Custom integrations", "SSO authentication"],
  },
];

export default function PricingPage() {
  return (
    <div>
      <section className="py-20">
        <div className="container max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-muted-foreground">Start free. Upgrade as you grow. No hidden fees.</p>
        </div>
      </section>

      <section className="pb-20">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div key={plan.name} className={`surface-elevated rounded-xl p-8 flex flex-col ${plan.popular ? 'ring-2 ring-primary relative' : ''}`}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    Most Popular
                  </span>
                )}
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-6">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
                  <Link to="/signup">{plan.price === "Free" ? "Get Started Free" : "Start Free Trial"}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-t">
        <div className="container max-w-3xl text-center">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="text-left space-y-6 mt-8">
            {[
              { q: "Can I switch plans later?", a: "Yes, you can upgrade or downgrade at any time. Changes take effect immediately." },
              { q: "What document formats are supported?", a: "We support PDF, PNG, and JPG files. Scanned documents work too." },
              { q: "Is my data secure?", a: "Yes. All documents are encrypted at rest and in transit. We never share your data." },
              { q: "Do I need a credit card to start?", a: "No. The Starter plan is completely free with no credit card required." },
            ].map((faq) => (
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
