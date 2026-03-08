import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import { Link } from "react-router-dom";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

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

  const dismiss = (choice: string) => {
    localStorage.setItem("cookie-consent", choice);
    document.body.style.overflow = "";
    setVisible(false);
  };

  const handleAccept = () => dismiss("accepted");
  const handleReject = () => dismiss("rejected");

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50"
            onClick={handleReject}
          />
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-50"
          >
          <div className="glass-card-elevated rounded-2xl p-5 shadow-xl border border-border/50">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl icon-bg-amber flex items-center justify-center shrink-0">
                <Cookie className="h-5 w-5 text-amber" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold mb-1">We use cookies</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  We use essential cookies for authentication and security. Analytics cookies are optional.{" "}
                  <Link to="/privacy" className="text-primary hover:underline font-medium">
                    Privacy Policy
                  </Link>
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
              <button
                onClick={handleReject}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
