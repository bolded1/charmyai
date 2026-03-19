import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail, MapPin, Phone, Send, MessageSquare, Clock, ArrowRight,
  DollarSign, HelpCircle, LifeBuoy, Handshake, Sparkles, Loader2,
} from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { MarketingCTA } from "@/components/MarketingCTA";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

export default function ContactPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(t("contact.success"));
      formRef.current?.reset();
    }, 1000);
  };

  const contactCards = [
    { icon: Mail, title: t("contact.emailLabel", "Email"), detail: "hello@charmy.net", href: "mailto:hello@charmy.net" },
    { icon: Phone, title: t("contact.phoneLabel", "Phone"), detail: "+357 22270109", href: "tel:+35722270109" },
    { icon: MapPin, title: t("contact.officeLabel", "Office"), detail: t("contact.officeDetail", "Nicosia, Cyprus") },
    { icon: Clock, title: t("contact.hoursLabel", "Hours"), detail: t("contact.hoursDetail", "Mon–Fri, 9:00–18:00") },
  ];

  const inquiryTypes = [
    { icon: DollarSign, title: t("contact.salesInquiries", "Sales inquiries"), desc: t("contact.salesDesc", "Pricing, plans, and enterprise options") },
    { icon: HelpCircle, title: t("contact.productQuestions", "Product questions"), desc: t("contact.productDesc", "Features, integrations, and capabilities") },
    { icon: LifeBuoy, title: t("contact.supportRequests", "Support requests"), desc: t("contact.supportDesc", "Technical help and troubleshooting") },
    { icon: Handshake, title: t("contact.partnerships", "Partnership opportunities"), desc: t("contact.partnershipsDesc", "Integrations and collaborations") },
  ];

  return (
    <div>
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-25 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(152 63% 32% / 0.6), transparent 70%)' }} />
        <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(265 55% 55% / 0.4), transparent 70%)' }} />

        <div className="container max-w-4xl relative z-10">
          <motion.div {...fadeUp()} className="text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-primary bg-primary/10 px-3 py-1 rounded-full mb-6">
              <MessageSquare className="h-3.5 w-3.5" />
              {t("contact.heroTitle1")}
            </span>
          </motion.div>
          <motion.h1 {...fadeUp(0.1)} className="text-4xl md:text-6xl font-bold text-center leading-tight">
            {t("contact.weAreHere", "We're here to")} <span className="text-gradient">{t("contact.help", "help")}</span>
          </motion.h1>
          <motion.p {...fadeUp(0.2)} className="text-lg md:text-xl text-muted-foreground text-center mt-6 max-w-2xl mx-auto leading-relaxed">
            {t("contact.heroSubtitle", "Have questions about Charmy? Our team is ready to assist.")}
          </motion.p>
        </div>
      </section>

      <section className="pb-8">
        <div className="container max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {contactCards.map((item, i) => (
              <motion.div key={item.title} {...fadeUp(i * 0.08)}
                className="surface-elevated rounded-2xl p-5 border border-border/50 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all text-center group">
                <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                  className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/15 transition-colors">
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

      <section className="py-12">
        <div className="container max-w-4xl">
          <motion.div {...fadeUp()} className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">{t("contact.howCanWeHelp", "How can we help?")}</h2>
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

      <section className="py-16 md:py-24">
        <div className="container max-w-4xl">
          <div className="grid md:grid-cols-5 gap-10 items-start">
            <motion.div {...fadeUp()} className="md:col-span-2 space-y-6">
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-primary mb-2 block">{t("contact.sendMessage", "Send a Message")}</span>
                <h2 className="text-2xl md:text-3xl font-bold leading-tight">
                  {t("contact.tellUsWhat1", "Tell us what")} <span className="text-gradient">{t("contact.tellUsWhat2", "you need")}</span>
                </h2>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                  {t("contact.tellUsDesc", "Whether you have a question about features, pricing, or anything else — our team is ready to help.")}
                </p>
              </div>
              <div className="surface-elevated rounded-2xl p-5 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">{t("contact.fastResponse", "Fast Response Time")}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {t("contact.fastResponseDesc", "We typically respond within 2–4 hours during business hours. For urgent matters, reach out via phone.")}
                </p>
              </div>
            </motion.div>

            <motion.form {...fadeUp(0.15)} onSubmit={handleSubmit} ref={formRef}
              className="md:col-span-3 surface-elevated rounded-2xl p-6 md:p-8 space-y-5 border border-border/50">
              <fieldset disabled={loading} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">{t("contact.name")}</Label>
                    <Input id="name" placeholder={t("contact.namePlaceholder", "Your name")} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">{t("contact.email")}</Label>
                    <Input id="email" type="email" placeholder="you@company.com" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject" className="text-xs font-medium text-muted-foreground">{t("contact.subject", "Subject")}</Label>
                  <Input id="subject" placeholder={t("contact.subjectPlaceholder", "How can we help?")} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message" className="text-xs font-medium text-muted-foreground">{t("contact.message")}</Label>
                  <Textarea id="message" placeholder={t("contact.messagePlaceholder", "Tell us more about your needs...")} rows={5} required />
                </div>
                <Button type="submit" disabled={loading} className="w-full" size="lg">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t("common.loading")}</> : <><Send className="h-4 w-4 mr-2" /> {t("contact.send")}</>}
                </Button>
              </fieldset>
              <p className="text-[11px] text-muted-foreground/70 text-center">{t("contact.privacyNote", "By submitting this form, you agree to our Privacy Policy.")}</p>
            </motion.form>
          </div>
        </div>
      </section>

      <MarketingCTA />
    </div>
  );
}
