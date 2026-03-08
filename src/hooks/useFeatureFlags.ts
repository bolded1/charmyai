import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface FeatureFlag {
  key: string;
  enabled: boolean;
  segment: string;
  user_ids: string[];
}

let cachedFlags: FeatureFlag[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 60000; // 1 min

export function useFeatureFlags() {
  const [flags, setFlags] = useState<FeatureFlag[]>(cachedFlags || []);
  const [loading, setLoading] = useState(!cachedFlags);

  useEffect(() => {
    if (cachedFlags && Date.now() - cacheTime < CACHE_TTL) {
      setFlags(cachedFlags);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      const { data } = await supabase
        .from("feature_flags_public")
        .select("key, enabled, segment, user_ids");
      const parsed = (data || []).map((f: any) => ({
        key: f.key,
        enabled: f.enabled,
        segment: f.segment,
        user_ids: Array.isArray(f.user_ids) ? f.user_ids : [],
      }));
      cachedFlags = parsed;
      cacheTime = Date.now();
      setFlags(parsed);
      setLoading(false);
    };

    fetch();
  }, []);

  const isEnabled = (flagKey: string, userId?: string): boolean => {
    const flag = flags.find((f) => f.key === flagKey);
    if (!flag || !flag.enabled) return false;
    if (flag.segment === "all") return true;
    if (flag.segment === "specific" && userId) {
      return flag.user_ids.includes(userId);
    }
    return false;
  };

  return { flags, loading, isEnabled };
}
