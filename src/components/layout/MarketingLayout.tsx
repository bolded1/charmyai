import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Menu, X, ArrowRight, Sparkles, ChevronRight, LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { motion, AnimatePresence } from "framer-motion";
import { useCookieConsent } from "@/components/CookieConsent";

const navLinks = [
  { label: "Features", to: "/features", description: "See what Charmy can do" },
  { label: "Pricing", to: "/pricing", description: "Plans that scale with you" },
  { label: "Try Demo", to: "/demo", description: "Test Charmy instantly" },
  { label: "About", to: "/about", description: "Our story and mission" },
  { label: "Contact", to: "/contact", description: "Get in touch with us" },
];

export default function MarketingLayout() {
  const brandLogo = useBrandLogo();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { openPreferences } = useCookieConsent();

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
      <header className="sticky top-0 z-50 w-full pointer-events-none">
        <div className="pointer-events-auto transition-all duration-300 max-w-5xl mx-4 md:mx-auto rounded-2xl border border-border/40" style={{
          scrolled
            ? "mt-3 bg-card/85 backdrop-blur-xl shadow-lg shadow-primary/[0.06] border-border/50"
            : "mt-3 bg-card shadow-lg shadow-primary/[0.03]"
        }`}>
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
              <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground h-8 px-3 text-[13px]">
                <Link to="/login">
                  <LogIn className="h-3.5 w-3.5 mr-1.5" />
                  Log In
                </Link>
              </Button>
              <Button size="sm" asChild className="h-8 px-4 text-[13px] rounded-lg shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-px transition-all duration-200">
                <Link to="/signup">Start Free Trial</Link>
              </Button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="lg:hidden relative z-50 h-9 w-9 flex items-center justify-center rounded-lg hover:bg-accent transition-colors"
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
                          <span className="block text-xs text-muted-foreground mt-0.5">{l.description}</span>
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
                  <Link to="/login">Log In</Link>
                </Button>
                <Button size="lg" asChild className="w-full h-12 rounded-xl text-sm font-semibold shadow-md shadow-primary/15">
                  <Link to="/signup">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start Free Trial
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
              <p className="text-sm text-muted-foreground">AI-powered financial document processing for modern businesses.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Product</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/features" className="block hover:text-foreground">Features</Link>
                <Link to="/pricing" className="block hover:text-foreground">Pricing</Link>
                <Link to="/demo" className="block hover:text-foreground">Try Demo</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Company</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/about" className="block hover:text-foreground">About</Link>
                <Link to="/contact" className="block hover:text-foreground">Contact</Link>
                <Link to="/help" className="block hover:text-foreground">Help & Documentation</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Legal</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/privacy" className="block hover:text-foreground">Privacy Policy</Link>
                <Link to="/terms" className="block hover:text-foreground">Terms of Service</Link>
                <Link to="/acceptable-use" className="block hover:text-foreground">Acceptable Use</Link>
                <button onClick={openPreferences} className="block hover:text-foreground text-left">Cookie Preferences</button>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-sm text-muted-foreground text-center">
            © {new Date().getFullYear()} Charmy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
