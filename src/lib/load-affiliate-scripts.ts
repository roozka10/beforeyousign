declare global {
  interface Window {
    vglnk?: { key: string };
  }
}

export function loadAffiliateScripts() {
  const sovrnKey = import.meta.env.VITE_SOVRN_PUBLISHER_KEY;

  if (typeof sovrnKey === "string" && sovrnKey.trim()) {
    window.vglnk = { key: sovrnKey.trim() };

    if (!document.querySelector('script[data-sovrn-commerce="true"]')) {
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.async = true;
      script.dataset.sovrnCommerce = "true";
      script.src =
        document.location.protocol === "https:"
          ? "https://cdn.viglink.com/api/vglnk.js"
          : "http://cdn.viglink.com/api/vglnk.js";
      document.head.appendChild(script);
    }
  }
}
