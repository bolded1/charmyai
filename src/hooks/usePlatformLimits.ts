import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformLimits {
  maxFileSize: number;       // MB
  maxFilesPerUpload: number;
  proDocsLimit: number;      // per month
  proUsersLimit: number;
}

const DEFAULTS: PlatformLimits = {
  maxFileSize: 20,
  maxFilesPerUpload: 10,
  proDocsLimit: 999999,
  proUsersLimit: 10,
};

const KEYS_MAP: Record<string, keyof PlatformLimits> = {
  "max-file-size": "maxFileSize",
  "max-files": "maxFilesPerUpload",
  "pro-docs-limit": "proDocsLimit",
  "pro-users-limit": "proUsersLimit",
};

export function usePlatformLimits() {
  return useQuery({
    queryKey: ["platform-limits"],
    queryFn: async () => {
      const keys = Object.keys(KEYS_MAP);
      const { data, error } = await supabase
        .from("demo_settings")
        .select("key, value")
        .in("key", keys);

      if (error) throw error;

      const limits = { ...DEFAULTS };
      data?.forEach((row) => {
        const field = KEYS_MAP[row.key];
        if (field) {
          const val = typeof row.value === "string" ? Number(row.value) : Number(row.value);
          if (!isNaN(val)) {
            (limits as any)[field] = val;
          }
        }
      });

      return limits;
    },
    staleTime: 60_000, // cache for 1 minute
  });
}
