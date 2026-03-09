import { usePwaInstall } from "@/hooks/usePwaInstall";
import { Button } from "@/components/ui/button";
import { Download, Smartphone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export function PwaInstallBanner() {
  const { canInstall, isInstalled, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Show banner after a short delay post-login
    const wasDismissed = sessionStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) {
      setDismissed(true);
      return;
    }
    const timer = setTimeout(() => setShowBanner(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("pwa-install-dismissed", "1");
  };

  if (isInstalled || dismissed || !showBanner) return null;

  // On iOS, show instructions since beforeinstallprompt isn't supported
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="border-b border-amber-300/40 bg-amber-50 overflow-hidden"
      >
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Smartphone className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Install Charmy as a Desktop App</p>
            <p className="text-xs text-muted-foreground">
              {isIOS
                ? "Tap Share → Add to Home Screen for a native app experience"
                : "Add Charmy to your desktop as a Progressive Web App — quick launch, offline access, and a native feel without an app store"
              }
            </p>
          </div>
          {canInstall && (
            <Button
              size="sm"
              className="h-8 text-xs shrink-0 gap-1.5"
              onClick={promptInstall}
            >
              <Download className="h-3.5 w-3.5" />
              Install
            </Button>
          )}
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground p-1 shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
