import { motion } from "framer-motion";
import { HelpCircle } from "lucide-react";
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

    </>
  );
}
