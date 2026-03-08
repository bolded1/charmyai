import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MapPin, Phone, Send, MessageSquare, Clock, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { usePageContent } from "@/hooks/usePageContent";
import { contactDefaults } from "@/lib/cms-defaults";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const { content: c } = usePageContent("contact", contactDefaults);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Message sent! We'll get back to you soon.");
    }, 1000);
  };

  const contactCards = [
    { icon: Mail, title: c.cardEmailTitle, detail: c.email, href: `mailto:${c.email}` },
    { icon: Phone, title: c.cardPhoneTitle, detail: c.phone, href: `tel:${c.phone}` },
    { icon: MapPin, title: c.cardOfficeTitle, detail: c.office },
    { icon: Clock, title: c.cardHoursTitle, detail: c.hours },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-25 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(224 76% 48% / 0.6), transparent 70%)' }} />
        <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(262 83% 58% / 0.4), transparent 70%)' }} />

        <div className="container max-w-4xl relative z-10">
          <motion.div {...fadeUp()} className="text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-primary bg-primary/10 px-3 py-1 rounded-full mb-6">
              <MessageSquare className="h-3.5 w-3.5" />
              {c.heroBadge}
            </span>
          </motion.div>
          <motion.h1 {...fadeUp(0.1)} className="text-4xl md:text-6xl font-bold text-center leading-tight">
            {c.title}{" "}
            <span className="text-gradient">{c.titleGradient}</span>
          </motion.h1>
          <motion.p {...fadeUp(0.2)} className="text-lg md:text-xl text-muted-foreground text-center mt-6 max-w-2xl mx-auto leading-relaxed">
            {c.subtitle}
          </motion.p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="pb-8">
        <div className="container max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {contactCards.filter(card => card.detail).map((item, i) => (
              <motion.div
                key={item.title}
                {...fadeUp(i * 0.08)}
                className="surface-elevated rounded-2xl p-5 border border-border/50 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all text-center group"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/15 transition-colors">
                  <item.icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{item.title}</div>
                {item.href ? (
                  <a href={item.href} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">
                    {item.detail}
                  </a>
                ) : (
                  <div className="text-sm font-semibold text-foreground">{item.detail}</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Form section */}
      <section className="py-16 md:py-24">
        <div className="container max-w-4xl">
          <div className="grid md:grid-cols-5 gap-10 items-start">
            {/* Left info */}
            <motion.div {...fadeUp()} className="md:col-span-2 space-y-6">
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-primary mb-2 block">{c.formSectionLabel}</span>
                <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                  {c.formTitle}{" "}
                  <span className="text-gradient">{c.formTitleGradient}</span>
                </h2>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{c.formDescription}</p>
              </div>

              <div className="surface-elevated rounded-2xl p-5 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">{c.responseTitle}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.responseDescription}</p>
              </div>
            </motion.div>

            {/* Form */}
            <motion.form
              {...fadeUp(0.15)}
              onSubmit={handleSubmit}
              className="md:col-span-3 surface-elevated rounded-2xl p-6 md:p-8 space-y-5 border border-border/50"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">Name</Label>
                  <Input id="name" placeholder="Your name" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">Email</Label>
                  <Input id="email" type="email" placeholder="you@company.com" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="subject" className="text-xs font-medium text-muted-foreground">Subject</Label>
                <Input id="subject" placeholder="How can we help?" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs font-medium text-muted-foreground">Message</Label>
                <Textarea id="message" placeholder="Tell us more about your needs..." rows={5} required />
              </div>
              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
              <p className="text-[11px] text-muted-foreground/70 text-center">{c.formDisclaimer}</p>
            </motion.form>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl">
          <motion.div
            {...fadeUp()}
            className="text-center surface-elevated rounded-3xl p-10 md:p-14 border border-border/50 relative overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              {c.ctaTitle}{" "}
              <span className="text-gradient">{c.ctaTitleGradient}</span>
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">{c.ctaSubtitle}</p>
            <Button size="lg" asChild>
              <Link to="/signup">{c.ctaButton} <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
