import { createContext, useContext, useEffect, useState } from "react";
import { brandingService, BrandingSettings } from "../services/brandingService";

interface BrandingContextType {
  settings: BrandingSettings | null;
  loading: boolean;
  refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(
  undefined,
);

import { showNotification } from "../components/common/NotificationToast";

export const DEFAULT_BRANDING: BrandingSettings = {
  id: "default",
  primary_color: "#dc2626", // Crisis Red
  secondary_color: "#1f2937", // Gray 900
  accent_color: "#ef4444", // Red 500
  platform_name: "NextMove Cargo",
  logo_url: "", // Use component fallback or empty
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  pwa: {
    name: "NextMove Cargo",
    short_name: "NextMove",
    theme_color: "#dc2626",
    background_color: "#ffffff",
    start_url: "/",
    display: "standalone",
    orientation: "portrait"
  }
};

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBranding = async (retryCount = 0) => {
    try {
      const data = await brandingService.getBranding();
      setSettings(data);
      applyBranding(data);
      setLoading(false); // Success! Stop loading.
    } catch (error) {
      console.error(`Branding load failed (Attempt ${retryCount + 1}/3):`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });

      if (retryCount < 2) {
        // Retry with exponential backoff
        setTimeout(() => fetchBranding(retryCount + 1), 1000 * Math.pow(2, retryCount));
      } else {
        // Final Failure
        setSettings(DEFAULT_BRANDING);
        applyBranding(DEFAULT_BRANDING);
        setLoading(false); // Failure! Stop loading.

        showNotification(
          "Personnalisation non disponible",
          "Utilisation du thème par défaut. Vérifiez votre connexion.",
          "warning"
        );
      }
    }
  };

  const applyBranding = (data: BrandingSettings) => {
    // Apply colors as CSS variables
    const root = document.documentElement;
    root.style.setProperty("--color-primary", data.primary_color);
    root.style.setProperty("--color-secondary", data.secondary_color);
    root.style.setProperty("--color-accent", data.accent_color);

    // Update favicon
    const favicon = document.querySelector(
      "link[rel*='icon']",
    ) as HTMLLinkElement;
    if (favicon && data.favicon_url) {
      favicon.href = data.favicon_url;
    }

    // Update title
    if (data.platform_name) {
      document.title = data.platform_name;
    }

    // Update PWA Theme Color
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta && data.pwa?.theme_color) {
      themeColorMeta.setAttribute("content", data.pwa.theme_color);
    }

    // Update Manifest
    if (data.pwa) {
      const manifestLink = document.querySelector(
        'link[rel="manifest"]',
      ) as HTMLLinkElement;
      if (manifestLink) {
        // Fetch existing manifest to keep icons and other static props
        fetch(manifestLink.href)
          .then((res) => res.json())
          .catch((err) => {
            console.warn("Failed to fetch existing manifest, using minimal fallback:", err);
            return {};
          })
          .then((baseManifest) => {
            const newManifest = {
              ...baseManifest,
              name: data.pwa.name || data.platform_name,
              short_name: data.pwa.short_name || data.platform_name,
              theme_color: data.pwa.theme_color,
              background_color: data.pwa.background_color,
            };

            const stringManifest = JSON.stringify(newManifest);
            const blob = new Blob([stringManifest], {
              type: "application/json",
            });
            const manifestURL = URL.createObjectURL(blob);

            // Revoke old URL if it was a blob
            if (manifestLink.href.startsWith("blob:")) {
              URL.revokeObjectURL(manifestLink.href);
            }

            manifestLink.href = manifestURL;
          });
      }
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  return (
    <BrandingContext.Provider
      value={{ settings, loading, refreshBranding: fetchBranding }}
    >
      {children}
    </BrandingContext.Provider>
  );
}

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (context === undefined) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return context;
};
