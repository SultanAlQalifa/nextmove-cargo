// ═══════════════════════════════════════════════════════════════
// NextMove Cargo - Route Auto Generator
// Automatically generates forwarder routes & rates when an
// RFQ offer is accepted or a shipment/consolidation is created.
// ═══════════════════════════════════════════════════════════════

import { supabase } from "../lib/supabase";

interface RouteRateInput {
    forwarderId: string;
    originPort: string;
    destinationPort: string;
    transportMode: "sea" | "air";
    serviceType: "standard" | "express";
    price: number;           // base price from offer or shipment
    totalPrice: number;      // total price including all fees
    insurancePrice?: number; // insurance component
    estimatedTransitDays: number;
    currency?: string;
}

/**
 * Find an existing location by name (case-insensitive), or create it as active.
 */
async function findOrCreateLocation(name: string): Promise<string | null> {
    if (!name || name.trim().length === 0) return null;

    const cleanName = name.trim();

    // 1. Try to find existing location
    const { data: existing } = await supabase
        .from("locations")
        .select("id")
        .ilike("name", cleanName)
        .limit(1);

    if (existing && existing.length > 0) {
        return existing[0].id;
    }

    // 2. Create new location (auto-approved since it comes from a real transaction)
    const { data: created, error } = await supabase
        .from("locations")
        .insert({
            name: cleanName,
            type: "port",
            status: "active",
        })
        .select("id")
        .single();

    if (error) {
        console.error(`[RouteAutoGen] Failed to create location "${cleanName}":`, error);
        return null;
    }

    return created?.id || null;
}

/**
 * Check if a forwarder already has a rate for this specific route + mode + type.
 */
async function rateExists(
    forwarderId: string,
    originId: string,
    destinationId: string,
    mode: string,
    type: string
): Promise<boolean> {
    const { data, error } = await supabase
        .from("forwarder_rates")
        .select("id")
        .eq("forwarder_id", forwarderId)
        .eq("origin_id", originId)
        .eq("destination_id", destinationId)
        .eq("mode", mode)
        .eq("type", type)
        .limit(1);

    if (error) {
        console.error("[RouteAutoGen] Error checking existing rate:", error);
        return false; // Assume it doesn't exist so we try to create
    }

    return (data && data.length > 0);
}

/**
 * Auto-generate a forwarder rate for a given route if one doesn't already exist.
 * This is designed to be called silently (try/catch) after offer acceptance or shipment creation.
 */
export async function autoGenerateRouteAndRate(input: RouteRateInput): Promise<void> {
    try {
        const {
            forwarderId,
            originPort,
            destinationPort,
            transportMode,
            serviceType,
            price,
            totalPrice,
            insurancePrice,
            estimatedTransitDays,
            currency = "XOF",
        } = input;

        if (!forwarderId || !originPort || !destinationPort) {
            console.warn("[RouteAutoGen] Missing required data, skipping auto-generation.");
            return;
        }

        // 1. Find or create origin and destination locations
        const [originId, destinationId] = await Promise.all([
            findOrCreateLocation(originPort),
            findOrCreateLocation(destinationPort),
        ]);

        if (!originId || !destinationId) {
            console.warn("[RouteAutoGen] Could not resolve locations, skipping.");
            return;
        }

        // 2. Check if rate already exists for this route + mode + type
        const exists = await rateExists(forwarderId, originId, destinationId, transportMode, serviceType);
        if (exists) {
            console.info(`[RouteAutoGen] Rate already exists for ${originPort} → ${destinationPort} (${transportMode}/${serviceType}). Skipping.`);
            return;
        }

        // 3. Calculate rate values from offer data
        const insuranceRate = (insurancePrice && totalPrice > 0)
            ? Math.round((insurancePrice / totalPrice) * 10000) / 10000  // e.g. 0.025 = 2.5%
            : 0.02; // Default 2%

        const minDays = Math.max(1, estimatedTransitDays - 2);
        const maxDays = estimatedTransitDays + 2;

        // 4. Insert the new rate
        const { error: insertError } = await supabase
            .from("forwarder_rates")
            .insert({
                forwarder_id: forwarderId,
                origin_id: originId,
                destination_id: destinationId,
                mode: transportMode,
                type: serviceType,
                price: price,
                currency: currency,
                min_days: minDays,
                max_days: maxDays,
                insurance_rate: insuranceRate,
                unit: "kg",
                auto_quote: false,
            });

        if (insertError) {
            console.error("[RouteAutoGen] Failed to insert rate:", insertError);
            return;
        }

        console.info(`[RouteAutoGen] ✅ Auto-generated rate: ${originPort} → ${destinationPort} (${transportMode}/${serviceType}) for forwarder ${forwarderId}`);
    } catch (err) {
        // Never throw — this is a background enhancement, not critical path
        console.error("[RouteAutoGen] Unexpected error:", err);
    }
}
