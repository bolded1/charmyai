import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles, HelpCircle, ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Can I try Charmy before creating an account?",
    answer:
      "Yes. You can try Charmy instantly on our homepage by uploading an invoice or receipt. The demo lets you see exactly how Charmy extracts financial data from documents before you sign up. No account required.",
  },
  {
    question: "What types of documents can Charmy process?",
    answer:
      "Charmy supports the most common financial document formats including PDF invoices, JPG images, PNG images, and scanned receipts. You can upload files manually or send them via email.",
  },
  {
    question: "Can I send invoices by email instead of uploading them?",
    answer:
      "Yes. Every Charmy workspace includes a dedicated email address where you can forward invoices. When an invoice arrives, Charmy automatically imports the document, reads the invoice, extracts financial data, and adds it to your workspace. This is perfect for supplier invoices that arrive in your inbox.",
  },
  {
    question: "What information does Charmy extract from invoices?",
    answer:
      "Charmy automatically extracts key financial fields including supplier name, invoice number, invoice date, currency, subtotal, VAT amount, and total amount. You can review and edit the data before exporting it.",
  },
  {
    question: "Who is Charmy built for?",
    answer:
      "Charmy is designed for professionals who deal with invoices regularly — accountants and bookkeepers, small businesses, freelancers and consultants, and finance teams. It eliminates hours of manual invoice data entry.",
  },
  {
    question: "How accurate is the AI extraction?",
    answer:
      "Charmy uses advanced AI document processing models trained to recognize financial document structures. In most cases, invoice fields are extracted automatically and require minimal review. You always have the option to edit extracted data before exporting it.",
  },
  {
    question: "Is my financial data secure?",
    answer:
      "Yes. Charmy processes documents using secure infrastructure and encrypted connections. Security measures include encrypted data transfer (SSL), secure cloud infrastructure, and GDPR-compliant data handling. Your documents are only accessible to your account.",
  },
  {
    question: "Can I organize and categorize expenses?",
    answer:
      "Yes. Charmy allows you to categorize invoices and create automatic rules based on supplier names or document data. For example: Supplier contains \"AWS\" → Category: Cloud Services. This helps automate expense organization.",
  },
  {
    question: "Can I export my data for accounting?",
    answer:
      "Yes. Charmy lets you export financial data into formats suitable for accountants, including CSV, spreadsheet formats, and structured financial reports. This makes it easy to share data with your accountant or import it into accounting software.",
  },
  {
    question: "Do I need accounting software to use Charmy?",
    answer:
      "No. Charmy focuses specifically on document processing and financial data extraction. Many businesses use Charmy to prepare organized financial data before sending it to their accountant.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export function MarketingFAQ() {
  return (
    <>
      {/* ═══ FAQ Section ═══ */}
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
              Common Questions
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Everything you need to know about Charmy and AI invoice processing.
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
        </div>
      </section>

      {/* ═══ Conversion CTA after FAQ ═══ */}
      <section className="pb-4">
        <div className="container max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="relative overflow-hidden rounded-3xl bg-hero-gradient p-8 md:p-12 text-center"
          >
            {/* Decorative elements */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(hsla(0,0%,100%,0.3) 1px, transparent 1px), linear-gradient(90deg, hsla(0,0%,100%,0.3) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            <motion.div
              className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, hsla(0,0%,100%,0.08), transparent 70%)" }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-primary-foreground text-xs font-semibold mb-5"
              >
                <Sparkles className="h-3 w-3" />
                See it in action
              </motion.div>

              <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">
                Still spending hours entering invoice data?
              </h3>
              <p className="text-primary-foreground/75 max-w-md mx-auto mb-8 text-base">
                Upload a document and see how Charmy extracts the financial information instantly.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  size="lg"
                  variant="secondary"
                  asChild
                  className="text-base px-8 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Link to="/demo">
                    Try Demo <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10 text-base px-8 border border-white/15"
                  asChild
                >
                  <Link to="/signup">
                    Start Free Trial <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
