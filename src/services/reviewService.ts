import { supabase } from "../lib/supabase";

export interface Review {
    id: string;
    shipment_id: string;
    client_id: string;
    forwarder_id: string;
    rating: number;
    comment: string;
    created_at: string;
    client_profile?: {
        full_name: string;
        avatar_url: string;
    };
}

export const reviewService = {
    async getForwarderReviews(forwarderId: string): Promise<Review[]> {
        const { data, error } = await supabase
            .from("forwarder_reviews")
            .select(`
        *,
        client_profile: profiles!client_id(full_name, avatar_url)
      `)
            .eq("forwarder_id", forwarderId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async submitReview(review: {
        shipment_id: string;
        client_id: string;
        forwarder_id: string;
        rating: number;
        comment: string;
    }) {
        const { data, error } = await supabase
            .from("forwarder_reviews")
            .insert(review)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async getReviewForShipment(shipmentId: string): Promise<Review | null> {
        const { data, error } = await supabase
            .from("forwarder_reviews")
            .select("*")
            .eq("shipment_id", shipmentId)
            .maybeSingle();

        if (error) throw error;
        return data;
    }
};
