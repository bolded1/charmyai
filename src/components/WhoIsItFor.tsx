import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Briefcase, Building2, ArrowRight, Receipt, FolderOpen, Users, Upload, Zap, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

export function WhoIsItFor() {
  const { t } = useTranslation();

  const paths = [
    {
      icon: Briefcase,
      gradient: "bg-hero-gradient",
      shadow: "shadow-primary/20",
      title: t("marketing.audienceSoloTitle"),
      desc: t("marketing.audienceSoloDesc"),
      benefits: [
        { icon: Receipt, text: t("marketing.audienceSoloBenefit1") },
        { icon: Upload, text: t("marketing.audienceSoloBenefit2") },
        { icon: Zap, text: t("marketing.audienceSoloBenefit3") },
      ],
      cta: t("marketing.audienceSoloCta"),
      link: "/signup",
    },
    {
      icon: Building2,
      gradient: "bg-gradient-cool",
      shadow: "shadow-teal/20",
      title: t("marketing.audienceFirmTitle"),
      desc: t("marketing.audienceFirmDesc"),
      benefits: [
        { icon: FolderOpen, text: t("marketing.audienceFirmBenefit1") },
        { icon: Users, text: t("marketing.audienceFirmBenefit2") },
        { icon: Shield, text: t("marketing.audienceFirmBenefit3") },
      ],
      cta: t("marketing.audienceFirmCta"),
      link: "/signup",
    },
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
      <div className="container max-w-5xl relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          custom={0}
          className="text-center mb-14"
        >
          <span className="text-xs font-semibold tracking-wider uppercase text-primary mb-3 block">
            {t("marketing.audienceLabel")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            {t("marketing.audienceTitle")}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {t("marketing.audienceSubtitle")}
          </p>
        </motion.div>

        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))] gap-8">
          {paths.map((path, idx) => (
            <motion.div
              key={idx}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={idx + 1}
              className="glass-card rounded-2xl p-6 md:p-8 flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className="flex items-center gap-4 mb-5">
                <div className={`h-12 w-12 rounded-2xl ${path.gradient} flex items-center justify-center shadow-lg ${path.shadow}`}>
                  <path.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">{path.title}</h3>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {path.desc}
              </p>

              <div className="space-y-3 mb-8 flex-1">
                {path.benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                      <b.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{b.text}</span>
                  </div>
                ))}
              </div>

              <Button asChild className="w-full h-11 rounded-xl text-sm font-semibold group-hover:shadow-md transition-shadow">
                <Link to={path.link}>
                  {path.cta}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
