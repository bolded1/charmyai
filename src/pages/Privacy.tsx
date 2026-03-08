import { motion } from "framer-motion";
import { usePageContent } from "@/hooks/usePageContent";
import { privacyDefaults, extractLegalSections } from "@/lib/cms-defaults";
import { useMemo } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

export default function Privacy() {
  const { content: c } = usePageContent("privacy", privacyDefaults);

  const sections = useMemo(() => {
    // Support dynamic sections array saved by admin, fall back to flat keys
    if (c.sections) {
      try {
        const parsed = JSON.parse(c.sections as string);
        if (Array.isArray(parsed)) return parsed.filter((s: any) => s.title);
      } catch {}
    }
    return extractLegalSections(c as Record<string, string>);
  }, [c]);

  return (
    <div className="py-16 md:py-24">
      <div className="container max-w-3xl">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{c.title}</h1>
          <p className="text-muted-foreground">{c.lastUpdated}</p>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="mb-8">
          <p className="text-muted-foreground leading-relaxed">{c.intro}</p>
        </motion.div>

        <div className="space-y-8">
          {sections.map((section: any, i: number) => (
            <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
              <h2 className="text-lg font-bold mb-2">{section.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{section.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
