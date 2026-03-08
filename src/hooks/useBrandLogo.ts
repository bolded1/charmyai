import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

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

/**
 * Returns the appropriate brand logo (always light mode).
 * - Inside /app/*: prefers organization logo, falls back to admin (demo_settings) logo
 * - Outside /app/*: uses admin (demo_settings) logo only
 */
export function useBrandLogo() {
  const [logo, setLogo] = useState<string | null>(null);
  let pathname = "/";
  try {
    pathname = useLocation().pathname;
  } catch {
    // outside router context, default to marketing
  }
  const isApp = pathname.startsWith("/app");

  useEffect(() => {
    let mounted = true;

    const fetchLogo = async () => {
      // If inside app, try org logo first
      if (isApp) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("logo_light")
          .limit(1)
          .maybeSingle();

        if (orgData?.logo_light) {
          if (mounted) setLogo(orgData.logo_light);
          return;
        }
      }

      // Fall back to admin logo from demo_settings (always light)
      const { data } = await supabase
        .from("demo_settings")
        .select("value")
        .eq("key", "brand-logo-light")
        .maybeSingle();

      if (mounted) setLogo(normalizeLogoValue(data?.value));
    };

    fetchLogo();
    window.addEventListener("brand-logo-changed", fetchLogo);

    return () => {
      mounted = false;
      window.removeEventListener("brand-logo-changed", fetchLogo);
    };
  }, [isApp]);

  return logo;
}
