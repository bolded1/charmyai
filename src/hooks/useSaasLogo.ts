import { useState, useEffect } from "react";

export function useSaasLogo() {
  const [logo, setLogo] = useState<string | null>(null);

  useEffect(() => {
    const updateLogo = () => {
      const isDark = document.documentElement.classList.contains("dark");
      const l = localStorage.getItem(isDark ? "saas-logo-dark" : "saas-logo-light")
        || localStorage.getItem("saas-logo-light");
      setLogo(l);
    };

    updateLogo();

    const observer = new MutationObserver(updateLogo);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    window.addEventListener("saas-logo-changed", updateLogo);
    window.addEventListener("storage", updateLogo);

    return () => {
      observer.disconnect();
      window.removeEventListener("saas-logo-changed", updateLogo);
      window.removeEventListener("storage", updateLogo);
    };
  }, []);

  return logo;
}
