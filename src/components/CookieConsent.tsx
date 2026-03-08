import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Cookie, ChevronLeft } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePageContent } from "@/hooks/usePageContent";
import { privacyDefaults } from "@/lib/cms-defaults";

const CookieConsentContext = createContext<{ openPreferences: () => void }>({ openPreferences: () => {} });

export const useCookieConsent = () => useContext(CookieConsentContext);

export function CookieConsentProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const { content: c } = usePageContent("privacy", privacyDefaults);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => {
        setVisible(true);
        document.body.style.overflow = "hidden";
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const openPreferences = useCallback(() => {
    setShowPrivacy(false);
    setVisible(true);
    document.body.style.overflow = "hidden";
  }, []);

  const dismiss = (choice: string) => {
    localStorage.setItem("cookie-consent", choice);
    document.body.style.overflow = "";
    setVisible(false);
    setShowPrivacy(false);
  };

  const handleAccept = () => dismiss("accepted");

  const handleReject = () => {
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    dismiss("rejected");
  };

  const sections = Array.from({ length: 14 }, (_, i) => ({
    title: c[`section${i + 1}Title`],
    body: c[`section${i + 1}Body`],
  })).filter((s) => s.title);

  return (
    <CookieConsentContext.Provider value={{ openPreferences }}>
      {children}
      <AnimatePresence>
        {visible && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-[60]"
            />
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`fixed z-[60] ${
                showPrivacy
                  ? "inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-lg md:w-full"
                  : "bottom-4 left-4 right-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-sm"
              }`}
              layout
            >
              <div className="bg-card rounded-2xl shadow-xl border border-border flex flex-col max-h-[calc(100vh-2rem)] md:max-h-[80vh] overflow-hidden">
                <AnimatePresence mode="wait">
                  {showPrivacy ? (
                    <motion.div
                      key="privacy"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col min-h-0 max-h-[calc(100vh-2rem)] md:max-h-[80vh] overflow-hidden"
                    >
                      <div className="flex items-center gap-3 p-4 border-b border-border shrink-0">
                        <button
                          onClick={() => setShowPrivacy(false)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-accent transition-colors"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <h3 className="text-sm font-bold">{c.title}</h3>
                      </div>
                      <div className="flex-1 min-h-0 overflow-y-auto">
                        <div className="p-4 space-y-4">
                          <p className="text-xs text-muted-foreground leading-relaxed">{c.intro}</p>
                          {sections.map((section, i) => (
                            <div key={i}>
                              <h4 className="text-xs font-bold mb-1">{section.title}</h4>
                              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{section.body}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-4 border-t border-border shrink-0">
                        <Button size="sm" className="rounded-lg text-xs h-8 px-4 flex-1" onClick={handleAccept}>
                          Accept All
                        </Button>
                        <Button size="sm" variant="outline" className="rounded-lg text-xs h-8 px-4 flex-1" onClick={handleReject}>
                          Essential Only
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="consent"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl icon-bg-amber flex items-center justify-center shrink-0">
                          <Cookie className="h-5 w-5 text-amber" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold mb-1">We use cookies</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                            We use essential cookies for authentication and security. Analytics cookies are optional.{" "}
                            <button
                              onClick={() => setShowPrivacy(true)}
                              className="text-primary hover:underline font-medium inline"
                            >
                              Privacy Policy
                            </button>
                          </p>
                          <div className="flex items-center gap-2">
                            <Button size="sm" className="rounded-lg text-xs h-8 px-4" onClick={handleAccept}>
                              Accept All
                            </Button>
                            <Button size="sm" variant="outline" className="rounded-lg text-xs h-8 px-4" onClick={handleReject}>
                              Essential Only
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </CookieConsentContext.Provider>
  );
}
