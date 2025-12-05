import { supabase } from '../lib/supabase';

export interface Rate {
    id?: string;
    forwarder_id?: string;
    mode: 'sea' | 'air';
    type: 'standard' | 'express';
    min_weight?: number;
    max_weight?: number;
    price_per_unit: number;
    currency: string;
    transit_time_min: number;
    transit_time_max: number;
}

export const rateService = {
    async getRates(forwarderId: string) {
        const { data, error } = await supabase
            .from('rates')
            .select('*')
            .eq('forwarder_id', forwarderId);

        if (error) throw error;
        return data as Rate[];
    },

    async createRate(rate: Rate) {
        const { data, error } = await supabase
            .from('rates')
            .insert([rate])
            .select()
            .single();

        if (error) throw error;
        return data as Rate;
    },

    async updateRate(id: string, updates: Partial<Rate>) {
        const { data, error } = await supabase
            .from('rates')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Rate;
    },

    async deleteRate(id: string) {
        const { error } = await supabase
            .from('rates')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
