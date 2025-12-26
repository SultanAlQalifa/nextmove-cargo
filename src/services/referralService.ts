import { supabase } from "../lib/supabase";

export interface ReferralStats {
    total: number;
    pending: number;
    completed: number;
    totalPoints: number;
}

export interface Referral {
    id: string;
    referred_id: string;
    status: string;
    created_at: string;
    points_earned: number;
    referred_profile?: {
        full_name: string;
        created_at: string;
    };
}

export const referralService = {
    async getStats(userId: string): Promise<ReferralStats> {
        const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("referral_points")
            .eq("id", userId)
            .single();

        if (profileError) throw profileError;

        const { data: referrals, error: referralsError } = await supabase
            .from("referrals")
            .select("status")
            .eq("referrer_id", userId);

        if (referralsError) throw referralsError;

        const refs = referrals || [];
        return {
            total: refs.length,
            pending: refs.filter((r) => r.status === "pending").length,
            completed: refs.filter((r) => r.status === "completed" || r.status === "rewarded").length,
            totalPoints: profileData?.referral_points || 0,
        };
    },

    async getReferrals(userId: string): Promise<Referral[]> {
        const { data, error } = await supabase
            .from("referrals")
            .select(`
        *,
        referred_profile: profiles!referred_id(full_name, created_at)
      `)
            .eq("referrer_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async convertPointsToWallet(userId: string, points: number, conversionRate: number) {
        const { error } = await supabase.rpc("convert_points_to_wallet", {
            p_user_id: userId,
            p_points: points,
            p_conversion_rate: conversionRate,
        });

        if (error) throw error;
        return true;
    },

    async generateReferralCode(userId: string, fullName: string): Promise<string> {
        const normalizedName = (fullName || "USR")
            .replace(/[^a-zA-Z]/g, "")
            .toUpperCase();
        const prefix =
            normalizedName.length >= 3
                ? normalizedName.substring(0, 3)
                : (normalizedName + "USR").substring(0, 3);
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        const newCode = `${prefix}${random}`;

        const { error } = await supabase
            .from("profiles")
            .update({ referral_code: newCode })
            .eq("id", userId);

        if (error) throw error;
        return newCode;
    },

    async getWalletData(userId: string) {
        const { data: walletData } = await supabase
            .from("wallets")
            .select("balance")
            .eq("user_id", userId)
            .maybeSingle();

        const { data: settingsData } = await supabase
            .from("system_settings")
            .select("value")
            .eq("key", "referral")
            .maybeSingle();

        return {
            balance: walletData?.balance || 0,
            conversionRate: settingsData?.value?.point_value || 50
        };
    }
};
