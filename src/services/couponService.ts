import { supabase } from '../lib/supabase';

export interface Coupon {
    id: string;
    code: string;
    description: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    usage_count: number;
    usage_limit: number | null;
    min_order_amount: number | null;
    max_discount_amount: number | null;
    is_active: boolean;
    end_date: string | null;
    created_by?: string; // Forwarder ID or Admin ID
    scope: 'platform' | 'forwarder';
}

export const couponService = {
    getAllCoupons: async (): Promise<Coupon[]> => {
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    getForwarderCoupons: async (): Promise<Coupon[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('created_by', user.id)
            .eq('scope', 'forwarder')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    createCoupon: async (coupon: Partial<Coupon>): Promise<Coupon> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('coupons')
            .insert([{ ...coupon, created_by: user.id }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    updateCoupon: async (id: string, updates: Partial<Coupon>): Promise<void> => {
        const { error } = await supabase
            .from('coupons')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
    },

    deleteCoupon: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    validateCoupon: async (code: string, context: { type: 'subscription' | 'service', forwarderId?: string }): Promise<Coupon> => {
        // 1. Fetch coupon
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();

        if (error || !coupon) {
            throw new Error('Code promo invalide');
        }

        // 2. Check general validity
        if (!coupon.is_active) throw new Error('Ce code promo n\'est plus actif');
        if (coupon.end_date && new Date(coupon.end_date) < new Date()) throw new Error('Ce code promo a expiré');
        if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) throw new Error('Ce code promo a atteint sa limite d\'utilisation');

        // 3. Check SCOPE validity
        if (context.type === 'subscription') {
            // Subscription -> Must be Platform coupon
            if (coupon.scope !== 'platform') {
                throw new Error('Ce code ne peut pas être utilisé pour un abonnement');
            }
        } else if (context.type === 'service') {
            // Service -> Must be Forwarder coupon AND belong to the specific forwarder
            if (coupon.scope !== 'forwarder') {
                throw new Error('Ce code n\'est pas valide pour ce service');
            }
            if (!context.forwarderId) {
                throw new Error('Contexte transitaire manquant');
            }
            if (coupon.created_by !== context.forwarderId) {
                throw new Error('Ce code n\'est pas valide pour ce transitaire');
            }
        }

        return coupon;
    }
};
