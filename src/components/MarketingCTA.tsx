import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export function MarketingCTA() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-hero-gradient" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(circle at 30% 50%, hsl(262 83% 58% / 0.5), transparent 50%), radial-gradient(circle at 70% 50%, hsl(172 66% 40% / 0.3), transparent 50%)",
        }}
      />
      <div className="container text-center max-w-2xl relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary-foreground">
          Upload invoices. Forward emails.{" "}
          <span className="opacity-90">Charmy extracts the data.</span>
        </h2>
        <p className="text-primary-foreground/75 mb-8 max-w-md mx-auto">
          Start processing documents in minutes. 7-day free trial included.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="text-base px-8 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <Link to="/signup">
              Start 7-Day Trial <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10 text-base px-8"
            asChild
          >
            <Link to="/demo">Try Demo</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
