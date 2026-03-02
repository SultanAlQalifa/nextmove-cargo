import { supabase } from "../lib/supabase";
import { supabaseWrapper } from "../lib/supabaseWrapper";
import { getCountryCode } from "../constants/countries";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS & RATES (BASE: XOF)
// ═══════════════════════════════════════════════════════════════

// Exchange Rates (1 XOF = ???)
// Exchange Rates (1 XOF = ???)
// These are base rates updated manually or via bridge service.
const EXCHANGE_RATES: Record<string, number> = {
  XOF: 1,
  EUR: 0.001524,
  USD: 0.001646,
  CNY: 0.01189, // Yuan
  GBP: 0.001295,
};

/**
 * Country Normalization Map
 * Maps common user inputs or i18n names to system-standard English country names
 * used for location lookups in the database.
 */
const COUNTRY_NORM: Record<string, string> = {
  "Chine": "China",
  "Sénégal": "Senegal",
  "France": "France",
  "États-Unis": "USA",
  "Etats-Unis": "USA",
  "Cote d'Ivoire": "Ivory Coast",
  "Côte d'Ivoire": "Ivory Coast",
  "Turquie": "Turkey",
  "Dubai": "UAE",
  "Émirats arabes unis": "UAE"
};

const normalizeCountryName = (name: string): string => {
  if (!name) return "";
  return COUNTRY_NORM[name] || name;
};

/**
 * Conversion Helper with Robust Fallback
 */
const convertFromXOF = (amountXOF: number, targetCurrency: string): number => {
  const rate = EXCHANGE_RATES[targetCurrency];
  if (rate === undefined) {
    console.warn(`[Calculator] Unknown currency requested: ${targetCurrency}. Falling back to XOF (1:1)`);
    return amountXOF;
  }
  return amountXOF * rate;
};

export interface QuoteResult {
  id: string;
  forwarder_id: string;
  forwarder_name: string;
  mode: "sea" | "air";
  type: "standard" | "express";

  // Costs in TARGET CURRENCY
  base_cost: number;
  insurance_cost: number;
  tax_cost: number;
  additional_services_cost: number;
  total_cost: number;
  currency: string;

  // Details
  transit_time: string;
  price_per_unit: number;
  unit: "cbm" | "kg";

  // Detailed fees breakdown
  detailed_fees: {
    name: string;
    amount: number;
    category: string;
    recipient: "platform" | "forwarder";
  }[];

  // AI Insights
  ai_tax_amount?: number;
  ai_tax_detail?: string;
  ai_confidence?: number;

  // UI Metadata
  is_platform_rate: boolean;
  is_featured: boolean;
  forwarder_logo?: string;
  rating: number;
  review_count: number;
  services: string[]; // Dynamically available services
}

export interface CalculationParams {
  origin: string;
  destination: string;
  mode: "sea" | "air";
  type: "standard" | "express";
  weight_kg?: number;
  volume_cbm?: number;

  calculationMode: "platform" | "compare" | "specific" | "sourcing";
  forwarder_id?: string;
  targetCurrency?: string;

  cargoValue?: number; // In Target Currency (Frontend sends user input)

