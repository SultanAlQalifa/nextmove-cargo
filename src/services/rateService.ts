import { supabase } from "../lib/supabase";
import { supabaseWrapper } from "../lib/supabaseWrapper";

export interface Rate {
  id?: string;
  forwarder_id?: string;
  mode: "sea" | "air";
  type: "standard" | "express";
  min_weight?: number;
  max_weight?: number;
  min_volume?: number;
  max_volume?: number;
  currency: string;
  price_per_unit: number; // For rate_per_kg or rate_per_m3
  transit_time_min: number;
  transit_time_max: number;
  is_active: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export const rateService = {
  async getRates(forwarderId: string) {
    const data = await supabaseWrapper.query(async () => {
      const query = supabase.from("forwarder_rates").select("*");
      if (forwarderId) query.eq("forwarder_id", forwarderId);
      return await query.order("created_at", { ascending: false });
    });

    return (data || []).map((r: any) => ({
      ...r,
      price_per_unit: r.price || 0,
      transit_time_min: r.min_days || 0,
      transit_time_max: r.max_days || 0,
    })) as Rate[];
  },

  async createRate(rate: Omit<Rate, "id">) {
    const dbRate: any = {
      forwarder_id: rate.forwarder_id,
      mode: rate.mode,
      type: rate.type,
      min_weight: rate.min_weight,
      max_weight: rate.max_weight,
      min_volume: rate.min_volume,
      max_volume: rate.max_volume,
      currency: rate.currency,
      price: rate.price_per_unit,
      min_days: rate.transit_time_min,
      max_days: rate.transit_time_max,
      is_active: rate.is_active,
      notes: rate.notes,
    };

    const data = await supabaseWrapper.query(async () => {
      return await supabase
        .from("forwarder_rates")
        .insert(dbRate)
        .select()
        .single();
    });

    if (!data) throw new Error("Failed to create rate");

    const rateData = data as any;
    return {
      ...rateData,
      price_per_unit: rateData?.price || 0,
      transit_time_min: rateData?.min_days || 0,
      transit_time_max: rateData?.max_days || 0,
    } as Rate;
  },

  async updateRate(id: string, updates: Partial<Rate>) {
    const dbUpdates: any = { ...updates };

    // Remap fields if they exist in updates
    if (updates.price_per_unit !== undefined) {
      dbUpdates.price = updates.price_per_unit;
      delete dbUpdates.price_per_unit;
    }
    if (updates.transit_time_min !== undefined) {
      dbUpdates.min_days = updates.transit_time_min;
      delete dbUpdates.transit_time_min;
    }
    if (updates.transit_time_max !== undefined) {
      dbUpdates.max_days = updates.transit_time_max;
      delete dbUpdates.transit_time_max;
    }

    const data = await supabaseWrapper.query(async () => {
      return await supabase
        .from("forwarder_rates")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();
    });

    if (!data) throw new Error("Failed to update rate");

    const rateData = data as any;
    return {
      ...rateData,
      price_per_unit: rateData?.price || 0,
      transit_time_min: rateData?.min_days || 0,
      transit_time_max: rateData?.max_days || 0,
    } as Rate;
  },

  async deleteRate(id: string) {
    await supabaseWrapper.query(async () => {
      return await supabase.from("forwarder_rates").delete().eq("id", id);
    });
  },

  async getGlobalRates(mode?: "sea" | "air") {
    const { data, error } = await supabase
      .from("forwarder_rates")
      .select(`
        *,
        forwarder:profiles(full_name, avatar_url)
      `)
      .eq("is_active", true)
      .filter("mode", mode ? "eq" : "neq", mode || "none"); // simplified filter

    if (error) throw error;

    return (data || []).map((r: any) => ({
      ...r,
      price_per_unit: r.price || 0,
      transit_time_min: r.min_days || 0,
      transit_time_max: r.max_days || 0,
    }));
  },

  async getRateForShipment(params: {
    origin: string;
    destination: string;
    mode: "sea" | "air";
    weight?: number;
    volume?: number;
  }) {
    // This logic is usually quite complex in a real app (checking specific ports, lanes, etc.)
    // For NextMove MVP, we'll fetch rates for the mode and filter broadly or return all relevant.

    const { data, error } = await supabase
      .from("forwarder_rates")
      .select(`
        *,
        forwarder:profiles(full_name, avatar_url)
      `)
      .eq("mode", params.mode)
      .eq("is_active", true);

    if (error) throw error;

    // Filter by weight/volume if provided (broad match)
    let filtered = data || [];
    if (params.weight) {
      filtered = filtered.filter(
        (r) =>
          (!r.min_weight || params.weight! >= r.min_weight) &&
          (!r.max_weight || params.weight! <= r.max_weight)
      );
    }
    if (params.volume) {
      filtered = filtered.filter(
        (r) =>
          (!r.min_volume || params.volume! >= r.min_volume) &&
          (!r.max_volume || params.volume! <= r.max_volume)
      );
    }

    return filtered.map((r: any) => ({
      ...r,
      price_per_unit: r.price || 0,
      transit_time_min: r.min_days || 0,
      transit_time_max: r.max_days || 0,
    }));
  },
};
