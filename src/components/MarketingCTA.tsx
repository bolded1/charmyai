import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import ctaInvoice from "@/assets/cta-invoice.png";
import ctaEmail from "@/assets/cta-email.png";
import ctaAi from "@/assets/cta-ai.png";

export function MarketingCTA() {
  return (
    <section className="py-24 md:py-32 relative overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-hero-gradient" />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(circle at 20% 40%, hsl(262 83% 58% / 0.5), transparent 50%), radial-gradient(circle at 80% 60%, hsl(172 66% 40% / 0.4), transparent 50%)",
        }}
      />

      {/* Animated grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsla(0,0%,100%,0.3) 1px, transparent 1px), linear-gradient(90deg, hsla(0,0%,100%,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating 3D illustrations */}
      <motion.img
        src={ctaInvoice}
        alt=""
        aria-hidden
        className="absolute hidden md:block w-28 lg:w-36 top-8 left-[5%] lg:left-[10%] opacity-80 select-none pointer-events-none drop-shadow-2xl"
        animate={{ y: [0, -14, 0], rotate: [-3, 2, -3] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.img
        src={ctaEmail}
        alt=""
        aria-hidden
        className="absolute hidden md:block w-24 lg:w-32 bottom-10 left-[8%] lg:left-[14%] opacity-70 select-none pointer-events-none drop-shadow-2xl"
        animate={{ y: [0, 12, 0], rotate: [2, -3, 2] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      />
      <motion.img
        src={ctaAi}
        alt=""
        aria-hidden
        className="absolute hidden md:block w-24 lg:w-32 top-12 right-[6%] lg:right-[11%] opacity-75 select-none pointer-events-none drop-shadow-2xl"
        animate={{ y: [0, -10, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Glowing orbs */}
      <motion.div
        className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsla(0,0%,100%,0.08), transparent 70%)" }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsla(0,0%,100%,0.06), transparent 70%)" }}
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />

      {/* Content */}
      <div className="container text-center max-w-2xl relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm text-primary-foreground text-xs font-semibold mb-6"
        >
          <Sparkles className="h-3 w-3" />
          Start automating today
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 text-primary-foreground leading-tight"
        >
          Upload invoices & receipts. Forward emails.{" "}
          <span className="opacity-90">Charmy extracts the data.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-primary-foreground/75 mb-10 max-w-md mx-auto text-base md:text-lg"
        >
          Start processing documents in minutes. One-time payment, lifetime access.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button
            size="lg"
            variant="secondary"
            asChild
            className="text-base px-8 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
          >
            <Link to="/signup">
              Get Started — €29.99 <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10 text-base px-8 border border-white/15"
            asChild
          >
            <Link to="/demo">Try Demo</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
