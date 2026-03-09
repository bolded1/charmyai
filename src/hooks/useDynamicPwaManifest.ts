import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_MANIFEST = {
  name: "Charmy - AI Financial Document Processing",
  short_name: "Charmy",
  description: "Turn invoices and receipts into accounting data automatically.",
  theme_color: "#2563EB",
  background_color: "#f5f6fa",
  display: "standalone",
  scope: "/",
  start_url: "/",
  icons: [
    { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};

let currentBlobUrl: string | null = null;

function applyManifest(iconUrl: string | null) {
  const manifest = { ...DEFAULT_MANIFEST };

  if (iconUrl) {
    manifest.icons = [
      { src: iconUrl, sizes: "192x192", type: "image/png" },
      { src: iconUrl, sizes: "512x512", type: "image/png" },
      { src: iconUrl, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ];
  }

  // Update the manifest link
  if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
  const blob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
  currentBlobUrl = URL.createObjectURL(blob);

  let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "manifest";
    document.head.appendChild(link);
  }
  link.href = currentBlobUrl;

  // Update apple-touch-icon
  const appleTouchIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (appleTouchIcon && iconUrl) {
    appleTouchIcon.href = iconUrl;
  }
}

export function useDynamicPwaManifest() {
  useEffect(() => {
    supabase
      .from("demo_settings")
      .select("value")
      .eq("key", "pwa-icon")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && typeof data.value === "string" && data.value.startsWith("http")) {
          applyManifest(data.value);
        }
      });

    // Listen for changes from admin
    const handler = () => {
      supabase
        .from("demo_settings")
        .select("value")
        .eq("key", "pwa-icon")
        .maybeSingle()
        .then(({ data }) => {
          applyManifest(
            data?.value && typeof data.value === "string" && data.value.startsWith("http")
              ? data.value
              : null
          );
        });
    };

    window.addEventListener("pwa-icon-changed", handler);
    return () => window.removeEventListener("pwa-icon-changed", handler);
  }, []);
}
