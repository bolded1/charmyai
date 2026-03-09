import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail, MapPin, Phone, Send, MessageSquare, Clock, ArrowRight,
  DollarSign, HelpCircle, LifeBuoy, Handshake, Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Message sent! We'll get back to you soon.");
    }, 1000);
  };

  const contactCards = [
    { icon: Mail, title: "Email", detail: "hello@charmy.ai", href: "mailto:hello@charmy.ai" },
    { icon: Phone, title: "Phone", detail: "+49 30 1234567", href: "tel:+4930123456" },
    { icon: MapPin, title: "Office", detail: "Berlin, Germany" },
    { icon: Clock, title: "Hours", detail: "Mon–Fri, 9–18 CET" },
  ];

  const inquiryTypes = [
    { icon: DollarSign, title: "Sales inquiries", desc: "Pricing, plans, and enterprise options" },
    { icon: HelpCircle, title: "Product questions", desc: "Features, integrations, and capabilities" },
    { icon: LifeBuoy, title: "Support requests", desc: "Technical help and troubleshooting" },
    { icon: Handshake, title: "Partnership opportunities", desc: "Integrations and collaborations" },
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
              Get in Touch
            </span>
          </motion.div>
          <motion.h1 {...fadeUp(0.1)} className="text-4xl md:text-6xl font-bold text-center leading-tight">
            We're here to <span className="text-gradient">help</span>
          </motion.h1>
          <motion.p {...fadeUp(0.2)} className="text-lg md:text-xl text-muted-foreground text-center mt-6 max-w-2xl mx-auto leading-relaxed">
            Have questions about Charmy? Our team is ready to assist.
          </motion.p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="pb-8">
        <div className="container max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {contactCards.map((item, i) => (
              <motion.div key={item.title} {...fadeUp(i * 0.08)}
                className="surface-elevated rounded-2xl p-5 border border-border/50 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all text-center group">
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                  className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/15 transition-colors"
                >
                  <item.icon className="h-4 w-4 text-primary" />
                </motion.div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{item.title}</div>
                {item.href ? (
                  <a href={item.href} className="text-sm font-semibold text-foreground hover:text-primary transition-colors">{item.detail}</a>
                ) : (
                  <div className="text-sm font-semibold text-foreground">{item.detail}</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Inquiry types */}
      <section className="py-12">
        <div className="container max-w-4xl">
          <motion.div {...fadeUp()} className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">How can we help?</h2>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {inquiryTypes.map((item, i) => (
              <motion.div key={item.title} {...fadeUp(i * 0.08)}
                className="glass-card rounded-2xl p-5 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold mb-1">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Form section */}
      <section className="py-16 md:py-24">
        <div className="container max-w-4xl">
          <div className="grid md:grid-cols-5 gap-10 items-start">
            <motion.div {...fadeUp()} className="md:col-span-2 space-y-6">
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-primary mb-2 block">Send a Message</span>
                <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                  Tell us what <span className="text-gradient">you need</span>
                </h2>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  Whether you have a question about features, pricing, or anything else — our team is ready to help.
                </p>
              </div>
              <div className="surface-elevated rounded-2xl p-5 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">Fast Response Time</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We typically respond within 2–4 hours during business hours. For urgent matters, reach out via phone.
                </p>
              </div>
            </motion.div>

            <motion.form {...fadeUp(0.15)} onSubmit={handleSubmit}
              className="md:col-span-3 surface-elevated rounded-2xl p-6 md:p-8 space-y-5 border border-border/50">
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
                {loading ? "Sending..." : <><Send className="h-4 w-4 mr-2" /> Send Message</>}
              </Button>
              <p className="text-[11px] text-muted-foreground/70 text-center">By submitting this form, you agree to our Privacy Policy.</p>
            </motion.form>
          </div>
        </div>
      </section>

      <MarketingCTA />
    </div>
  );
}
