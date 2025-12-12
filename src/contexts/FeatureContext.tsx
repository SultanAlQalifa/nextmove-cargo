import React, { createContext, useContext, useState, useEffect } from "react";
import { featureService, PlatformFeature } from "../services/featureService";

interface FeatureContextType {
    features: PlatformFeature[];
    loading: boolean;
    getFeature: (key: string) => PlatformFeature | undefined;
    isEnabled: (key: string) => boolean;
    refreshFeatures: () => Promise<void>;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export function FeatureProvider({ children }: { children: React.ReactNode }) {
    const [features, setFeatures] = useState<PlatformFeature[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFeatures = async () => {
        try {
            const data = await featureService.getAllFeatures();
            setFeatures(data);
        } catch (error) {
            console.error("Failed to load features", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFeatures();
    }, []);

    const getFeature = (key: string) => features.find((f) => f.id === key);

    const isEnabled = (key: string) => {
        const feature = getFeature(key);
        if (!feature) return false;
        // For boolean features, check the default value
        // In a real app, you might also check user-specific overrides here
        return feature.type === "boolean" && feature.defaultValue === true;
    };

    return (
        <FeatureContext.Provider
            value={{
                features,
                loading,
                getFeature,
                isEnabled,
                refreshFeatures: loadFeatures,
            }}
        >
            {children}
        </FeatureContext.Provider>
    );
}

export const useFeatures = () => {
    const context = useContext(FeatureContext);
    if (context === undefined) {
        throw new Error("useFeatures must be used within a FeatureProvider");
    }
    return context;
};
