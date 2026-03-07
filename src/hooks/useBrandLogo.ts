import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useBrandLogo() {
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      const isDark = document.documentElement.classList.contains("dark");
      const key = isDark ? "brand-logo-dark" : "brand-logo-light";

      const { data } = await supabase
        .from("demo_settings")
        .select("value")
        .eq("key", key)
        .maybeSingle();

      if (data?.value) {
        setLogo(data.value as string);
      } else if (isDark) {
        // fallback to light logo
        const { data: fallback } = await supabase
          .from("demo_settings")
          .select("value")
          .eq("key", "brand-logo-light")
          .maybeSingle();
        setLogo(fallback?.value as string | null);
      } else {
        setLogo(null);
      }
    };

    fetchLogo();

    const observer = new MutationObserver(() => fetchLogo());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("brand-logo-changed", fetchLogo);
    return () => {
      observer.disconnect();
      window.removeEventListener("brand-logo-changed", fetchLogo);
    };
  }, []);

  return logo;
}
