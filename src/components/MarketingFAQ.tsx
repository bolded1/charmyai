import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HelpCircle, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export function MarketingFAQ() {
  const { t } = useTranslation();

  const faqs = Array.from({ length: 10 }, (_, i) => ({
    question: t(`faq.q${i + 1}`),
    answer: t(`faq.a${i + 1}`),
  }));

  return (
    <>
      <section className="py-20 md:py-28">
        <div className="container max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-5">
              <HelpCircle className="h-3.5 w-3.5" />
              {t("faq.badge")}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t("faq.title").split("<1>")[0]}<span className="text-gradient">{t("faq.title").split("<1>")[1]?.split("</1>")[0]}</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {t("faq.desc")}
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
          >
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border-b border-border/50 last:border-b-0"
                >
                  <AccordionTrigger className="text-left text-[15px] font-semibold py-5 hover:no-underline hover:text-primary transition-colors [&[data-state=open]]:text-primary">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-sm pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

          {/* Post-FAQ CTA */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={2}
            className="mt-12 glass-card rounded-2xl p-6 md:p-8 text-center"
          >
            <div className="h-12 w-12 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">{t("faq.stillHaveQuestions")}</h3>
            <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
              {t("faq.stillHaveQuestionsDesc")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="h-11 px-6 rounded-xl text-sm font-semibold shadow-md shadow-primary/15">
                <Link to="/contact">
                  {t("faq.contactUs")}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 px-6 rounded-xl text-sm">
                <Link to="/help">{t("faq.browseHelp")}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
