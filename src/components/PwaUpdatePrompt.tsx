import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      // Check for updates every 30 minutes
      if (r) {
        setInterval(() => r.update(), 30 * 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[360px] z-50"
      >
        <div className="bg-card border border-border rounded-xl shadow-xl p-4 flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <RefreshCw className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Update available</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              A new version of Charmy is ready. Refresh to get the latest features.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => updateServiceWorker(true)}
              >
                Refresh now
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setNeedRefresh(false)}
              >
                Later
              </Button>
            </div>
          </div>
          <button
            onClick={() => setNeedRefresh(false)}
            className="text-muted-foreground hover:text-foreground p-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
