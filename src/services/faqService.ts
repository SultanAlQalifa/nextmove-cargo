import { supabase } from "../lib/supabase";

export interface FAQ {
    id: string;
    category: string;
    question: string;
    answer: string;
    is_active: boolean;
    display_order: number;
    created_at: string;
}

export const faqService = {
    async getAll() {
        const { data, error } = await supabase
            .from("faqs")
            .select("*")
            .order("category", { ascending: true })
            .order("display_order", { ascending: true });

        if (error) throw error;
        return data as FAQ[];
    },

    async getActive() {
        const { data, error } = await supabase
            .from("faqs")
            .select("*")
            .eq("is_active", true)
            .order("category", { ascending: true })
            .order("display_order", { ascending: true });

        if (error) throw error;
        return data as FAQ[];
    },

    async create(faq: Omit<FAQ, "id" | "created_at">) {
        const { data, error } = await supabase
            .from("faqs")
            .insert([faq])
            .select()
            .single();

        if (error) throw error;
        return data as FAQ;
    },

    async update(id: string, faq: Partial<FAQ>) {
        const { data, error } = await supabase
            .from("faqs")
            .update(faq)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as FAQ;
    },

    async delete(id: string) {
        const { error } = await supabase.from("faqs").delete().eq("id", id);
        if (error) throw error;
        return true;
    },
};
