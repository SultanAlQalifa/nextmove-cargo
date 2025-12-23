import { supabase } from "../lib/supabase";

export interface Testimonial {
    id: string;
    name: string;
    role: string | null;
    content: string;
    rating: number;
    avatar_url: string | null;
    is_active: boolean;
    display_order: number;
    created_at: string;
}

export const testimonialService = {
    async getAll() {
        const { data, error } = await supabase
            .from("testimonials")
            .select("*")
            .order("display_order", { ascending: true })
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data as Testimonial[];
    },

    async getActive() {
        const { data, error } = await supabase
            .from("testimonials")
            .select("*")
            .eq("is_active", true)
            .order("display_order", { ascending: true });

        if (error) throw error;
        return data as Testimonial[];
    },

    async create(testimonial: Omit<Testimonial, "id" | "created_at">) {
        const { data, error } = await supabase
            .from("testimonials")
            .insert([testimonial])
            .select()
            .single();

        if (error) throw error;
        return data as Testimonial;
    },

    async update(id: string, testimonial: Partial<Testimonial>) {
        const { data, error } = await supabase
            .from("testimonials")
            .update(testimonial)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data as Testimonial;
    },

    async delete(id: string) {
        const { error } = await supabase.from("testimonials").delete().eq("id", id);
        if (error) throw error;
        return true;
    },
};
