import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { usePageContent } from "@/hooks/usePageContent";
import { aboutDefaults } from "@/lib/cms-defaults";

export default function AboutPage() {
  const { content: c } = usePageContent("about", aboutDefaults);

  const stats = [
    { stat: c.stat1Value, label: c.stat1Label },
    { stat: c.stat2Value, label: c.stat2Label },
    { stat: c.stat3Value, label: c.stat3Label },
  ];

  return (
    <div>
      <section className="py-20">
        <div className="container max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">{c.title}</h1>
          <p className="text-lg text-muted-foreground mb-8">{c.intro}</p>
          <div className="space-y-6 text-muted-foreground">
            <p>{c.paragraph1}</p>
            <p>{c.paragraph2}</p>
            <p>{c.paragraph3}</p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 mt-12">
            {stats.map((s) => (
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
