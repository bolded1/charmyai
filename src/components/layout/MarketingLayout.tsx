import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileText, Menu, X, ArrowRight, Sparkles, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { motion, AnimatePresence } from "framer-motion";
import { useCookieConsent } from "@/components/CookieConsent";

const navLinks = [
  { label: "Features", to: "/features", description: "See what Charmy can do" },
  { label: "Pricing", to: "/pricing", description: "Plans that scale with you" },
  { label: "About", to: "/about", description: "Our story and mission" },
  { label: "Contact", to: "/contact", description: "Get in touch with us" },
];

export default function MarketingLayout() {
  const brandLogo = useBrandLogo();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { openPreferences } = useCookieConsent();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div className="marketing min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            {brandLogo ? (
              <img src={brandLogo} alt="Charmy" className="h-8 max-w-[10rem] object-contain" />
            ) : (
              <>
                <div className="h-8 w-8 rounded-lg bg-hero-gradient flex items-center justify-center">
                  <FileText className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-foreground">Charmy</span>
              </>
            )}
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <Link key={l.to} to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/signup">Start Free Trial</Link>
            </Button>
          </div>

          <button
            className="md:hidden relative z-50 h-10 w-10 flex items-center justify-center rounded-xl hover:bg-accent transition-colors"
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
      </header>

      {/* Mobile fullscreen menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 md:hidden"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" />

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25, delay: 0.05 }}
              className="relative pt-20 px-6 pb-8 flex flex-col h-full"
            >
              {/* Nav links */}
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

              {/* CTA buttons */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="space-y-3 pt-6 border-t border-border/50"
              >
                <Button size="lg" asChild className="w-full h-12 rounded-xl text-sm font-semibold shadow-md shadow-primary/15">
                  <Link to="/signup">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start Free Trial
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild className="w-full h-12 rounded-xl text-sm font-medium">
                  <Link to="/login">Sign In</Link>
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
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Company</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/about" className="block hover:text-foreground">About</Link>
                <Link to="/contact" className="block hover:text-foreground">Contact</Link>
                <Link to="/help" className="block hover:text-foreground">Help & Docs</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Legal</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <Link to="/privacy" className="block hover:text-foreground">Privacy Policy</Link>
                <Link to="/terms" className="block hover:text-foreground">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-sm text-muted-foreground text-center">
            © 2024 Charmy. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
