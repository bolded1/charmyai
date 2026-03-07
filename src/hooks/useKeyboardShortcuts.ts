import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export interface Shortcut {
  key: string;
  mod: boolean; // Cmd on Mac, Ctrl otherwise
  shift?: boolean;
  label: string;
  group: string;
  action: () => void;
}

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent);

export const MOD_LABEL = isMac ? "⌘" : "Ctrl";
export const SHIFT_LABEL = "⇧";

export function useKeyboardShortcuts(onOpenShortcutsDialog?: () => void) {
  const navigate = useNavigate();

  const shortcuts: Shortcut[] = [
    // Navigation
    { key: "d", mod: true, shift: true, label: "Dashboard", group: "Navigation", action: () => navigate("/app") },
    { key: "u", mod: true, shift: true, label: "Upload", group: "Navigation", action: () => navigate("/app/upload") },
    { key: "o", mod: true, shift: true, label: "Documents", group: "Navigation", action: () => navigate("/app/documents") },
    { key: "e", mod: true, shift: true, label: "Expenses", group: "Navigation", action: () => navigate("/app/expenses") },
    { key: "i", mod: true, shift: true, label: "Income", group: "Navigation", action: () => navigate("/app/income") },
    { key: "x", mod: true, shift: true, label: "Exports", group: "Navigation", action: () => navigate("/app/exports") },

    // Actions
    { key: "k", mod: true, label: "Search", group: "Actions", action: () => { /* TODO: open command palette */ } },
    { key: ",", mod: true, label: "Settings", group: "Actions", action: () => navigate("/app/settings") },

    // Help
    { key: "/", mod: true, label: "Keyboard Shortcuts", group: "Help", action: () => onOpenShortcutsDialog?.() },
  ];

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Don't fire when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) return;

      const mod = isMac ? e.metaKey : e.ctrlKey;

      for (const s of shortcuts) {
        const keyMatch = e.key.toLowerCase() === s.key.toLowerCase();
        const modMatch = s.mod ? mod : !mod;
        const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;

        if (keyMatch && modMatch && shiftMatch) {
          e.preventDefault();
          s.action();
          return;
        }
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return shortcuts;
}

/** Format shortcut for display */
export function formatShortcut(s: Pick<Shortcut, "key" | "mod" | "shift">): string {
  const parts: string[] = [];
  if (s.mod) parts.push(MOD_LABEL);
  if (s.shift) parts.push(SHIFT_LABEL);
  parts.push(s.key.toUpperCase());
  return parts.join(isMac ? "" : "+");
}
