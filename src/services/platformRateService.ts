import { supabase } from "../lib/supabase";
import { fetchWithRetry } from "../utils/supabaseHelpers";

export interface PlatformRate {
  id: string;
  mode: "sea" | "air" | "road";
  type: "standard" | "express";
  price: number;
  currency: string;
  min_days: number;
  max_days: number;
  insurance_rate: number;
  unit: "kg" | "cbm";
  updated_at: string;
  origin_id?: string;
  destination_id?: string;
  origin?: { name: string };
  destination?: { name: string };
}

export const platformRateService = {
  getAllRates: async (): Promise<PlatformRate[]> => {
    const data = await fetchWithRetry<PlatformRate[]>(() =>
      supabase
        .from("platform_rates")
        .select(
          `
                    *,
                    origin:origin_id(name),
                    destination:destination_id(name)
                `,
        )
        .order("mode")
        .order("type"),
    );
    return data || [];
  },

  getRateByRoute: async (
    mode: string,
    type: string,
    originCountry: string,
    destCountry: string,
  ): Promise<PlatformRate | null> => {
    try {
      // First try to find a specific rate for this route
      // We need to join with profiles or use location names if stored directly
      // Current DB schema uses origin_id/destination_id which are UUIDs from 'locations' table

      // 1. Get Location IDs first (Optimization: simple cache or separate lookup)
      const { data: locations } = await supabase
        .from("locations")
        .select("id, name")
        .in("name", [originCountry, destCountry]);

      const originId = locations?.find((l) => l.name === originCountry)?.id;
      const destId = locations?.find((l) => l.name === destCountry)?.id;

      let query = supabase
        .from("platform_rates")
        .select("*")
        .eq("mode", mode)
        .eq("type", type);

      if (originId && destId) {
        // Try specific route
        const specificQuery = query
          .eq("origin_id", originId)
          .eq("destination_id", destId)
          .maybeSingle(); // Use specific query object if separating logic, but here chaining

        // For simplicity in this step, let's fetch matching rates and filter in code
        // to handle the "Global" fallback logic correctly
        // Fetch potentially matching rates (Global or Specific)
        const { data: rates, error: rateError } = await supabase
          .from("platform_rates")
          .select("*")
          .eq("mode", mode)
          .eq("type", type)
          .or(
            `and(origin_id.eq.${originId},destination_id.eq.${destId}),and(origin_id.is.null,destination_id.is.null)`,
          );

        if (rates && rates.length > 0) {
          // Prefer specific route over global (null IDs)
          const specific = rates.find(
            (r) => r.origin_id === originId && r.destination_id === destId,
          );
          return (
            specific ||
            rates.find((r) => !r.origin_id && !r.destination_id) ||
            null
          );
        }
      } else {
        // Return Global Rate if no specific route matches potential locations
        const { data: globalRate, error: globalError } = await supabase
          .from("platform_rates")
          .select("*")
          .eq("mode", mode)
          .eq("type", type)
          .is("origin_id", null)
          .is("destination_id", null)
          .maybeSingle();

        return globalRate;
      }

      return null;
    } catch (error) {
      return null;
    }
  },

  createRate: async (
    rate: Omit<PlatformRate, "id" | "updated_at" | "origin" | "destination">,
  ): Promise<PlatformRate> => {
    const { data, error } = await supabase
      .from("platform_rates")
      .insert(rate)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateRate: async (
    id: string,
    updates: Partial<PlatformRate>,
  ): Promise<PlatformRate> => {
    try {
      // Remove nested objects before sending to DB
      const { origin, destination, ...cleanUpdates } = updates;

      const { data, error } = await supabase
        .from("platform_rates")
        .update(cleanUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating platform rate:", error);
      throw error;
    }
  },

  deleteRate: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("platform_rates")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};
