import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SystemSettings {
  maintenance: boolean;
  newSignups: boolean;
  debugLog: boolean;
}

const DEFAULTS: SystemSettings = {
  maintenance: false,
  newSignups: true,
  debugLog: false,
};

const KEYS_MAP: Record<string, keyof SystemSettings> = {
  maintenance: "maintenance",
  "new-signups": "newSignups",
  "debug-log": "debugLog",
};

function toBool(val: unknown): boolean | null {
  if (typeof val === "boolean") return val;
  if (val === "true" || val === true) return true;
  if (val === "false" || val === false) return false;
  return null;
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ["system-settings"],
    queryFn: async () => {
      const keys = Object.keys(KEYS_MAP);
      const { data, error } = await supabase
        .from("demo_settings")
        .select("key, value")
        .in("key", keys);

      if (error) throw error;

      const settings = { ...DEFAULTS };
      data?.forEach((row) => {
        const field = KEYS_MAP[row.key];
        if (field) {
          const parsed = toBool(row.value);
          if (parsed !== null) {
            (settings as any)[field] = parsed;
          }
        }
      });

      // Apply debug logging globally
      (window as any).__DEBUG_LOG = settings.debugLog;

      return settings;
    },
    staleTime: 30_000,
  });
}
