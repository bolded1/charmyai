import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, type Easing } from "framer-motion";
import {
  Upload, Mail, Search, ClipboardCheck, Download,
  ArrowRight, CheckCircle2, FileText, Clock, Receipt,
  FolderOpen, ChevronRight, Sparkles, Zap, Shield,
  Smartphone, Monitor, Share, Plus, MoreVertical,
  Users, Briefcase, Calculator, Building2, Lock, Eye,
} from "lucide-react";
import { DemoUploader } from "@/components/demo/DemoUploader";
import { MarketingCTA } from "@/components/MarketingCTA";
import { MarketingFAQ } from "@/components/MarketingFAQ";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const floatAnimation = {
  y: [0, -8, 0],
  transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as Easing },
};

export default function HomePage() {
  return (
    <div>
      {/* ═══ Hero ═══ */}
      <section className="pt-28 md:pt-40 pb-6 relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(224 76% 48% / 0.5), transparent 70%)' }} />
        <div className="absolute top-[10%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(262 83% 58% / 0.5), transparent 70%)' }} />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[30%] left-[50%] -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, hsl(172 66% 40% / 0.3), transparent 70%)' }}
        />

        <div className="container max-w-4xl text-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered invoice extraction
          </motion.div>
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-5">
            Stop typing invoice data{" "}
            <span className="text-gradient">manually.</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Upload invoices or receipts and see how Charmy extracts financial data instantly.
          </motion.p>

          {/* Trust text */}
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mb-10">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-primary" />
              <span>No account required</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-primary" />
              <span>Deleted after processing</span>
            </div>
          </motion.div>
        </div>

        {/* Demo uploader — untouched */}
        <motion.div id="demo-upload" initial="hidden" animate="visible" variants={fadeUp} custom={4}>
          <DemoUploader />
        </motion.div>

        {/* Supporting sentence */}
      </section>

      {/* ═══ Problem Section ═══ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
        <div className="container max-w-5xl relative z-10">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <span className="text-xs font-semibold tracking-wider uppercase text-rose mb-3 block">The Problem</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Accounting teams waste hours{" "}
                <span className="text-gradient-warm">entering invoice data.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Businesses and accountants receive piles of invoices and receipts that must be opened, read, and typed manually into accounting systems. This repetitive work wastes valuable time.
              </p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
              {/* Animated visual: stacking invoices */}
              <div className="relative h-64 md:h-80 flex items-center justify-center">
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -4 * (4 - i), 0],
                      rotate: [-2 + i * 1.5, -1 + i * 1, -2 + i * 1.5],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                    className="absolute glass-card rounded-xl p-4 w-48 md:w-56 shadow-lg"
                    style={{
                      top: `${10 + i * 12}%`,
                      left: `${15 + i * 5}%`,
                      zIndex: 4 - i,
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="h-2 w-20 rounded-full bg-muted-foreground/20" />
                        <div className="h-1.5 w-14 rounded-full bg-muted-foreground/10 mt-1" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full rounded-full bg-muted-foreground/10" />
                      <div className="h-1.5 w-3/4 rounded-full bg-muted-foreground/10" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ Solution Section ═══ */}
      <section className="py-20">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="order-2 md:order-1">
              {/* Animated visual: extraction flow */}
              <div className="relative h-72 md:h-80 flex items-center justify-center">
                {/* Document going in */}
                <motion.div
                  animate={{ x: [0, 20, 0], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 glass-card rounded-xl p-4 w-32 shadow-lg"
                >
                  <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <div className="h-1.5 w-full rounded-full bg-muted-foreground/15" />
                  <div className="h-1.5 w-2/3 rounded-full bg-muted-foreground/10 mt-1" />
                </motion.div>

                {/* Center processing */}
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="h-16 w-16 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-xl shadow-primary/25 z-10"
                >
                  <Sparkles className="h-7 w-7 text-primary-foreground" />
                </motion.div>

                {/* Extracted data out */}
                <motion.div
                  animate={{ x: [0, -20, 0], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 glass-card rounded-xl p-3 w-36 shadow-lg"
                >
                  {["Supplier", "€2,915.50", "19% VAT"].map((text, i) => (
                    <div key={text} className="flex items-center gap-2 py-1">
                      <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                      <span className="text-[10px] font-medium">{text}</span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="order-1 md:order-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-primary mb-3 block">The Solution</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Charmy automates{" "}
                <span className="text-gradient">invoice processing.</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Upload invoices or forward them by email. Charmy reads the documents and extracts structured financial data automatically.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
        <div className="container max-w-5xl relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Four steps from document to structured accounting data.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Upload, title: "Upload documents", desc: "Upload invoices or forward them to your unique Charmy email address.", gradient: "bg-hero-gradient", shadow: "shadow-primary/20" },
              { icon: Search, title: "Charmy extracts financial data", desc: "AI reads and extracts all financial data fields automatically.", gradient: "bg-gradient-cool", shadow: "shadow-teal/20" },
              { icon: ClipboardCheck, title: "Review the results", desc: "Confirm the extracted fields. Edit anything that needs correction.", gradient: "bg-gradient-sunset", shadow: "shadow-violet/20" },
              { icon: Download, title: "Export for accounting", desc: "Export structured, accountant-ready CSV files in one click.", gradient: "bg-gradient-warm", shadow: "shadow-rose/20" },
            ].map((step, i) => (
              <motion.div key={step.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="glass-card rounded-2xl p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                <motion.div
                  animate={floatAnimation}
                  transition={{ ...floatAnimation.transition, delay: i * 0.4 } as const}
                  className={`h-12 w-12 rounded-2xl ${step.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg ${step.shadow}`}
                >
                  <step.icon className="h-5 w-5 text-white" />
                </motion.div>
                <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">Step {i + 1}</div>
                <h3 className="text-base font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Extracted Fields ═══ */}
      <section className="py-20">
        <div className="container max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Every Field, <span className="text-gradient">Captured Automatically</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">Charmy extracts the data your accountant needs — no manual entry required.</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="glass-card rounded-2xl p-6 md:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { label: "Supplier", example: "CloudTech GmbH", color: "icon-bg-blue" },
                { label: "Invoice Number", example: "INV-2026-0847", color: "icon-bg-violet" },
                { label: "Invoice Date", example: "Feb 28, 2026", color: "icon-bg-teal" },
                { label: "Due Date", example: "Mar 30, 2026", color: "icon-bg-amber" },
                { label: "Currency", example: "EUR", color: "icon-bg-emerald" },
                { label: "Subtotal", example: "€2,450.00", color: "icon-bg-blue" },
                { label: "VAT Amount", example: "€465.50", color: "icon-bg-rose" },
                { label: "Total Amount", example: "€2,915.50", color: "icon-bg-violet" },
              ].map((field, i) => (
                <motion.div
                  key={field.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-3 rounded-xl ${field.color} border border-border/30 hover:scale-105 transition-transform duration-200`}
                >
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">{field.label}</div>
                  <div className="text-sm font-bold tabular-nums">{field.example}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ Accounting Firm Workspaces ═══ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
        <div className="container max-w-5xl relative z-10">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Text side */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <span className="text-xs font-semibold tracking-wider uppercase text-primary mb-3 block">For Accounting Firms</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Built for accountants managing{" "}
                <span className="text-gradient">multiple clients</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Accounting firms often receive invoices and receipts from many different client companies. Charmy allows you to create a separate workspace for each client so documents stay organized and easy to manage.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Accountants can switch between companies instantly and export financial data for each client independently.
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: FolderOpen, title: "Create a workspace for every client company", desc: "Keep invoices, receipts, and financial documents separated." },
                  { icon: Zap, title: "Switch between clients instantly", desc: "Move between companies without logging in and out." },
                  { icon: Download, title: "Export clean data for each client", desc: "Prepare organized financial records for accounting." },
                ].map((item, i) => (
                  <motion.div key={item.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
                    className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground bg-accent/50 rounded-lg px-4 py-2.5 border border-border/40">
                The Accounting Firm plan allows you to manage up to <strong className="text-foreground">10 client workspaces</strong> from one Charmy account.
              </p>
            </motion.div>

            {/* Animated illustration side */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
              <div className="relative h-[400px] md:h-[460px] flex items-center justify-center">
                {/* Background glow */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-teal/5" />

                {/* Firm dashboard card */}
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-4 left-4 right-4 glass-card rounded-2xl p-4 shadow-xl z-10"
                >
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-hero-gradient flex items-center justify-center shadow-sm shadow-primary/20">
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground">Your Firm</div>
                      <div className="text-[10px] text-muted-foreground">3 client workspaces</div>
                    </div>
                  </div>
                  <div className="h-px bg-border/60 mb-3" />
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Client Workspaces</div>
                </motion.div>

                {/* Client workspace cards — staggered animation */}
                {[
                  { name: "Acme Corp BV", docs: 24, color: "bg-primary/10", iconColor: "text-primary", delay: 0 },
                  { name: "TechStart GmbH", docs: 18, color: "bg-teal/10", iconColor: "text-teal", delay: 0.5 },
                  { name: "Design Studio Ltd", docs: 12, color: "bg-violet/10", iconColor: "text-violet", delay: 1.0 },
                ].map((client, i) => (
                  <motion.div
                    key={client.name}
                    animate={{
                      y: [0, -4, 0],
                      x: [0, i === 1 ? 3 : -3, 0],
                    }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: client.delay }}
                    className="absolute glass-card rounded-xl p-3 shadow-lg w-[85%] left-[7.5%]"
                    style={{ top: `${140 + i * 85}px`, zIndex: 5 - i }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-lg ${client.color} flex items-center justify-center`}>
                          <Briefcase className={`h-3.5 w-3.5 ${client.iconColor}`} />
                        </div>
                        <div>
                          <div className="text-[12px] font-semibold text-foreground">{client.name}</div>
                          <div className="text-[10px] text-muted-foreground">{client.docs} documents</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <motion.div
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: client.delay + 0.5 }}
                          className="h-6 px-2 rounded-md bg-primary/10 flex items-center"
                        >
                          <span className="text-[10px] font-semibold text-primary">Open</span>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Floating switch indicator */}
                <motion.div
                  animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -10] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                  className="absolute bottom-4 right-6 glass-card rounded-lg px-3 py-2 shadow-md flex items-center gap-2 z-20"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-semibold text-foreground">Switched to TechStart</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ Benefits ═══ */}
      <section className="py-20">
        <div className="container max-w-4xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Why teams choose <span className="text-gradient">Charmy</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {[
              { icon: Clock, text: "Save hours of manual bookkeeping", color: "icon-bg-blue", textColor: "text-primary" },
              { icon: Receipt, text: "Capture invoices instantly", color: "icon-bg-violet", textColor: "text-violet" },
              { icon: Mail, text: "Import documents by upload or email", color: "icon-bg-teal", textColor: "text-teal" },
              { icon: Download, text: "Prepare accountant-ready exports", color: "icon-bg-amber", textColor: "text-amber" },
              { icon: FolderOpen, text: "Keep documents organized", color: "icon-bg-emerald", textColor: "text-emerald" },
              { icon: Shield, text: "Enterprise-grade security", color: "icon-bg-rose", textColor: "text-rose" },
            ].map((b, i) => (
              <motion.div key={b.text} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="flex items-center gap-4 p-4 glass-card rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <div className={`h-10 w-10 rounded-xl ${b.color} flex items-center justify-center shrink-0`}>
                  <b.icon className={`h-5 w-5 ${b.textColor}`} />
                </div>
                <span className="text-sm font-semibold">{b.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Install as App ═══ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
        <div className="container max-w-5xl relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-5">
              <Smartphone className="h-3.5 w-3.5" />
              Progressive Web App
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Install Charmy on <span className="text-gradient">Any Device</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              No app store needed. Add Charmy to your home screen or desktop for instant access, offline support, and a native app experience.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Monitor, title: "Chrome / Edge", gradient: "bg-hero-gradient", shadow: "shadow-primary/20", delay: 0, steps: [
                { text: <>Click the <strong className="text-foreground">install icon</strong> in the address bar</> },
                { text: <>Click <strong className="text-foreground">"Install"</strong> in the prompt</> },
                { text: <>Charmy opens as a <strong className="text-foreground">standalone app</strong></> },
              ]},
              { icon: Smartphone, title: "iPhone / iPad", gradient: "bg-gradient-cool", shadow: "shadow-teal/20", delay: 0.3, steps: [
                { text: <>Tap the <strong className="text-foreground"><Share className="inline h-3 w-3" /> Share</strong> button in Safari</> },
                { text: <>Select <strong className="text-foreground"><Plus className="inline h-3 w-3" /> Add to Home Screen</strong></> },
                { text: <>Launch from your <strong className="text-foreground">home screen</strong></> },
              ]},
              { icon: Download, title: "Android", gradient: "bg-gradient-sunset", shadow: "shadow-violet/20", delay: 0.6, steps: [
                { text: <>Tap <strong className="text-foreground"><MoreVertical className="inline h-3 w-3" /> Menu</strong> in Chrome</> },
                { text: <>Select <strong className="text-foreground">"Install app"</strong> or <strong className="text-foreground">"Add to Home Screen"</strong></> },
                { text: <>Charmy appears as a <strong className="text-foreground">native app</strong></> },
              ]},
            ].map((platform, idx) => {
              const colors = ["bg-primary/10 text-primary", "bg-teal/10 text-teal", "bg-violet/10 text-violet"];
              return (
                <motion.div key={platform.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={idx + 1}
                  className="glass-card rounded-2xl p-6 text-center group hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: platform.delay }}
                    className={`h-14 w-14 rounded-2xl ${platform.gradient} flex items-center justify-center mx-auto mb-5 shadow-lg ${platform.shadow}`}
                  >
                    <platform.icon className="h-7 w-7 text-white" />
                  </motion.div>
                  <h3 className="text-sm font-bold mb-2">{platform.title}</h3>
                  <div className="space-y-2.5 text-left">
                    {platform.steps.map((step, si) => (
                      <div key={si} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                        <div className={`h-5 w-5 rounded-full ${colors[idx].split(' ')[0]} flex items-center justify-center shrink-0 mt-0.5`}>
                          <span className={`text-[10px] font-bold ${colors[idx].split(' ')[1]}`}>{si + 1}</span>
                        </div>
                        <span>{step.text}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={4}
            className="flex flex-wrap justify-center gap-3 mt-10">
            {[
              { icon: Zap, label: "Instant Launch" },
              { icon: Shield, label: "Offline Ready" },
              { icon: Sparkles, label: "Auto Updates" },
              { icon: FileText, label: "Home Screen Icon" },
            ].map((feat) => (
              <div key={feat.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 text-xs font-semibold text-muted-foreground shadow-sm">
                <feat.icon className="h-3.5 w-3.5 text-primary" />
                {feat.label}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <MarketingFAQ />
      <MarketingCTA />
    </div>
  );
}
