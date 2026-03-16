import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PwaSettings {
  name?: string;
  short_name?: string;
  theme_color?: string;
  background_color?: string;
  icon?: string; // data URL or http URL
}

const DEFAULT_MANIFEST: Record<string, unknown> = {
  name: "Charmy - AI Financial Document Processing",
  short_name: "Charmy",
  description: "Turn invoices and receipts into accounting data automatically.",
  theme_color: "#9B2335",
  background_color: "#f5f6fa",
  display: "standalone",
  scope: "/",
  start_url: "/app",
  orientation: "any",
  categories: ["business", "finance", "productivity"],
  icons: [
    { src: "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
  shortcuts: [
    {
      name: "Upload Document",
      short_name: "Upload",
      description: "Upload a new document for processing",
      url: "/app/upload",
      icons: [{ src: "/pwa-icon-192.png", sizes: "192x192" }],
    },
    {
      name: "Scan Receipt",
      short_name: "Scan",
      description: "Scan a receipt with your camera",
      url: "/app?scan=true",
      icons: [{ src: "/pwa-icon-192.png", sizes: "192x192" }],
    },
    {
      name: "Review Documents",
      short_name: "Review",
      description: "Open the document review queue",
      url: "/app/documents",
      icons: [{ src: "/pwa-icon-192.png", sizes: "192x192" }],
    },
  ],
};

let currentBlobUrl: string | null = null;

function applyManifest(settings: PwaSettings) {
  const manifest = { ...DEFAULT_MANIFEST };

  if (settings.name) manifest.name = settings.name;
  if (settings.short_name) manifest.short_name = settings.short_name;
  if (settings.theme_color) manifest.theme_color = settings.theme_color;
  if (settings.background_color) manifest.background_color = settings.background_color;

  if (settings.icon) {
    manifest.icons = [
      { src: settings.icon, sizes: "192x192", type: "image/png" },
      { src: settings.icon, sizes: "512x512", type: "image/png" },
      { src: settings.icon, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ];
    // Update shortcuts icons too
    const shortcuts = DEFAULT_MANIFEST.shortcuts as Array<Record<string, unknown>>;
    manifest.shortcuts = shortcuts.map(s => ({
      ...s,
      icons: [{ src: settings.icon!, sizes: "192x192" }],
    }));
  }

  // Update theme-color meta tag
  if (settings.theme_color) {
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = settings.theme_color;
  }

  // Update manifest link
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
  if (settings.icon) {
    const appleTouchIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (appleTouchIcon) appleTouchIcon.href = settings.icon;
  }
}

function parseValue(val: unknown): string | null {
  if (typeof val !== "string") return null;
  if (val.startsWith("data:image") || val.startsWith("http") || val.startsWith("#") || val.length < 100) {
    return val;
  }
  try {
    const parsed = JSON.parse(val);
    return typeof parsed === "string" ? parsed : null;
  } catch {
    return val;
  }
}

async function loadPwaSettings(): Promise<PwaSettings> {
  const keys = ["pwa-icon", "pwa-name", "pwa-short-name", "pwa-theme-color", "pwa-bg-color"];
  const { data } = await supabase
    .from("demo_settings")
    .select("key, value")
    .in("key", keys);

  const settings: PwaSettings = {};
  data?.forEach((row) => {
    const val = parseValue(row.value);
    if (!val) return;
    switch (row.key) {
      case "pwa-icon": settings.icon = val; break;
      case "pwa-name": settings.name = val; break;
      case "pwa-short-name": settings.short_name = val; break;
      case "pwa-theme-color": settings.theme_color = val; break;
      case "pwa-bg-color": settings.background_color = val; break;
    }
  });
  return settings;
}

export function useDynamicPwaManifest() {
  useEffect(() => {
    loadPwaSettings().then(applyManifest);

    const handler = () => {
      loadPwaSettings().then(applyManifest);
    };

    window.addEventListener("pwa-settings-changed", handler);
    // legacy event
    window.addEventListener("pwa-icon-changed", handler);
    return () => {
      window.removeEventListener("pwa-settings-changed", handler);
      window.removeEventListener("pwa-icon-changed", handler);
    };
  }, []);
}
