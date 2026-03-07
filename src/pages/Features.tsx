import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Upload, Brain, ClipboardCheck, Users2, Search, Download,
  FileText, CheckCircle2, ArrowRight
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const features = [
  {
    icon: Upload, title: "Document Upload",
    desc: "Upload PDF, image, or scanned invoices and receipts. Supported formats: PDF, PNG, JPG.",
    details: ["Drag and drop interface", "Batch upload support", "Automatic format detection"],
  },
  {
    icon: Brain, title: "AI Data Extraction",
    desc: "AI automatically reads documents and extracts financial data.",
    details: ["Supplier / customer name", "Invoice number & dates", "Currency, net, VAT, total amounts", "VAT number detection"],
  },
  {
    icon: FileText, title: "Document Classification",
    desc: "AI detects document type automatically.",
    details: ["Expense invoices", "Sales invoices", "Receipts", "Credit notes"],
  },
  {
    icon: ClipboardCheck, title: "Review and Edit",
    desc: "Users can review extracted data and correct fields before saving.",
    details: ["Side-by-side document view", "Inline field editing", "Confidence indicators"],
  },
  {
    icon: Users2, title: "Contacts Recognition",
    desc: "The system identifies suppliers and customers and links documents to contacts.",
    details: ["Auto-link to existing contacts", "Create new contacts on the fly", "Contact-level reporting"],
  },
  {
    icon: Search, title: "Search and Organization",
    desc: "Documents can be searched and filtered by multiple criteria.",
    details: ["Date range filters", "Supplier / customer search", "Amount & currency filters", "Status categories"],
  },
  {
    icon: Download, title: "Export for Accountants",
    desc: "Export all financial data to CSV for your accounting system.",
    details: ["Expenses export", "Income invoices export", "VAT amounts included", "Category breakdowns"],
  },
];

export default function FeaturesPage() {
  return (
    <div>
      <section className="py-20">
        <div className="container max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to <span className="text-gradient">Automate</span> Document Processing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From upload to export, DocuLedger handles the entire workflow of turning financial documents into structured accounting data.
          </p>
        </div>
      </section>

      <section className="pb-20">
        <div className="container max-w-5xl space-y-12">
          {features.map((f, i) => (
            <motion.div key={f.title} initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} custom={0}
              className={`grid md:grid-cols-2 gap-8 items-center ${i % 2 === 1 ? 'md:direction-rtl' : ''}`}>
              <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center mb-4">
                  <f.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-3">{f.title}</h2>
                <p className="text-muted-foreground mb-4">{f.desc}</p>
                <ul className="space-y-2">
                  {f.details.map((d) => (
                    <li key={d} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />{d}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`surface-elevated rounded-xl h-48 flex items-center justify-center ${i % 2 === 1 ? 'md:order-1' : ''}`}>
                <f.icon className="h-16 w-16 text-muted-foreground/20" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-hero-gradient">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">Ready to get started?</h2>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/signup">Start Free Trial <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
