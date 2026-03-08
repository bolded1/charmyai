import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Target, Sparkles, Users, Shield, Zap, Globe } from "lucide-react";
import { usePageContent } from "@/hooks/usePageContent";
import { aboutDefaults } from "@/lib/cms-defaults";
import { motion } from "framer-motion";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

export default function AboutPage() {
  const { content: c } = usePageContent("about", aboutDefaults);

  const stats = [
    { stat: c.stat1Value, label: c.stat1Label },
    { stat: c.stat2Value, label: c.stat2Label },
    { stat: c.stat3Value, label: c.stat3Label },
    { stat: c.stat4Value, label: c.stat4Label },
  ];

  const values = [
    { icon: Target, title: c.value1Title, desc: c.value1Desc },
    { icon: Sparkles, title: c.value2Title, desc: c.value2Desc },
    { icon: Shield, title: c.value3Title, desc: c.value3Desc },
    { icon: Zap, title: c.value4Title, desc: c.value4Desc },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-25 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(224 76% 48% / 0.6), transparent 70%)' }} />
        <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(262 83% 58% / 0.4), transparent 70%)' }} />
        <div className="absolute top-[40%] right-[15%] w-[250px] h-[250px] rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(172 66% 40% / 0.4), transparent 70%)' }} />

        <div className="container max-w-4xl relative z-10">
          <motion.div {...fadeUp()} className="text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-primary bg-primary/10 px-3 py-1 rounded-full mb-6">
              <Globe className="h-3.5 w-3.5" />
              {c.heroBadge}
            </span>
          </motion.div>
          <motion.h1 {...fadeUp(0.1)} className="text-4xl md:text-6xl font-bold text-center leading-tight">
            {c.title}{" "}
            <span className="text-gradient">{c.titleGradient}</span>
          </motion.h1>
          <motion.p {...fadeUp(0.2)} className="text-lg md:text-xl text-muted-foreground text-center mt-6 max-w-2xl mx-auto leading-relaxed">
            {c.intro}
          </motion.p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-2">
        <div className="container max-w-4xl">
          <motion.div {...fadeUp()} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.filter(s => s.stat && s.label).map((s, i) => (
              <motion.div
                key={s.label}
                {...fadeUp(i * 0.1)}
                className="surface-elevated rounded-2xl p-6 text-center border border-border/50 hover:border-primary/20 transition-colors group"
              >
                <div className="text-3xl md:text-4xl font-bold text-gradient mb-1">{s.stat}</div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Story section */}
      <section className="py-20 md:py-28">
        <div className="container max-w-4xl">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <motion.div {...fadeUp()}>
              <span className="text-xs font-semibold tracking-wider uppercase text-primary mb-3 block">{c.storyLabel}</span>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight">
                {c.storyTitle}{" "}
                <span className="text-gradient">{c.storyTitleGradient}</span>
              </h2>
            </motion.div>
            <motion.div {...fadeUp(0.15)} className="space-y-5 text-muted-foreground leading-relaxed">
              <p>{c.paragraph1}</p>
              <p>{c.paragraph2}</p>
              <p>{c.paragraph3}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 md:py-28 relative">
        <div className="absolute inset-0 surface-sunken" />
        <div className="container max-w-4xl relative z-10">
          <motion.div {...fadeUp()} className="text-center mb-14">
            <span className="text-xs font-semibold tracking-wider uppercase text-primary mb-3 block">{c.valuesLabel}</span>
            <h2 className="text-3xl md:text-4xl font-bold">
              {c.valuesTitle}{" "}
              <span className="text-gradient">{c.valuesTitleGradient}</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {values.filter(v => v.title).map((v, i) => (
              <motion.div
                key={v.title}
                {...fadeUp(i * 0.1)}
                className="surface-elevated rounded-2xl p-6 border border-border/50 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all group"
              >
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <v.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-28">
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
            <div className="flex items-center justify-center gap-3">
              <Button size="lg" asChild>
                <Link to="/signup">{c.ctaButton} <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/contact">{c.ctaSecondaryButton}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
