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
 * Returns the appropriate brand logo:
 * - Inside /app/*: prefers organization logo, falls back to admin (demo_settings) logo
 * - Outside /app/*: uses admin (demo_settings) logo only
 */
export function useBrandLogo() {
  const [logo, setLogo] = useState<string | null>(null);
  let pathname = "/";
  try {
    // useLocation only works inside Router, guard for safety
    pathname = useLocation().pathname;
  } catch {
    // outside router context, default to marketing
  }
  const isApp = pathname.startsWith("/app");

  useEffect(() => {
    let mounted = true;

    const fetchLogo = async () => {
      const isDark = document.documentElement.classList.contains("dark");

      // If inside app, try org logo first
      if (isApp) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("logo_light, logo_dark")
          .limit(1)
          .maybeSingle();

        if (orgData) {
          const orgLogo = isDark ? (orgData.logo_dark || orgData.logo_light) : orgData.logo_light;
          if (orgLogo) {
            if (mounted) setLogo(orgLogo);
            return;
          }
        }
      }

      // Fall back to admin logo from demo_settings
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

      // Dark mode fallback to light admin logo
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
  }, [isApp]);

  return logo;
}
