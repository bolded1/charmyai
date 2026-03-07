import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div>
      <section className="py-20">
        <div className="container max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Charmy</h1>
          <p className="text-lg text-muted-foreground mb-8">
            We're building the future of financial document processing. Our mission is to eliminate
            manual data entry from accounting workflows forever.
          </p>
          <div className="space-y-6 text-muted-foreground">
            <p>
              DocuLedger was born from a simple observation: accountants and finance teams spend
              an enormous amount of time manually entering data from invoices and receipts into
              spreadsheets and accounting systems.
            </p>
            <p>
              With advances in AI and document understanding, we saw an opportunity to automate
              this entire workflow. Upload a document, let AI extract the data, review it, and export
              it — all in minutes instead of hours.
            </p>
            <p>
              Our team combines expertise in AI, fintech, and accounting to build a platform that
              truly understands financial documents and the needs of accounting professionals.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mt-12">
            {[
              { stat: "10,000+", label: "Documents Processed" },
              { stat: "500+", label: "Active Users" },
              { stat: "95%", label: "Extraction Accuracy" },
            ].map((s) => (
              <div key={s.label} className="surface-elevated rounded-xl p-6 text-center">
                <div className="text-2xl font-bold text-gradient">{s.stat}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <Button asChild>
              <Link to="/contact">Get in Touch <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
