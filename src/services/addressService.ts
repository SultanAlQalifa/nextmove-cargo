import { supabase } from "../lib/supabase";
import { fetchWithRetry } from "../utils/supabaseHelpers";

export interface ForwarderAddress {
    id: string;
    forwarder_id: string;
    type: "collection" | "reception" | "office";
    name: string;
    country: string;
    city: string;
    address_line1: string;
    address_line2?: string;
    postal_code?: string;
    contact_name?: string;
    contact_phone?: string;
    instructions?: string;
    is_default: boolean;
    created_at: string;
}

export const addressService = {
    getAddresses: async (forwarderId: string): Promise<ForwarderAddress[]> => {
        try {
            const data = await fetchWithRetry<ForwarderAddress[]>(() =>
                supabase
                    .from("forwarder_addresses")
                    .select("*")
                    .eq("forwarder_id", forwarderId)
                    .order("created_at", { ascending: false })
            );
            return data || [];
        } catch (error) {
            console.error("Error fetching addresses:", error);
            return [];
        }
    },

    createAddress: async (address: Partial<ForwarderAddress>): Promise<ForwarderAddress> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        try {
            const { data, error } = await supabase
                .from("forwarder_addresses")
                .insert({
                    ...address,
                    forwarder_id: user.id
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Error creating address:", error);
            throw error;
        }
    },

    updateAddress: async (id: string, updates: Partial<ForwarderAddress>): Promise<void> => {
        try {
            const { error } = await supabase
                .from("forwarder_addresses")
                .update(updates)
                .eq("id", id);

            if (error) throw error;
        } catch (error) {
            console.error("Error updating address:", error);
            throw error;
        }
    },

    deleteAddress: async (id: string): Promise<void> => {
        try {
            const { error } = await supabase
                .from("forwarder_addresses")
                .delete()
                .eq("id", id);

            if (error) throw error;
        } catch (error) {
            console.error("Error deleting address:", error);
            throw error;
        }
    }
};
