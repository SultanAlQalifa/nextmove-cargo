import { supabase } from "../lib/supabase";
import { fetchWithRetry } from "../utils/supabaseHelpers";

export interface ForwarderRate {
  id: string;
  forwarder_id: string;
  mode: "sea" | "air";
  type: "standard" | "express";
  price: number;
  currency: string;
  min_days: number;
  max_days: number;
  insurance_rate: number;
  unit: "kg" | "cbm";
  auto_quote?: boolean;
  origin_id?: string | null;
  destination_id?: string | null;
  origin?: { name: string };
  destination?: { name: string };
  created_at?: string;
}

export const forwarderRateService = {
  getMyRates: async (): Promise<ForwarderRate[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const result = await fetchWithRetry<ForwarderRate[]>(() =>
      supabase
        .from("forwarder_rates")
        .select(
          `
                    *,
                    origin:origin_id(name),
                    destination:destination_id(name)
                `,
        )
        .eq("forwarder_id", user.id)
        .order("created_at", { ascending: false }),
    );

    return result || [];
  },

  createRate: async (
    rate: Omit<ForwarderRate, "id" | "forwarder_id">,
  ): Promise<ForwarderRate | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const payload = { ...rate, forwarder_id: user.id };

    return fetchWithRetry<ForwarderRate>(() =>
      supabase.from("forwarder_rates").insert([payload]).select().single(),
    );
  },

  updateRate: async (
    id: string,
    updates: Partial<ForwarderRate>,
  ): Promise<ForwarderRate | null> => {
    // Remove nested objects before update to avoid errors
    const { origin, destination, ...cleanUpdates } = updates;

    return fetchWithRetry<ForwarderRate>(() =>
      supabase
        .from("forwarder_rates")
        .update(cleanUpdates)
        .eq("id", id)
        .select()
        .single(),
    );
  },

  deleteRate: async (id: string): Promise<void> => {
    await fetchWithRetry(() =>
      supabase.from("forwarder_rates").delete().eq("id", id),
    );
  },
};
