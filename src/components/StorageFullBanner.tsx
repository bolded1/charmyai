import { AlertCircle, HardDrive } from "lucide-react";
import { Link } from "react-router-dom";
import { useStorageUsage, formatBytes } from "@/hooks/useStorageUsage";

export function StorageFullBanner() {
  const { data: storage } = useStorageUsage();

  if (!storage?.isFull) return null;

  return (
    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2.5 flex items-center justify-between gap-3 text-sm rounded-lg mx-4 mt-2 mb-0 md:mx-0">
      <div className="flex items-center gap-2 min-w-0">
        <HardDrive className="h-4 w-4 shrink-0" />
        <span className="font-medium">Storage full</span>
        <span className="text-destructive/70 hidden sm:inline">
          — {formatBytes(storage.usedBytes)} of {formatBytes(storage.totalLimitBytes)} used. Upgrade to continue uploading documents.
        </span>
      </div>
      <Link
        to="/app/settings?tab=storage"
        className="shrink-0 text-xs font-semibold underline underline-offset-2 hover:text-destructive/80"
      >
        Get more storage →
      </Link>
    </div>
  );
}
