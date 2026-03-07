import { useState, useEffect, useCallback } from "react";

export interface LayoutSettings {
  compactView: boolean;
  showSidebarLabels: boolean;
}

const STORAGE_KEY = "layout-settings";

const defaults: LayoutSettings = {
  compactView: false,
  showSidebarLabels: true,
};

function load(): LayoutSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch {}
  return defaults;
}

// Simple pub/sub so multiple hooks stay in sync
const listeners = new Set<() => void>();
function notify() { listeners.forEach((fn) => fn()); }

export function useLayoutSettings() {
  const [settings, setSettings] = useState<LayoutSettings>(load);

  useEffect(() => {
    const handler = () => setSettings(load());
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const update = useCallback((patch: Partial<LayoutSettings>) => {
    const next = { ...load(), ...patch };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSettings(next);
    notify();
  }, []);

  return { settings, update };
}
