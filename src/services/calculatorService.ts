import { supabase } from "../lib/supabase";
import { supabaseWrapper } from "../lib/supabaseWrapper";
import { feeService, FeeConfig } from "./feeService";
import { getCountryCode } from "../constants/countries";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS & RATES (BASE: XOF)
// ═══════════════════════════════════════════════════════════════

// Exchange Rates (1 XOF = ???)
// Exchange Rates (1 XOF = ???)
const EXCHANGE_RATES: Record<string, number> = {
  XOF: 1,
  EUR: 0.001524,
  USD: 0.001646,
  CNY: 0.01189,
  GBP: 0.001295,
};

// Country Normalization Map
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

// Conversion Helper
const convertFromXOF = (amountXOF: number, targetCurrency: string): number => {
  const rate = EXCHANGE_RATES[targetCurrency] || EXCHANGE_RATES["EUR"]; // Fallback to EUR if unknown
  return amountXOF * rate;
};

// Helper: Resolve dynamic fee cost
const resolveFeeCost = (
  fees: FeeConfig[],
  category: string,
  baseAmountXOF: number = 0
): number => {
  const fee = fees.find((f) => f.category === category && f.isActive);
  if (!fee) return 0;

  let cost = 0;
  if (fee.type === "percentage") {
    cost = baseAmountXOF * (fee.value / 100);
  } else {
    // Fixed fee
    cost = fee.value;
  }

  // Apply min/max constraints if present
  if (fee.minAmount) cost = Math.max(cost, fee.minAmount);
  if (fee.maxAmount) cost = Math.min(cost, fee.maxAmount);

  return cost;
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

  // UI Metadata
  is_platform_rate: boolean;
  is_featured: boolean;
  rating: number;
  review_count: number;
}

export interface CalculationParams {
  origin: string;
  destination: string;
  mode: "sea" | "air";
  type: "standard" | "express";
  weight_kg?: number;
  volume_cbm?: number;

  calculationMode: "platform" | "compare" | "specific";
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
    const quantity = params.mode === "sea" ? volume : weight;
    const targetCurrency = params.targetCurrency || "XOF";

    if (quantity <= 0) return [];
    if (params.origin === params.destination) return [];

    // 2. Fetch Active Fees Config
    const fees = await feeService.getFees();

    // 3. Resolve Location IDs
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

    // 4. Dispatch by Mode
    if (params.calculationMode === "platform") {
      return this.calculatePlatformQuote(
        params,
        quantity,
        targetCurrency,
        fees,
      );
    }

    if (!originId || !destId) {
      console.warn("Locations not resolved for non-platform mode");
      return [];
    }

    if (params.calculationMode === "compare") {
      return this.calculateComparativeQuotes(
        params,
        originId,
        destId,
        quantity,
        targetCurrency,
        fees,
      );
    }

    if (params.calculationMode === "specific") {
      if (!params.forwarder_id) return [];
      return this.calculateSpecificQuote(
        params,
        params.forwarder_id,
        originId,
        destId,
        quantity,
        targetCurrency,
        fees,
      );
    }

