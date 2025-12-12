import { supabase } from "../lib/supabase";
import {
  Consolidation,
  CreateConsolidationData,
  ConsolidationFilters,
} from "../types/consolidation";

export const consolidationService = {
  async getConsolidations(filters: ConsolidationFilters = {}) {
    let query = supabase
      .from("consolidations")
      .select(
        `
                *,
                initiator:profiles(company_name, email)
            `,
      )
      .order("created_at", { ascending: false });

    if (filters.type) {
      query = query.eq("type", filters.type);
    }
    if (filters.origin_port) {
      query = query.eq("origin_port", filters.origin_port);
    }
    if (filters.destination_port) {
      query = query.eq("destination_port", filters.destination_port);
    }
    if (filters.transport_mode) {
      query = query.eq("transport_mode", filters.transport_mode);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    } else {
      // Default to showing open consolidations if no status specified
      query = query.in("status", ["open", "closing_soon", "full"]);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Consolidation[];
  },

  async getMyConsolidations(userId: string) {
    const { data, error } = await supabase
      .from("consolidations")
      .select("*")
      .eq("initiator_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Consolidation[];
  },

  async createConsolidation(data: CreateConsolidationData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Ensure profile exists to avoid foreign key constraint error
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      // Create missing profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || "client",
        full_name: user.user_metadata?.full_name || "User",
      });

      if (profileError) {
        console.error("Error creating missing profile:", profileError);
      }
    }

    const { data: newConsolidation, error } = await supabase
      .from("consolidations")
      .insert([{ ...data, initiator_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return newConsolidation as Consolidation;
  },

  async updateConsolidation(id: string, updates: Partial<Consolidation>) {
    const { data, error } = await supabase
      .from("consolidations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Consolidation;
  },

  async deleteConsolidation(id: string) {
    const { error } = await supabase
      .from("consolidations")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async bulkCreateConsolidations(data: CreateConsolidationData[]) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const consolidations = data.map((item) => ({
      ...item,
      initiator_id: user.id,
    }));

    const { error } = await supabase
      .from("consolidations")
      .insert(consolidations);

    if (error) throw error;
  },
};
