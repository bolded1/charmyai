import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export interface StorageInfo {
  usedBytes: number;
  limitBytes: number;
  purchasedBytes: number;
  totalLimitBytes: number;
  usedPercent: number;
  isFull: boolean;
  remainingBytes: number;
}

export function useStorageUsage() {
  const { activeWorkspace } = useWorkspace();
  const orgId = activeWorkspace?.id;

  return useQuery({
    queryKey: ["storage-usage", orgId],
    queryFn: async (): Promise<StorageInfo> => {
      if (!orgId) throw new Error("No active workspace");

      // Get org limits
      const { data: org, error: orgErr } = await supabase
        .from("organizations")
        .select("storage_limit_bytes, storage_purchased_bytes")
        .eq("id", orgId)
        .single();

      if (orgErr) throw orgErr;

      const limitBytes = (org as any)?.storage_limit_bytes ?? 1073741824;
      const purchasedBytes = (org as any)?.storage_purchased_bytes ?? 0;
      const totalLimitBytes = limitBytes + purchasedBytes;

      // Get usage via RPC
      const { data: usedBytes, error: usageErr } = await supabase.rpc("get_org_storage_usage", {
        _org_id: orgId,
      });

      if (usageErr) throw usageErr;

      const used = Number(usedBytes) || 0;
      const usedPercent = totalLimitBytes > 0 ? Math.min((used / totalLimitBytes) * 100, 100) : 0;

      return {
        usedBytes: used,
        limitBytes,
        purchasedBytes,
        totalLimitBytes,
        usedPercent,
        isFull: used >= totalLimitBytes,
        remainingBytes: Math.max(0, totalLimitBytes - used),
      };
    },
    enabled: !!orgId,
    staleTime: 30_000,
  });
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}