    return [];
  },

  // ─────────────────────────────────────────────────────────────
  // MODE 1: PLATFORM RATES (Global)
  // ─────────────────────────────────────────────────────────────
  async calculatePlatformQuote(
    params: CalculationParams,
    quantity: number,
    targetCurrency: string,
    fees: FeeConfig[],
  ): Promise<QuoteResult[]> {
    // Fetch from platform_rates table
    const rates = await supabaseWrapper.query(async () => {
      return await supabase
        .from("platform_rates")
        .select("*")
        .eq("mode", params.mode)
        .eq("type", params.type)
        .eq("is_global", true) // Ensure we get the correct global rate
        .single();
    });

    if (!rates) return [];

    return [
      this.buildQuote(
        rates,
        quantity,
        targetCurrency,
        fees,
        params,
        "NextMove Platform",
        "platform",
        true,
      ),
    ];
  },

  // ─────────────────────────────────────────────────────────────
  // MODE 2: COMPARE TRANSITAIRES
  // ─────────────────────────────────────────────────────────────
  async calculateComparativeQuotes(
    params: CalculationParams,
    originId: string,
    destId: string,
    quantity: number,
    targetCurrency: string,
    fees: FeeConfig[],
  ): Promise<QuoteResult[]> {
    const rates = await supabaseWrapper.query(async () => {
      return await supabase
        .from("forwarder_rates")
        .select(
          `
                    *,
                    profiles:forwarder_id (company_name)
                `,
        )
        .eq("origin_id", originId)
        .eq("destination_id", destId)
        .eq("mode", params.mode)
        .eq("type", params.type)
        .eq("is_active", true);
    });

    if (!rates || rates.length === 0) return [];

    const quotes = rates.map((rate) =>
      this.buildQuote(
        rate,
        quantity,
        targetCurrency,
        fees,
        params,
        rate.profiles?.company_name || "Unknown",
        rate.forwarder_id,
        false,
      ),
    );

    // Sort: Sponsored first, then Rating DESC (mock), then Price ASC
    return quotes.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return a.total_cost - b.total_cost;
    });
  },

  // ─────────────────────────────────────────────────────────────
  // MODE 3: TRANSITAIRE SPÉCIFIQUE
  // ─────────────────────────────────────────────────────────────
  async calculateSpecificQuote(
    params: CalculationParams,
    forwarderId: string,
    originId: string,
    destId: string,
    quantity: number,
    targetCurrency: string,
    fees: FeeConfig[],
  ): Promise<QuoteResult[]> {
    const { data: rate } = await supabase
      .from("forwarder_rates")
      .select(
        `
                *,
                profiles:forwarder_id (company_name)
            `,
      )
      .eq("forwarder_id", forwarderId)
      .eq("origin_id", originId)
      .eq("destination_id", destId)
      .eq("mode", params.mode)
      .eq("type", params.type)
      .eq("is_active", true)
      .single();

    if (!rate) return [];

    return [
      this.buildQuote(
        rate,
        quantity,
        targetCurrency,
        fees,
        params,
        rate.profiles?.company_name || "Specific Forwarder",
        rate.forwarder_id,
        false,
      ),
    ];
  },

  // ─────────────────────────────────────────────────────────────
  // BUILD QUOTE HELPER (THE ENGINE)
  // ─────────────────────────────────────────────────────────────
  buildQuote(
    rateData: any,
    quantity: number,
    targetCurrency: string,
    fees: FeeConfig[],
    params: CalculationParams,
    firmName: string,
    forwarderId: string,
    isPlatform: boolean,
  ): QuoteResult {
    // 1. Base Cost (XOF)
    const priceXOF = Number(rateData.price);
    const baseCostXOF = priceXOF * quantity;

    // 2. Resolve Cargo Value in XOF
    const cargoValueXOF = (params.cargoValue || 0) / EXCHANGE_RATES[targetCurrency];

    // 3. Additional Services (XOF) - STRICT DB LOOKUP
    let insuranceXOF = 0;
    let otherServicesXOF = 0;

    if (params.additionalServices) {
      // Insurance
      if (params.additionalServices.insurance && params.cargoValue) {
        // Priority: DB Fee Config > Calculated
        insuranceXOF = resolveFeeCost(fees, "insurance", cargoValueXOF);
      }

      // Other services
      if (params.additionalServices.packaging)
        otherServicesXOF += resolveFeeCost(fees, "packaging", baseCostXOF); // Usually fixed, but supports %

      if (params.additionalServices.priority)
        otherServicesXOF += resolveFeeCost(fees, "priority", baseCostXOF);

      if (params.additionalServices.inspection)
        otherServicesXOF += resolveFeeCost(fees, "inspection", baseCostXOF);

      if (params.additionalServices.door_to_door)
        otherServicesXOF += resolveFeeCost(fees, "door_to_door", baseCostXOF);

      if (params.additionalServices.storage)
        otherServicesXOF += resolveFeeCost(fees, "storage", baseCostXOF);
    }

    // 4. Tax (XOF) - Calculated on (Base + Services + Insurance)
    // Note: Some jurisdictions tax only service fees, others the whole amount. 
    // Defaulting to taxing the Total Service Value (Base + Extras).
    const taxableAmount = baseCostXOF + insuranceXOF + otherServicesXOF;
    const taxXOF = resolveFeeCost(fees, "tax", taxableAmount);

    // 5. Convert Parts to Target Currency
    const base_cost = convertFromXOF(baseCostXOF, targetCurrency);
    const insurance_cost = convertFromXOF(insuranceXOF, targetCurrency);
    const other_services_cost = convertFromXOF(otherServicesXOF, targetCurrency);
    const tax_cost_final = convertFromXOF(taxXOF, targetCurrency);

    return {
      id: rateData.id,
      forwarder_id: forwarderId,
      forwarder_name: firmName,
      mode: rateData.mode,
      type: rateData.type,
      base_cost,
      insurance_cost,
      tax_cost: tax_cost_final,
      additional_services_cost: other_services_cost,
      total_cost:
        base_cost + insurance_cost + other_services_cost + tax_cost_final,
      currency: targetCurrency,
      transit_time: `${rateData.min_days}-${rateData.max_days} days`,
      price_per_unit: convertFromXOF(priceXOF, targetCurrency),
      unit: rateData.unit,
      is_platform_rate: isPlatform,
      is_featured: rateData.is_featured || false,
      rating: isPlatform ? 4.9 : 5.0, // Mock for now, or fetch from profiles
      review_count: isPlatform ? 1250 : 25,
    };
  },
  /**
   * Get base unit rates for UI cards (Platform or Specific Forwarder)
   * Returns a map of rates for each mode/type combination.
   */
  async getUnitRates(
    _origin: string,
    _destination: string,
    calculationMode: "platform" | "compare" | "specific",
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
      if (calculationMode === "platform") {
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
};
