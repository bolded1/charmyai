// ═══════════════════════════════════════════════
//  Color Utilities — Theme System for LedgerFlow
// ═══════════════════════════════════════════════

// ── HEX ↔ HSL conversion ──────────────────────

export function hexToHsl(hex: string): string {
  let r = 0, g = 0, b = 0;
  const h6 = hex.replace("#", "");
  if (h6.length === 3) {
    r = parseInt(h6[0] + h6[0], 16) / 255;
    g = parseInt(h6[1] + h6[1], 16) / 255;
    b = parseInt(h6[2] + h6[2], 16) / 255;
  } else if (h6.length === 6) {
    r = parseInt(h6.substring(0, 2), 16) / 255;
    g = parseInt(h6.substring(2, 4), 16) / 255;
    b = parseInt(h6.substring(4, 6), 16) / 255;
  }

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function hslToHex(hslStr: string): string {
  const parts = hslStr.replace(/%/g, "").split(/\s+/).map(Number);
  const h = parts[0] / 360;
  const s = parts[1] / 100;
  const l = parts[2] / 100;

  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

// ── Validation ─────────────────────────────────

export function isValidHex(hex: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
}

// ── Accessibility: relative luminance & contrast ──

function hexToRgb(hex: string): [number, number, number] {
  const h6 = hex.replace("#", "");
  return [
    parseInt(h6.substring(0, 2), 16),
    parseInt(h6.substring(2, 4), 16),
    parseInt(h6.substring(4, 6), 16),
  ];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Returns the best foreground color (white or black) for a given background HEX */
export function getContrastForeground(bgHex: string): "white" | "black" {
  const [r, g, b] = hexToRgb(bgHex.length === 4 ? `#${bgHex[1]}${bgHex[1]}${bgHex[2]}${bgHex[2]}${bgHex[3]}${bgHex[3]}` : bgHex);
  const lum = relativeLuminance(r, g, b);
  // WCAG: contrast ratio >= 4.5:1 for normal text
  // luminance of white = 1, black = 0
  const contrastWhite = (1.05) / (lum + 0.05);
  const contrastBlack = (lum + 0.05) / 0.05;
  return contrastWhite >= contrastBlack ? "white" : "black";
}

/** WCAG contrast ratio between two hex colors */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(...hexToRgb(hex1));
  const l2 = relativeLuminance(...hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// ── Color variations ───────────────────────────

export function generateColorVariations(hex: string) {
  const hsl = hexToHsl(hex);
  const parts = hsl.replace(/%/g, "").split(/\s+/).map(Number);
  const h = parts[0], s = parts[1], l = parts[2];
  const fg = getContrastForeground(hex);

  return {
    primary: `${h} ${s}% ${l}%`,
    primaryForeground: fg === "white" ? "0 0% 100%" : "0 0% 5%",
    hover: `${h} ${s}% ${Math.max(l - 8, 5)}%`,
    pressed: `${h} ${s}% ${Math.max(l - 12, 3)}%`,
    // Light mode variants
    soft: `${h} 40% 95%`,
    border: `${h} 40% 80%`,
    focusRing: `${h} ${s}% ${l}%`,
    icon: `${h} ${Math.min(s + 8, 100)}% ${Math.min(l + 8, 65)}%`,
    link: `${h} ${s}% ${l}%`,
    inputFocus: `${h} ${s}% ${l}%`,
    sidebarActiveBg: `${h} 40% 95%`,
    sidebarActiveText: `${h} ${s}% ${Math.max(l - 8, 10)}%`,
    // Dark mode variants
    softDark: `${h} 30% 14%`,
    borderDark: `${h} 35% 26%`,
    iconDark: `${h} 65% 60%`,
    linkDark: `${h} 65% 58%`,
    sidebarActiveBgDark: `${h} 25% 12%`,
    sidebarActiveTextDark: `${h} 50% 62%`,
    // Chart palette derived from accent hue
    chart1: `${h} ${s}% ${l}%`,
    chart2: `${(h + 45) % 360} 45% 55%`,
    chart3: `${(h + 120) % 360} 40% 50%`,
    chart4: `${(h + 200) % 360} 35% 55%`,
    chart5: `${(h + 280) % 360} 30% 50%`,
    // Hero gradient
    heroGradientFrom: `${h} ${s}% ${l}%`,
    heroGradientTo: `${h} ${Math.min(s + 8, 100)}% ${Math.min(l + 7, 55)}%`,
  };
}

// ── Apply accent color to CSS variables ────────

export function applyAccentColor(hex: string) {
  const root = document.documentElement;
  const vars = generateColorVariations(hex);
  // Primary
  root.style.setProperty("--primary", vars.primary);
  root.style.setProperty("--primary-foreground", vars.primaryForeground);
  root.style.setProperty("--primary-hover", vars.hover);
  root.style.setProperty("--ring", vars.focusRing);

  // Brand surfaces
  root.style.setProperty("--brand-soft", vars.soft);
  root.style.setProperty("--brand-border", vars.border);
  root.style.setProperty("--primary-icon", vars.icon);

  // Input & link
  root.style.setProperty("--input-focus", vars.inputFocus);
  root.style.setProperty("--link-color", vars.link);

  // Info (tied to accent)
  root.style.setProperty("--info", vars.primary);
  root.style.setProperty("--info-soft", vars.soft);

  // Sidebar
  root.style.setProperty("--sidebar-primary", vars.primary);
  root.style.setProperty("--sidebar-primary-foreground", vars.primaryForeground);
  root.style.setProperty("--sidebar-ring", vars.primary);
  root.style.setProperty("--sidebar-active-bg", vars.sidebarActiveBg);
  root.style.setProperty("--sidebar-active-text", vars.sidebarActiveText);

  // Charts
  root.style.setProperty("--chart-1", vars.chart1);
  root.style.setProperty("--chart-2", vars.chart2);
  root.style.setProperty("--chart-3", vars.chart3);
  root.style.setProperty("--chart-4", vars.chart4);
  root.style.setProperty("--chart-5", vars.chart5);

  // Hero gradient
  root.style.setProperty("--hero-gradient",
    `linear-gradient(135deg, hsl(${vars.heroGradientFrom}), hsl(${vars.heroGradientTo}))`);
}

// ── Constants ──────────────────────────────────

export const DEFAULT_ACCENT_COLOR = "#9B2335";

export const PRESET_COLORS = [
  { name: "Navy", hex: "#1E3A8A" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Emerald", hex: "#059669" },
  { name: "Violet", hex: "#7C3AED" },
  { name: "Rose", hex: "#E11D48" },
  { name: "Amber", hex: "#D97706" },
  { name: "Teal", hex: "#0D9488" },
  { name: "Indigo", hex: "#4F46E5" },
  { name: "Coral", hex: "#F97316" },
  { name: "Crimson", hex: "#DC2626" },
];
