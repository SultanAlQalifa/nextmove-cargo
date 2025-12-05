import { supabase } from '../lib/supabase';
import { fetchWithRetry } from '../utils/supabaseHelpers';

export interface PlatformRate {
    id: string;
    mode: 'sea' | 'air' | 'road';
    type: 'standard' | 'express';
    price: number;
    currency: string;
    min_days: number;
    max_days: number;
    insurance_rate: number;
    unit: 'kg' | 'cbm';
    updated_at: string;
}

export const platformRateService = {
    getAllRates: async (): Promise<PlatformRate[]> => {
        return fetchWithRetry<PlatformRate[]>(() =>
            supabase
                .from('platform_rates')
                .select('*')
                .order('mode')
                .order('type')
        );
    },

    updateRate: async (id: string, updates: Partial<PlatformRate>): Promise<PlatformRate> => {
        try {
            const { data, error } = await supabase
                .from('platform_rates')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error updating platform rate:', error);
            throw error;
        }
    }
};
