import { supabase } from "../lib/supabase";

export interface PointTransaction {
    id: string;
    amount: number;
    reason: 'shipment_reward' | 'referral_bonus' | 'wallet_conversion' | 'transfer_sent' | 'transfer_received' | 'other';
    metadata: any;
    created_at: string;
    related_id?: string;
}

export const loyaltyService = {
    /**
     * Fetch point history for the current user
     */
    async getHistory(): Promise<PointTransaction[]> {
        const { data, error } = await supabase
            .from('point_history')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    /**
     * Transfer points to another user via email
     */
    async transferPoints(recipientEmail: string, amount: number) {
        const { data, error } = await supabase.rpc('transfer_points', {
            recipient_email: recipientEmail,
            amount: amount
        });

        if (error) throw error;
        return data;
    },

    /**
     * Convert points to wallet credit
     */
    async convertPoints(amount: number) {
        const { data, error } = await supabase.rpc('convert_points_to_wallet_v2', {
            p_amount: amount
        });

        if (error) throw error;
        return data;
    }
};