  additionalServices?: {
    insurance?: boolean;
    packaging?: boolean;
    priority?: boolean;
    inspection?: boolean;
    door_to_door?: boolean;
    storage?: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════
// CORE SERVICE
// ═══════════════════════════════════════════════════════════════

export const calculatorService = {
  async calculateQuotes(params: CalculationParams): Promise<QuoteResult[]> {
    // 1. Validation & Setup
    const weight = Number(params.weight_kg || 0);
    const volume = Number(params.volume_cbm || 0);
    const targetCurrency = params.targetCurrency || "XOF";

    if (weight <= 0 && volume <= 0) return [];
    if (params.origin === params.destination) return [];

    // 2. Resolve Location IDs
    const originNorm = normalizeCountryName(params.origin);
    const destinationNorm = normalizeCountryName(params.destination);

    const originCode = getCountryCode(originNorm) || originNorm;
    const destCode = getCountryCode(destinationNorm) || destinationNorm;

    const locations = await supabaseWrapper.query(async () => {
      return await supabase
        .from("locations")
        .select("id, name, country_code")
        .or(
          `name.in.("${params.origin}","${params.destination}"),country_code.in.("${originCode}","${destCode}")`,
        );
    });

    const originId = locations?.find(
      (l) => l.name === params.origin || l.country_code === originCode,
    )?.id;
    const destId = locations?.find(
      (l) => l.name === params.destination || l.country_code === destCode,
    )?.id;

    // 3. Centralized RPC Call (Innovation: Database-side calculation)
    const { data: quoteData, error: rpcError } = await supabase.rpc('calculate_shipping_quote', {
      p_origin_id: originId,
      p_dest_id: destId,
      p_mode: params.mode,
      p_type: params.type,
      p_weight: weight,
      p_volume: volume,
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_additional_services: Object.keys(params.additionalServices || {}).filter(k => params.additionalServices?.[k as keyof typeof params.additionalServices])
    });

    if (rpcError || !quoteData) {
      console.error("RPC Calculation Error:", rpcError);
      // Fallback or handle accordingly
      return [];
    }

    // 4. Map RPC result to QuoteResult (Mode Platform as first result)
    // Note: This RPC currently returns a single calculated object based on platform rates.
    // Future enhancement: could return multiple options.

    const result: QuoteResult = {
      id: 'platform-rpc',
      forwarder_id: 'platform',
      forwarder_name: 'NextMove Platform',
      mode: params.mode,
      type: params.type,
      base_cost: convertFromXOF(quoteData.base_cost, targetCurrency),
      insurance_cost: convertFromXOF(quoteData.insurance_cost, targetCurrency),
      tax_cost: convertFromXOF(quoteData.tax_cost, targetCurrency),
      additional_services_cost: convertFromXOF(quoteData.other_services_cost, targetCurrency),
      total_cost: convertFromXOF(quoteData.total_cost, targetCurrency),
      currency: targetCurrency,
      transit_time: params.type === 'express' ? "3-5 days" : "15-25 days",
      price_per_unit: convertFromXOF(quoteData.base_cost / quoteData.quantity, targetCurrency),
      unit: quoteData.unit,
      detailed_fees: [
        { name: "Fret de base", amount: convertFromXOF(quoteData.base_cost, targetCurrency), category: "transport", recipient: "platform" },
        { name: "Taxes & Frais", amount: convertFromXOF(quoteData.tax_cost, targetCurrency), category: "tax", recipient: "platform" }
      ],
      is_platform_rate: true,
      is_featured: true,
      rating: 4.9,
      review_count: 1250,
      services: ['Assurance', 'Suivi IA', 'Export Pro'] // Platform supports all
    };

    return [result];
  },

  // ─────────────────────────────────────────────────────────────
  // BUILD QUOTE HELPER: Obsolete (now handled by public.calculate_shipping_quote)
  // ─────────────────────────────────────────────────────────────
  /**
   * Get base unit rates for UI cards (Platform or Specific Forwarder)
   * Returns a map of rates for each mode/type combination.
   */
  /**
   * Get base unit rates for UI cards (Platform or Specific Forwarder)
   * Returns a map of rates for each mode/type combination.
   */
  async getUnitRates(
    _origin: string,
    _destination: string,
    calculationMode: "platform" | "compare" | "specific" | "sourcing",
    forwarderId?: string,
    targetCurrency: string = "XOF",
  ): Promise<Record<string, Record<string, number | null>>> {
    const rates: Record<string, Record<string, number | null>> = {
      air: { standard: null, express: null },
      sea: { standard: null, express: null },
    };

    // If Compare mode, we don't show specific rates on cards (cards are just selectors)
    if (calculationMode === "compare") {
      return rates;
    }

    try {
      if (calculationMode === "platform" || calculationMode === "sourcing") {
        // Fetch Platform Rates (Global, so no origin/dest filter needed yet)
        const { data, error } = await supabase
          .from("platform_rates")
          .select("mode, type, price, currency")
          .eq("is_global", true); // Explicitly fetch global rates

        if (error) throw error;

        data?.forEach((rate) => {
          const mode = rate.mode;
          const type = rate.type;
          if (rates[mode] && type in rates[mode]) {
            rates[mode][type] = convertFromXOF(rate.price, targetCurrency);
          }
        });
      } else if (calculationMode === "specific" && forwarderId) {
        // Fetch Specific Forwarder Rates
        const { data, error } = await supabase
          .from("forwarder_rates")
          .select("mode, type, price, currency")
          .eq("forwarder_id", forwarderId);

        if (error) throw error;

        data?.forEach((rate) => {
          const mode = rate.mode;
          const type = rate.type;
          if (rates[mode] && type in rates[mode]) {
            rates[mode][type] = convertFromXOF(rate.price, targetCurrency);
          }
        });
      }
    } catch (err) {
      console.error("Error fetching unit rates:", err);
    }

    return rates;
  },

  /**
   * Apply AI Custom Fees Prediction to an existing quote
   */
  applyAIPrediction(
    quote: QuoteResult,
    prediction: { total_percent: number; detail: string; confidence: number },
    cargoValue: number // In quote currency
  ): QuoteResult {
    // 1. Calculate the new tax amount based on AI percentage
    // AI prediction is usually a percentage of the CIF (Cost, Insurance, Freight) value
    // For simplicity, we apply it to the cargo value
    const aiTaxAmount = cargoValue * (prediction.total_percent / 100);

    // 2. Adjust the total cost
    // We replace the standard tax (tax_cost) with the AI predicted tax if confidence is high enough
    // For now, let's just add it as an extra field or override
    const previousTotal = quote.total_cost - quote.tax_cost;
    const newTotal = previousTotal + aiTaxAmount;

    return {
      ...quote,
      tax_cost: aiTaxAmount,
      total_cost: newTotal,
      ai_tax_amount: aiTaxAmount,
      ai_tax_detail: prediction.detail,
      ai_confidence: prediction.confidence
    };
  },

  /**
   * Analyze a sourcing link (Alibaba, etc.) via AI Edge Function
   */
  async analyzeSourcingLink(url: string): Promise<{
    item_name: string;
    weight_kg: number;
    volume_cbm: number;
    unit_price: number;
    currency: string;
    category: string;
    shipping_advice: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke("sourcing-analyzer", {
        body: { url },
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Error analyzing sourcing link:", err);
      throw err;
    }
  }
};
