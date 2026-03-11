import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Menu, X, ArrowRight, Sparkles, ChevronRight, LogIn, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { motion, AnimatePresence } from "framer-motion";
import { useCookieConsent } from "@/components/CookieConsent";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function MarketingLayout() {
  const brandLogo = useBrandLogo();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { openPreferences } = useCookieConsent();
  const { user } = useAuth();
  const { t } = useTranslation();

  const navLinks = [
    { label: t("marketing.features"), to: "/features", description: t("features.heroDesc") },
    { label: t("marketing.pricing"), to: "/pricing", description: t("pricing.heroDesc") },
    { label: t("marketing.tryDemo"), to: "/demo", description: t("marketing.tryDemo") },
    { label: t("marketing.about"), to: "/about", description: t("marketing.about") },
    { label: t("marketing.contact"), to: "/contact", description: t("marketing.contact") },
  ];

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="marketing min-h-screen flex flex-col">
      {/* Floating Header */}
      <header className="fixed inset-x-0 top-0 z-50 w-full pointer-events-none">
        <div className="pointer-events-auto transition-all duration-300 max-w-5xl mx-4 md:mx-auto rounded-2xl border border-white/30" style={{
          marginTop: '0.75rem',
          background: 'hsla(0, 0%, 100%, 0.55)',
          backdropFilter: 'blur(24px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
          boxShadow: '0 8px 32px -8px hsla(224, 76%, 48%, 0.07), inset 0 1px 0 0 hsla(0, 0%, 100%, 0.6)',
        }}>
          <div className="flex h-14 items-center justify-between px-4 md:px-6">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
              {brandLogo ? (
                <img src={brandLogo} alt="Charmy" className="h-6 max-w-[7rem] object-contain" />
              ) : (
                <>
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: -3 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="h-7 w-7 rounded-lg bg-hero-gradient flex items-center justify-center shadow-md shadow-primary/20"
                  >
                    <FileText className="h-3.5 w-3.5 text-primary-foreground" />
                  </motion.div>
                  <span className="text-foreground font-bold text-[15px] tracking-tight">Charmy</span>
                </>
              )}
            </Link>

            {/* Desktop Nav — centered pill links */}
            <nav className="hidden lg:flex items-center gap-1 bg-muted/50 rounded-xl px-1.5 py-1">
              {navLinks.map((l) => {
                const isActive = location.pathname === l.to;
                return (
                  <Link
                    key={l.to}
                    to={l.to}
                    className={`relative px-3.5 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-background rounded-lg shadow-sm border border-border/60"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{l.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-2">
              <LanguageSwitcher variant="ghost" />
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground h-8 px-3 text-[13px]">
                <Link to={user ? "/app" : "/login"}>
                  {user ? <LayoutDashboard className="h-3.5 w-3.5 mr-1.5" /> : <LogIn className="h-3.5 w-3.5 mr-1.5" />}
                  {user ? t("marketing.dashboard") : t("marketing.login")}
                </Link>
              </Button>
              {!user && (
                <Button size="sm" asChild className="h-8 px-4 text-[13px] rounded-lg shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-px transition-all duration-200">
                  <Link to="/signup">{t("common.getStarted")}</Link>
                </Button>
              )}
            </div>

            {/* Mobile: language + hamburger */}
            <div className="lg:hidden flex items-center gap-1">
              <LanguageSwitcher variant="ghost" />
              <button
                className="relative z-50 h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
              >
              <AnimatePresence mode="wait">
                {mobileOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <X className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                    <Menu className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile fullscreen menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className="relative pt-20 px-6 pb-8 flex flex-col h-full"
            >
              <nav className="space-y-1 flex-1">
                {navLinks.map((l, i) => {
                  const isActive = location.pathname === l.to;
                  return (
                    <motion.div
                      key={l.to}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25, delay: 0.08 + i * 0.05 }}
                    >
                      <Link
                        to={l.to}
                        className={`group flex items-center justify-between rounded-2xl px-4 py-4 transition-all ${
                          isActive
                            ? "bg-primary/8 border border-primary/15"
                            : "hover:bg-accent/60"
                        }`}
                      >
                        <div>
                          <span className={`block text-base font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
                            {l.label}
                          </span>
                        </div>
                        <ChevronRight className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 ${isActive ? "text-primary" : "text-muted-foreground/50"}`} />
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="space-y-3 pt-6 border-t border-border/50"
              >
                <Button variant="outline" size="lg" asChild className="w-full h-12 rounded-xl text-sm font-medium">
                  <Link to={user ? "/app" : "/login"}>{user ? t("marketing.dashboard") : t("marketing.login")}</Link>
                </Button>
                <Button size="lg" asChild className="w-full h-12 rounded-xl text-sm font-semibold shadow-md shadow-primary/15">
                  <Link to="/signup">
                    <Sparkles className="h-4 w-4 mr-2" />
                    {t("common.getStarted")}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-card">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 font-bold text-lg mb-4">
                {brandLogo ? (
                  <img src={brandLogo} alt="Charmy" className="h-8 max-w-[10rem] object-contain" />
                ) : (
                  <>
                    <div className="h-8 w-8 rounded-lg bg-hero-gradient flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary-foreground" />
                    </div>
                    Charmy
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{t("marketing.footerDesc")}</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">{t("marketing.product")}</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/features" className="block hover:text-foreground">{t("marketing.features")}</Link>
                <Link to="/pricing" className="block hover:text-foreground">{t("marketing.pricing")}</Link>
                <Link to="/demo" className="block hover:text-foreground">{t("marketing.tryDemo")}</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">{t("marketing.company")}</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/about" className="block hover:text-foreground">{t("marketing.about")}</Link>
                <Link to="/contact" className="block hover:text-foreground">{t("marketing.contact")}</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">{t("marketing.legal")}</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/privacy" className="block hover:text-foreground">{t("marketing.privacyPolicy")}</Link>
                <Link to="/terms" className="block hover:text-foreground">{t("marketing.termsOfService")}</Link>
                <Link to="/refund-policy" className="block hover:text-foreground">{t("marketing.refundPolicy")}</Link>
                <Link to="/acceptable-use" className="block hover:text-foreground">{t("marketing.acceptableUse")}</Link>
                <button onClick={openPreferences} className="block hover:text-foreground text-left">{t("marketing.cookiePreferences")}</button>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-sm text-muted-foreground text-center space-y-1">
            <p>© {new Date().getFullYear()} Charmy. {t("marketing.allRightsReserved")}</p>
            <p className="text-xs">{t("marketing.designedBy")} <a href="https://devitus.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors underline underline-offset-2">Devitus Digital Ltd</a></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
