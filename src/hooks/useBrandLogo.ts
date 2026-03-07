import { useState, useEffect } from "react";

export function useBrandLogo() {
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const isDark = document.documentElement.classList.contains("dark");
      const l = localStorage.getItem(isDark ? "brand-logo-dark" : "brand-logo-light")
        || localStorage.getItem("brand-logo-light");
      setLogo(l);
    };
    update();

    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("storage", update);
    window.addEventListener("brand-logo-changed", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("storage", update);
      window.removeEventListener("brand-logo-changed", update);
    };
  }, []);

  return logo;
}
