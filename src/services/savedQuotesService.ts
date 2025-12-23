import { supabase } from "../lib/supabase";

export interface SavedQuote {
    id: string;
    user_id?: string;
    email?: string;
    quote_details: any;
    created_at: string;
    status: "new" | "contacted" | "converted";
}

export const savedQuotesService = {
    saveQuote: async (
        quoteDetails: any,
        email?: string,
        userId?: string
    ): Promise<SavedQuote> => {
        const { data, error } = await supabase
            .from("saved_quotes")
            .insert({
                quote_details: quoteDetails,
                email: email,
                user_id: userId,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    getSavedQuotes: async (): Promise<SavedQuote[]> => {
        const { data, error } = await supabase
            .from("saved_quotes")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
    },
    deleteQuote: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from("saved_quotes")
            .delete()
            .eq("id", id);

        if (error) throw error;
    },
};
