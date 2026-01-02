import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface FeatureFlag {
    key: string;
    is_enabled: boolean;
}

interface FeatureFlagContextType {
    flags: Record<string, boolean>;
    loading: boolean;
    updateFlag: (key: string, value: boolean) => Promise<void>;
}

const FeatureFlagContext = createContext<FeatureFlagContextType | undefined>(undefined);

export const FeatureFlagProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [flags, setFlags] = useState<Record<string, boolean>>({});
    const [loading, setLoading] = useState(true);

    const fetchFlags = async () => {
        try {
            const { data, error } = await supabase
                .from('feature_flags')
                .select('key, is_enabled');

            if (error) throw error;

            const flagMap = (data || []).reduce((acc, flag) => {
                acc[flag.key] = flag.is_enabled;
                return acc;
            }, {} as Record<string, boolean>);

            setFlags(flagMap);
        } catch (error) {
            console.error('Error fetching feature flags:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFlags();

        // Subscribe to real-time updates
        const subscription = supabase
            .channel('feature_flags_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'feature_flags' }, () => {
                fetchFlags();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const updateFlag = async (key: string, value: boolean) => {
        try {
            const { error } = await supabase
                .from('feature_flags')
                .update({ is_enabled: value })
                .eq('key', key);

            if (error) throw error;
            // Real-time subscription will update the local state
        } catch (error) {
            console.error('Error updating feature flag:', error);
            throw error;
        }
    };

    return (
        <FeatureFlagContext.Provider value={{ flags, loading, updateFlag }}>
            {children}
        </FeatureFlagContext.Provider>
    );
};

export const useFeatureFlags = () => {
    const context = useContext(FeatureFlagContext);
    if (context === undefined) {
        throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
    }
    return context;
};

export const useFeature = (key: string) => {
    const { flags } = useFeatureFlags();
    return !!flags[key];
};
