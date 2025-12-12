import { supabase } from "../lib/supabase";
import { supabaseWrapper } from "../lib/supabaseWrapper";

export interface Rate {
  id?: string;
  forwarder_id?: string;
  mode: "sea" | "air";
  type: "standard" | "express";
  min_weight?: number;
  max_weight?: number;
  price_per_unit: number;
  currency: string;
  transit_time_min: number;
  transit_time_max: number;
  origin_id?: string;
  destination_id?: string;
}

export const rateService = {
  async getRates(forwarderId: string) {
    const data = await supabaseWrapper.query(async () => {
      return await supabase
        .from("forwarder_rates")
        .select("*")
        .eq("forwarder_id", forwarderId);
    });

    // Map DB Schema to Frontend Interface
    return (data || []).map((r: any) => ({
      ...r,
      price_per_unit: r.price,
      transit_time_min: r.min_days,
      transit_time_max: r.max_days,
    })) as Rate[];
  },

  async createRate(rate: Rate) {
    // Map Frontend Interface to DB Schema
    const dbPayload = {
      forwarder_id: rate.forwarder_id,
      mode: rate.mode,
      type: rate.type,
      min_weight: rate.min_weight,
      max_weight: rate.max_weight,
      origin_id: rate.origin_id,
      destination_id: rate.destination_id,

      // Mappings
      price: rate.price_per_unit,
      currency: rate.currency,
      min_days: rate.transit_time_min,
      max_days: rate.transit_time_max,
      unit: "kg", // Default or based on mode?
    };

    const data = await supabaseWrapper.query(async () => {
      return await supabase
        .from("forwarder_rates")
        .insert([dbPayload])
        .select()
        .single();
    });

    if (!data) throw new Error("Failed to create rate");

    // Map back to Frontend
    return {
      ...data,
      price_per_unit: data.price,
      transit_time_min: data.min_days,
      transit_time_max: data.max_days,
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

    return {
      ...data,
      price_per_unit: data.price,
      transit_time_min: data.min_days,
      transit_time_max: data.max_days,
    } as Rate;
  },

  async deleteRate(id: string) {
    await supabaseWrapper.query(async () => {
      return await supabase.from("forwarder_rates").delete().eq("id", id);
    });
  },

  async findBestMatch(
    forwarderId: string,
    criteria: {
      mode: string;
      type: string;
      originCountry: string;
      destCountry: string;
      weight: number;
      originId?: string; // Optional direct ID
      destId?: string; // Optional direct ID
    },
  ): Promise<Rate | null> {
    try {
      let originId = criteria.originId;
      let destId = criteria.destId;

      // 1. Resolve Location IDs only if not provided
      if (!originId || !destId) {
        const { data: locations } = await supabase
          .from("locations")
          .select("id, name")
          .in("name", [criteria.originCountry, criteria.destCountry]);

        if (!originId)
          originId = locations?.find(
            (l) => l.name === criteria.originCountry,
          )?.id;
        if (!destId)
          destId = locations?.find((l) => l.name === criteria.destCountry)?.id;
      }

      // 2. Fetch all rates for this forwarder (filtered by mode/type for efficiency)
      const { data: rawRates, error } = await supabase
        .from("forwarder_rates")
        .select("*")
        .eq("forwarder_id", forwarderId)
        .eq("mode", criteria.mode)
        .eq("type", criteria.type);

      if (error || !rawRates) return null;

      // Map forwarder_rates schema (price, min_days, max_days) to Rate interface (price_per_unit, transit_time_min, transit_time_max)
      const rates: Rate[] = rawRates.map((r) => ({
        ...r,
        price_per_unit: r.price,
        transit_time_min: r.min_days,
        transit_time_max: r.max_days,
      }));

      // 4. Strict Route Matching (Prioritize exact match bypassing weight/volume limits initially)
      if (originId && destId) {
        const exactMatch = rates.find(
          (r) => r.origin_id === originId && r.destination_id === destId,
        );
        if (exactMatch) return exactMatch;
      }

      // 3. Filter by weight (for Air) logic for general lookup
      const validRates = rates.filter((r) => {
        if (criteria.mode !== "air") return true;
        return (
          (!r.min_weight || criteria.weight >= r.min_weight) &&
          (!r.max_weight || criteria.weight <= r.max_weight)
        );
      });

      // Return first match if any
      return validRates.length > 0 ? validRates[0] : null;
    } catch (error) {
      console.error("Error finding matching rate:", error);
      return null;
    }
  },
};
