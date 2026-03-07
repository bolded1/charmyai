// Convert HEX to HSL string "h s% l%"
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

// Convert HSL string "h s% l%" to HEX
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

// Validate HEX color
export function isValidHex(hex: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
}

// Generate color variations from a HEX color
export function generateColorVariations(hex: string) {
  const hsl = hexToHsl(hex);
  const parts = hsl.replace(/%/g, "").split(/\s+/).map(Number);
  const h = parts[0], s = parts[1], l = parts[2];

  return {
    primary: `${h} ${s}% ${l}%`,
    hover: `${h} ${s}% ${Math.max(l - 8, 5)}%`,
    soft: `${h} 40% 95%`,
    softDark: `${h} 30% 14%`,
    border: `${h} 40% 80%`,
    sidebarActiveBg: `${h} 40% 95%`,
    sidebarActiveBgDark: `${h} 25% 12%`,
    sidebarActiveText: `${h} ${s}% ${Math.max(l - 8, 10)}%`,
    sidebarActiveTextDark: `${h} 50% 62%`,
  };
}

// Apply accent color to CSS variables
export function applyAccentColor(hex: string) {
  const root = document.documentElement;
  const vars = generateColorVariations(hex);
  const isDark = root.classList.contains("dark");

  root.style.setProperty("--primary", vars.primary);
  root.style.setProperty("--ring", vars.primary);
  root.style.setProperty("--sidebar-primary", vars.primary);
  root.style.setProperty("--sidebar-ring", vars.primary);
  root.style.setProperty("--primary-hover", vars.hover);
  root.style.setProperty("--brand-soft", isDark ? vars.softDark : vars.soft);
  root.style.setProperty("--sidebar-active-bg", isDark ? vars.sidebarActiveBgDark : vars.sidebarActiveBg);
  root.style.setProperty("--sidebar-active-text", isDark ? vars.sidebarActiveTextDark : vars.sidebarActiveText);
}

export const DEFAULT_ACCENT_COLOR = "#1E3A8A";

export const PRESET_COLORS = [
  { name: "Navy", hex: "#1E3A8A" },
  { name: "Blue", hex: "#2563EB" },
  { name: "Emerald", hex: "#059669" },
  { name: "Violet", hex: "#7C3AED" },
  { name: "Rose", hex: "#E11D48" },
  { name: "Amber", hex: "#D97706" },
  { name: "Teal", hex: "#0D9488" },
  { name: "Indigo", hex: "#4F46E5" },
];
