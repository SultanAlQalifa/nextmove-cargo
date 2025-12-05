import { createContext, useContext, useEffect, useState } from 'react';
import { brandingService, BrandingSettings } from '../services/brandingService';

interface BrandingContextType {
    settings: BrandingSettings | null;
    loading: boolean;
    refreshBranding: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined);

export function BrandingProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<BrandingSettings | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchBranding = async () => {
        try {
            const data = await brandingService.getBranding();
            setSettings(data);
            applyBranding(data);
        } catch (error) {
            console.error('Error fetching branding:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyBranding = (data: BrandingSettings) => {
        // Apply colors as CSS variables
        const root = document.documentElement;
        root.style.setProperty('--color-primary', data.primary_color);
        root.style.setProperty('--color-secondary', data.secondary_color);
        root.style.setProperty('--color-accent', data.accent_color);

        // Update favicon
        const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
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
            themeColorMeta.setAttribute('content', data.pwa.theme_color);
        }

        // Update Manifest
        if (data.pwa) {
            const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
            if (manifestLink) {
                // Fetch existing manifest to keep icons and other static props
                fetch(manifestLink.href)
                    .then(res => res.json())
                    .catch(() => ({})) // Fallback if fetch fails
                    .then(baseManifest => {
                        const newManifest = {
                            ...baseManifest,
                            name: data.pwa.name || data.platform_name,
                            short_name: data.pwa.short_name || data.platform_name,
                            theme_color: data.pwa.theme_color,
                            background_color: data.pwa.background_color,
                        };

                        const stringManifest = JSON.stringify(newManifest);
                        const blob = new Blob([stringManifest], { type: 'application/json' });
                        const manifestURL = URL.createObjectURL(blob);

                        // Revoke old URL if it was a blob
                        if (manifestLink.href.startsWith('blob:')) {
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
        <BrandingContext.Provider value={{ settings, loading, refreshBranding: fetchBranding }}>
            {children}
        </BrandingContext.Provider>
    );
}

export const useBranding = () => {
    const context = useContext(BrandingContext);
    if (context === undefined) {
        throw new Error('useBranding must be used within a BrandingProvider');
    }
    return context;
};
