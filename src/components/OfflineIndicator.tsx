import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-amber-500/10 border-b border-amber-500/20 overflow-hidden"
        >
          <div className="px-4 py-2 flex items-center gap-2">
            <WifiOff className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700 font-medium">
              You're offline. Some features may be limited. Uploads will be queued until you're back online.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
