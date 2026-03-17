import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Upload, FileText, Search, Download, Sparkles, CheckCircle2,
  Clock, Receipt, Shield, Mail, Building2, Briefcase, FolderOpen,
  Zap, ClipboardCheck,
  Send, Link2, ExternalLink, ClipboardList,
  Lock, ShieldCheck, Globe, Server, Eye,
} from "lucide-react";
import quickbooksLogo from "@/assets/quickbooks-logo.png";
import xeroLogo from "@/assets/xero-logo.png";
import freshbooksLogo from "@/assets/freshbooks-logo.png";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { useTranslation } from "react-i18next";
import { MarketingFAQ } from "@/components/MarketingFAQ";
import { MarketingCTA } from "@/components/MarketingCTA";
import { DemoUploader } from "@/components/demo/DemoUploader";
import { WhoIsItFor } from "@/components/WhoIsItFor";

export default function IndexPage() {
  const { t } = useTranslation();
  const brandLogo = useBrandLogo();

  const fadeUp = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.1, duration: 0.5 },
    }),
  };

  const floatAnimation = {
    y: [0, -8, 0],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
  };

  return (
    <div>
      {/* ═══ Hero Section ═══ */}
      <section className="relative pt-24 md:pt-36 pb-20 overflow-hidden">
        <div className="absolute top-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full opacity-30 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(351 63% 37% / 0.5), transparent 70%)' }} />
        <div className="absolute bottom-[-25%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-25 blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, hsl(17 69% 60% / 0.4), transparent 70%)' }} />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, hsl(172 66% 40% / 0.4), transparent 70%)' }}
        />

        <div className="container max-w-4xl relative z-10">
          <div className="text-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              {t("marketing.heroBadge")}
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08] mb-5">
                {t("marketing.heroLine1")}
                <br className="hidden sm:block" />
                <span className="relative">
                  <span className="text-gradient"> {t("marketing.heroLine2")}</span>
                </span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                {t("marketing.heroDesc1")}{" "}
                <span className="text-foreground font-medium">{t("marketing.heroDesc2")}</span>{" "}
                {t("marketing.heroDesc3")}
              </p>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="h-12 px-7 rounded-2xl bg-hero-gradient hover:opacity-90 transition-all duration-300 shadow-xl shadow-primary/25 text-base font-semibold">
                <Link to="/signup">{t("marketing.getStartedFree")}</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-7 rounded-2xl border-border/60 text-base">
                <Link to="/demo">{t("marketing.tryDemo")}</Link>
              </Button>
            </motion.div>
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="mt-4">
              <span className="text-xs text-muted-foreground">{t("marketing.noCreditCard")}</span>
            </motion.div>
          </div>

        </div>

        {/* Demo uploader embedded in hero */}
        <div className="container max-w-5xl relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={4} className="mt-12">
            <DemoUploader />
          </motion.div>
        </div>
      </section>

      {/* ═══ Who Is It For ═══ */}
      <WhoIsItFor />

      {/* ═══ Problem Section ═══ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
        <div className="container max-w-5xl relative z-10">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <span className="text-xs font-semibold tracking-wider uppercase text-primary mb-3 block">{t("marketing.problemLabel")}</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t("marketing.problemTitle").split("<1>")[0]}
                <span className="text-gradient-warm">{t("marketing.problemTitle").split("<1>")[1]?.split("</1>")[0]}</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t("marketing.problemDesc")}
              </p>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
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
                    style={{ top: `${10 + i * 12}%`, left: `${15 + i * 5}%`, zIndex: 4 - i }}
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
              <div className="relative h-72 md:h-80 flex items-center justify-center">
                <motion.div
                  animate={{ x: [0, 20, 0], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 glass-card rounded-xl p-4 w-32 shadow-lg"
                >
                  <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <div className="h-1.5 w-full rounded-full bg-muted-foreground/15" />
                  <div className="h-1.5 w-2/3 rounded-full bg-muted-foreground/10 mt-1" />
                </motion.div>
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="h-16 w-16 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-xl shadow-primary/25 z-10"
                >
                  <Sparkles className="h-7 w-7 text-primary-foreground" />
                </motion.div>
                <motion.div
                  animate={{ x: [0, -20, 0], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 glass-card rounded-xl p-3 w-36 shadow-lg"
                >
                  {["Supplier", "€2,915.50", "19% VAT"].map((text) => (
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
              <span className="text-xs font-semibold tracking-wider uppercase text-primary mb-3 block">{t("marketing.solutionLabel")}</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t("marketing.solutionTitle").split("<1>")[0]}
                <span className="text-gradient">{t("marketing.solutionTitle").split("<1>")[1]?.split("</1>")[0]}</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {t("marketing.solutionDesc")}
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
            <h2 className="text-3xl md:text-4xl font-bold mb-3">{t("marketing.howItWorks")}</h2>
            <p className="text-muted-foreground max-w-lg mx-auto">{t("marketing.howItWorksDesc")}</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Upload, title: t("marketing.step1Title"), desc: t("marketing.step1Desc"), gradient: "bg-hero-gradient", shadow: "shadow-primary/20" },
              { icon: Search, title: t("marketing.step2Title"), desc: t("marketing.step2Desc"), gradient: "bg-gradient-cool", shadow: "shadow-teal/20" },
              { icon: ClipboardCheck, title: t("marketing.step3Title"), desc: t("marketing.step3Desc"), gradient: "bg-gradient-sunset", shadow: "shadow-violet/20" },
              { icon: Download, title: t("marketing.step4Title"), desc: t("marketing.step4Desc"), gradient: "bg-gradient-warm", shadow: "shadow-rose/20" },
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
                <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">{t("common.step", { defaultValue: "Step" })} {i + 1}</div>
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
              {t("marketing.everyFieldTitle").split("<1>")[0]}<span className="text-gradient">{t("marketing.everyFieldTitle").split("<1>")[1]?.split("</1>")[0]}</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">{t("marketing.everyFieldDesc")}</p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1} className="glass-card rounded-2xl p-6 md:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { label: t("documents.supplier"), example: "CloudTech GmbH", color: "icon-bg-blue" },
                { label: t("documents.invoiceNumber"), example: "INV-2026-0847", color: "icon-bg-violet" },
                { label: t("documents.invoiceDate"), example: "Feb 28, 2026", color: "icon-bg-teal" },
                { label: t("documents.dueDate"), example: "Mar 30, 2026", color: "icon-bg-amber" },
                { label: t("documents.currency"), example: "EUR", color: "icon-bg-emerald" },
                { label: t("documents.netAmount"), example: "€2,450.00", color: "icon-bg-blue" },
                { label: t("documents.vatAmount"), example: "€465.50", color: "icon-bg-rose" },
                { label: t("documents.totalAmount"), example: "€2,915.50", color: "icon-bg-violet" },
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
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <span className="text-xs font-semibold tracking-wider uppercase text-primary mb-3 block">{t("marketing.firmSectionLabel")}</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t("marketing.firmSectionTitle").split("<1>")[0]}
                <span className="text-gradient">{t("marketing.firmSectionTitle").split("<1>")[1]?.split("</1>")[0]}</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {t("marketing.firmSectionDesc")}
              </p>
              <p className="text-muted-foreground leading-relaxed mb-8">
                {t("marketing.firmSectionDesc2")}
              </p>

              <div className="space-y-4 mb-8">
                {[
                  { icon: FolderOpen, title: t("marketing.firmBenefit1Title"), desc: t("marketing.firmBenefit1Desc") },
                  { icon: Zap, title: t("marketing.firmBenefit2Title"), desc: t("marketing.firmBenefit2Desc") },
                  { icon: Download, title: t("marketing.firmBenefit3Title"), desc: t("marketing.firmBenefit3Desc") },
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

              <p className="text-xs text-muted-foreground bg-accent/50 rounded-lg px-4 py-2.5 border border-border/40"
                dangerouslySetInnerHTML={{ __html: t("marketing.firmNote") }} />
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
              <div className="relative h-[400px] md:h-[460px] flex items-center justify-center">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 via-transparent to-teal/5" />
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
                      <div className="text-xs font-bold text-foreground">{t("marketing.yourFirm")}</div>
                      <div className="text-[10px] text-muted-foreground">{t("marketing.clientWorkspaces")}</div>
                    </div>
                  </div>
                  <div className="h-px bg-border/60 mb-3" />
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t("workspace.clientWorkspaces")}</div>
                </motion.div>

                {[
                  { name: "Acme Corp BV", docs: 24, color: "bg-primary/10", iconColor: "text-primary", delay: 0 },
                  { name: "TechStart GmbH", docs: 18, color: "bg-teal/10", iconColor: "text-teal", delay: 0.5 },
                  { name: "Design Studio Ltd", docs: 12, color: "bg-violet/10", iconColor: "text-violet", delay: 1.0 },
                ].map((client, i) => (
                  <motion.div
                    key={client.name}
                    animate={{ y: [0, -4, 0], x: [0, i === 1 ? 3 : -3, 0] }}
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
                          <div className="text-[10px] text-muted-foreground">{client.docs} {t("common.documents")}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <motion.div
                          animate={{ scale: [1, 1.15, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: client.delay + 0.5 }}
                          className="h-6 px-2 rounded-md bg-primary/10 flex items-center"
                        >
                          <span className="text-[10px] font-semibold text-primary">{t("common.open")}</span>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                <motion.div
                  animate={{ opacity: [0, 1, 1, 0], y: [10, 0, 0, -10] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                  className="absolute bottom-4 right-6 glass-card rounded-lg px-3 py-2 shadow-md flex items-center gap-2 z-20"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  <span className="text-[10px] font-semibold text-foreground">{t("marketing.switchedTo")}</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ Document Requests ═══ */}
      <section className="py-20">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <span className="text-xs font-semibold tracking-wider uppercase text-primary mb-3 block">{t("features.docRequestTitle", "Document Requests")}</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t("marketing.docRequestHeadline", "Collect documents from clients ")}
                <span className="text-gradient">{t("marketing.docRequestHeadlineHighlight", "effortlessly")}</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {t("marketing.docRequestDesc", "Send secure upload links to your clients — they submit documents without needing an account. Everything lands in the right workspace, ready for review.")}
              </p>
              <div className="space-y-3">
                {[
                  { icon: Send, text: t("features.docRequestCap1", "Send requests via email with one click") },
                  { icon: ExternalLink, text: t("features.docRequestCap2", "Clients upload via secure public link") },
                  { icon: ClipboardList, text: t("features.docRequestCap3", "Track request status in real time") },
                  { icon: CheckCircle2, text: t("features.docRequestCap4", "Auto-route uploads to correct workspace") },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
              <div className="glass-card rounded-2xl p-6 md:p-8">
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">Pending Requests</div>
                <div className="space-y-3">
                  {[
                    { client: "Maria K.", doc: "Q1 VAT receipts", status: "Pending", color: "bg-warning-soft text-warning" },
                    { client: "Nikos P.", doc: "Bank statement — Feb", status: "Uploaded", color: "bg-primary/10 text-primary" },
                    { client: "Anna D.", doc: "Payroll summary", status: "Overdue", color: "bg-destructive/10 text-destructive" },
                  ].map((req, i) => (
                    <motion.div key={req.doc} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-accent/40 border border-border/40">
                      <div className="h-8 w-8 rounded-full bg-accent border border-border flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                        {req.client.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{req.doc}</p>
                        <p className="text-[10px] text-muted-foreground">{req.client}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${req.color}`}>{req.status}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-4 p-3 rounded-lg border border-dashed border-border bg-accent/20 text-center">
                  <p className="text-[11px] text-muted-foreground">Clients upload via <span className="font-medium text-foreground">secure link</span> — no account needed</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ Accounting Integrations ═══ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
        <div className="container max-w-5xl relative z-10">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
              className="order-2 md:order-1">
              <div className="glass-card rounded-2xl p-6 md:p-8">
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">Connected Platforms</div>
                <div className="space-y-3">
                  {[
                    { name: "QuickBooks Online", logo: quickbooksLogo, connected: true, sync: "Last sync 2h ago" },
                    { name: "Xero", logo: xeroLogo, connected: false },
                    { name: "FreshBooks", logo: freshbooksLogo, connected: false },
                  ].map((p, i) => (
                    <motion.div key={p.name} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${p.connected ? "bg-primary/5 border-primary/20" : "bg-accent/40 border-border/40"}`}>
                      <div className="h-10 w-10 rounded-xl bg-white border border-border flex items-center justify-center shrink-0 overflow-hidden p-1.5">
                        <img src={p.logo} alt={p.name} className="h-full w-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.connected ? `Connected · ${p.sync}` : "Not connected"}</p>
                      </div>
                      {p.connected ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary flex items-center gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Active
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2.5 py-1 rounded-lg border border-border text-muted-foreground">Connect</span>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
              className="order-1 md:order-2">
              <span className="text-xs font-semibold tracking-wider uppercase text-primary mb-3 block">{t("features.integrationsTitle", "Integrations")}</span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t("marketing.integrationsHeadline", "Sync with your ")}
                <span className="text-gradient">{t("marketing.integrationsHeadlineHighlight", "accounting platform")}</span>
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {t("marketing.integrationsDesc", "Connect QuickBooks, Xero, or FreshBooks and push expenses and invoices directly to your ledger with one click.")}
              </p>
              <div className="space-y-3">
                {[
                  { icon: Link2, text: t("features.integrationsCap1", "One-click OAuth connection") },
                  { icon: Zap, text: t("features.integrationsCap2", "Push expenses & invoices instantly") },
                  { icon: Shield, text: t("features.integrationsCap4", "Secure token-based authentication") },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                ))}
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
              {t("marketing.whyChoose").split("<1>")[0]}<span className="text-gradient">{t("marketing.whyChoose").split("<1>")[1]?.split("</1>")[0]}</span>
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Clock, text: t("marketing.benefit1"), color: "icon-bg-blue", textColor: "text-primary" },
              { icon: Receipt, text: t("marketing.benefit2"), color: "icon-bg-violet", textColor: "text-violet" },
              { icon: Mail, text: t("marketing.benefit3"), color: "icon-bg-teal", textColor: "text-teal" },
              { icon: Download, text: t("marketing.benefit4"), color: "icon-bg-amber", textColor: "text-amber" },
              { icon: FolderOpen, text: t("marketing.benefit5"), color: "icon-bg-emerald", textColor: "text-emerald" },
              { icon: Shield, text: t("marketing.benefit6"), color: "icon-bg-rose", textColor: "text-rose" },
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

      {/* ═══ Security & Trust ═══ */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
        <div className="container max-w-5xl relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-5">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t("marketing.securityBadge")}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              {t("marketing.securityTitle").split("<1>")[0]}<span className="text-gradient">{t("marketing.securityTitle").split("<1>")[1]?.split("</1>")[0]}</span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {t("marketing.securitySubtitle")}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Lock, title: t("marketing.securityEncTitle"), desc: t("marketing.securityEncDesc"), gradient: "bg-hero-gradient", shadow: "shadow-primary/20" },
              { icon: Globe, title: t("marketing.securityGdprTitle"), desc: t("marketing.securityGdprDesc"), gradient: "bg-gradient-cool", shadow: "shadow-teal/20" },
              { icon: Server, title: t("marketing.securityRetentionTitle"), desc: t("marketing.securityRetentionDesc"), gradient: "bg-gradient-sunset", shadow: "shadow-violet/20" },
            ].map((item, i) => (
              <motion.div key={item.title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
                className="glass-card rounded-2xl p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className={`h-11 w-11 rounded-xl ${item.gradient} flex items-center justify-center mb-4 shadow-lg ${item.shadow}`}>
                  <item.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-base font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Trust badge row */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={4}
            className="flex flex-wrap justify-center gap-3">
            {[
              { icon: Lock, label: t("marketing.trustSsl") },
              { icon: Globe, label: t("marketing.trustGdpr") },
              { icon: ShieldCheck, label: t("marketing.trustEncrypted") },
              { icon: Eye, label: t("marketing.trustPrivacy") },
              { icon: Server, label: t("marketing.trustEuHosting") },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 text-xs font-semibold text-muted-foreground shadow-sm">
                <badge.icon className="h-3.5 w-3.5 text-primary" />
                {badge.label}
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
