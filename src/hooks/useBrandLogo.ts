import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

function normalizeLogoValue(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (value.startsWith("data:image")) return value;

  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "string" && parsed.startsWith("data:image") ? parsed : null;
  } catch {
    return null;
  }
}

export function useBrandLogo() {
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchLogo = async () => {
      const isDark = document.documentElement.classList.contains("dark");
      const key = isDark ? "brand-logo-dark" : "brand-logo-light";

      const { data } = await supabase
        .from("demo_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();

      const current = normalizeLogoValue(data?.value);
      if (current) {
        if (mounted) setLogo(current);
        return;
      }

      if (isDark) {
        const { data: fallback } = await supabase
          .from("demo_settings")
          .select("value")
          .eq("key", "brand-logo-light")
          .maybeSingle();

        if (mounted) setLogo(normalizeLogoValue(fallback?.value));
      } else if (mounted) {
        setLogo(null);
      }
    };

    fetchLogo();

    const observer = new MutationObserver(fetchLogo);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("brand-logo-changed", fetchLogo);

    return () => {
      mounted = false;
      observer.disconnect();
      window.removeEventListener("brand-logo-changed", fetchLogo);
    };
  }, []);

  return logo;
}
