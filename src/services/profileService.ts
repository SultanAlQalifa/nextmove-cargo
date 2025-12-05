import { supabase } from '../lib/supabase';
import { fetchWithRetry } from '../utils/supabaseHelpers';

export interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    company_name?: string;
    phone?: string;
    address?: string;
    country?: string;
    avatar_url?: string;
    role?: string;
    friendly_id?: string;
    account_status?: 'active' | 'inactive' | 'suspended';
    subscription_status?: 'active' | 'inactive' | 'past_due' | 'canceled';
    kyc_status?: 'pending' | 'verified' | 'rejected';
}

export const profileService = {
    getProfile: async (userId: string, skipCache = false): Promise<UserProfile | null> => {
        // 1. Try to get from localStorage first
        const cachedProfile = localStorage.getItem(`user_profile_${userId}`);
        if (!skipCache && cachedProfile) {
            const data = JSON.parse(cachedProfile);
            // Skip invalid cache
            if (!(data.email === 'admin@example.com' && data.full_name === 'Admin User')) {
                return data;
            }
        }

        try {
            // 2. Fetch from Supabase with retry logic
            const data = await fetchWithRetry<UserProfile>(() =>
                supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle()
            );

            if (!data) {
                // If not found after retries (and maybeSingle returned null), try fallback
                throw new Error('Profile not found');
            }

            // Cache the result
            localStorage.setItem(`user_profile_${userId}`, JSON.stringify(data));
            return data;

        } catch (error) {
            console.warn('Error fetching profile, attempting fallback to metadata:', error);

            // True Fallback: Get Auth Metadata
            const { data: { user } } = await supabase.auth.getUser();

            if (user && user.id === userId) {
                // Return what we know from Auth, don't invent data
                const fallbackProfile: UserProfile = {
                    id: userId,
                    email: user.email || '',
                    full_name: user.user_metadata?.full_name || 'User',
                    role: user.user_metadata?.role || 'client',
                    avatar_url: user.user_metadata?.avatar_url
                };
                // Cache this temporary fallback
                localStorage.setItem(`user_profile_${userId}`, JSON.stringify(fallbackProfile));
                return fallbackProfile;
            }
            return null;
        }
    },

    updateProfile: async (userId: string, updates: Partial<UserProfile>): Promise<void> => {
        // 1. Update localStorage
        const cachedProfileStr = localStorage.getItem(`user_profile_${userId}`);
        if (cachedProfileStr) {
            const cachedProfile = JSON.parse(cachedProfileStr);
            const updatedProfile = { ...cachedProfile, ...updates };
            localStorage.setItem(`user_profile_${userId}`, JSON.stringify(updatedProfile));
        } else {
            localStorage.setItem(`user_profile_${userId}`, JSON.stringify({ id: userId, ...updates }));
        }

        try {
            await fetchWithRetry(() =>
                supabase
                    .from('profiles')
                    .update(updates)
                    .eq('id', userId)
            );
        } catch (error) {
            console.error('Error updating profile:', error);
            // Re-throw to let caller handle generic errors, but we keep the optimistic update strategy
            // or we could swallow if we want "optimistic only" behavior, but better to alert
            throw error;
        }
    },

    updatePassword: async (password: string): Promise<void> => {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
    },

    uploadAvatar: async (userId: string, file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                resolve(result);
            };
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    },

    getForwarderClients: async (): Promise<UserProfile[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        try {
            const data = await fetchWithRetry<any[]>(() =>
                supabase
                    .from('shipments')
                    .select(`
                        user:profiles!client_id(*)
                    `)
                    .eq('forwarder_id', user.id)
            );

            if (!data) return [];

            // Extract unique profiles from the shipments
            const clientsMap = new Map<string, UserProfile>();
            data.forEach((item: any) => {
                if (item.user) {
                    clientsMap.set(item.user.id, item.user);
                }
            });

            return Array.from(clientsMap.values());
        } catch (error) {
            console.error('Error fetching forwarder clients:', error);
            return [];
        }
    },

    upgradeToForwarder: async (userId: string): Promise<void> => {
        try {
            await fetchWithRetry(() =>
                supabase
                    .from('profiles')
                    .update({
                        role: 'forwarder',
                        subscription_status: 'inactive', // Force subscription
                        kyc_status: 'pending' // Force KYC
                    })
                    .eq('id', userId)
            );

            // Also update local storage to reflect the change immediately
            const cachedProfileStr = localStorage.getItem(`user_profile_${userId}`);
            if (cachedProfileStr) {
                const cachedProfile = JSON.parse(cachedProfileStr);
                cachedProfile.role = 'forwarder';
                localStorage.setItem(`user_profile_${userId}`, JSON.stringify(cachedProfile));
            }
        } catch (error) {
            console.error('Error upgrading to forwarder:', error);
            throw error;
        }
    },

    getAllProfiles: async (): Promise<UserProfile[]> => {
        try {
            const data = await fetchWithRetry<UserProfile[]>(() =>
                supabase
                    .from('profiles')
                    .select('*')
                    .order('created_at', { ascending: false })
            );

            if (!data) return [];

            // Map DB columns to interface
            return data.map(profile => ({
                ...profile,
                kyc_status: profile.kyc_status || 'pending'
            }));
        } catch (error) {
            console.error('Error fetching all profiles:', error);
            return [];
        }
    },

    updateStatus: async (userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> => {
        try {
            await fetchWithRetry(() =>
                supabase
                    .from('profiles')
                    .update({ account_status: status })
                    .eq('id', userId)
            );
        } catch (error) {
            console.error('Error updating status:', error);
            throw error;
        }
    }
};
