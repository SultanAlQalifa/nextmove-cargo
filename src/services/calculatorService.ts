import { supabase } from "../lib/supabase";
import { supabaseWrapper } from "../lib/supabaseWrapper";
import { feeService } from "./feeService";
import { platformRateService } from "./platformRateService";
import { getCountryCode } from "../constants/countries";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS & RATES (BASE: XOF)
// ═══════════════════════════════════════════════════════════════

// Exchange Rates (1 XOF = ???)
const EXCHANGE_RATES: Record<string, number> = {
  XOF: 1,
  EUR: 0.001524,
  USD: 0.001646,
  CNY: 0.01189,
  GBP: 0.001295,
};

// Conversion Helper
const convertFromXOF = (amountXOF: number, targetCurrency: string): number => {
  const rate = EXCHANGE_RATES[targetCurrency] || EXCHANGE_RATES["EUR"]; // Fallback to EUR if unknown
  return amountXOF * rate;
};

const XOF_PER_EUR = 655.957;

// Additional Services (Defined in EUR in specs, converted to XOF for calculation)
const ADDITIONAL_SERVICES_RATES = {
  insurance: { rate: 0.05, min_fee_xof: 50 * XOF_PER_EUR }, // 5% or 50 EUR
  priority: { flat_fee_xof: 150 * XOF_PER_EUR }, // 150 EUR
  packaging: { flat_fee_xof: 75 * XOF_PER_EUR }, // 75 EUR
  inspection: { flat_fee_xof: 100 * XOF_PER_EUR }, // 100 EUR
  customs_clearance: { flat_fee_xof: 120 * XOF_PER_EUR }, // 120 EUR
  door_to_door: { flat_fee_xof: 200 * XOF_PER_EUR }, // 200 EUR
  storage: { flat_fee_xof: 50 * XOF_PER_EUR }, // 50 EUR
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
    priority?: boolean;
    packaging?: boolean;
    inspection?: boolean;
    customs_clearance?: boolean;
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

    // 2. Resolve Taxes
    const fees = await feeService.getFees();
    const taxFee = fees.find((f) => f.category === "tax" && f.isActive);
    const taxRate =
      taxFee && taxFee.type === "percentage" ? taxFee.value / 100 : 0;

    // 3. Resolve Location IDs
    const originCode = getCountryCode(params.origin) || params.origin;
    const destCode = getCountryCode(params.destination) || params.destination;

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
        taxRate,
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
        taxRate,
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
        taxRate,
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
    taxRate: number,
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
        taxRate,
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
    taxRate: number,
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
        taxRate,
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
    taxRate: number,
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
        taxRate,
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
    taxRate: number,
    params: CalculationParams,
    firmName: string,
    forwarderId: string,
    isPlatform: boolean,
  ): QuoteResult {
    // 1. Base Cost (XOF)
    const priceXOF = Number(rateData.price);
    const baseCostXOF = priceXOF * quantity;

    // 2. Additional Services (XOF)
    let servicesXOF = 0;

    if (params.additionalServices) {
      // Insurance
      if (params.additionalServices.insurance && params.cargoValue) {
        // Determine rate (Forwarder specific OR Platform fallback)
        // Note: platform_rates also has insurance_rate column now
        const insRate =
          rateData.insurance_rate || ADDITIONAL_SERVICES_RATES.insurance.rate;

        // cargoValue is in Target Currency. Convert to XOF first?
        // Actually, simplest is: Calculate Insurance in Target, then convert back to XOF for total?
        // No, strict flow: EVERYTHING IN XOF.

        // Convert User Cargo Value to XOF
        // valueXOF = valueTarget / EXCHANGE_RATES[target]
        const valueXOF =
          (params.cargoValue || 0) / EXCHANGE_RATES[targetCurrency];

        const calculatedIns = valueXOF * insRate;
        const minIns = ADDITIONAL_SERVICES_RATES.insurance.min_fee_xof;
        servicesXOF += Math.max(calculatedIns, minIns);
      }

      if (params.additionalServices.priority)
        servicesXOF += ADDITIONAL_SERVICES_RATES.priority.flat_fee_xof;
      if (params.additionalServices.packaging)
        servicesXOF += ADDITIONAL_SERVICES_RATES.packaging.flat_fee_xof;
      if (params.additionalServices.inspection)
        servicesXOF += ADDITIONAL_SERVICES_RATES.inspection.flat_fee_xof;
      if (params.additionalServices.customs_clearance)
        servicesXOF += ADDITIONAL_SERVICES_RATES.customs_clearance.flat_fee_xof;
      if (params.additionalServices.door_to_door)
        servicesXOF += ADDITIONAL_SERVICES_RATES.door_to_door.flat_fee_xof;
      if (params.additionalServices.storage)
        servicesXOF += ADDITIONAL_SERVICES_RATES.storage.flat_fee_xof;
    }

    // 3. Tax (XOF)
    const taxXOF = (baseCostXOF + servicesXOF) * taxRate;

    // 4. Convert Parts to Target Currency
    const base_cost = convertFromXOF(baseCostXOF, targetCurrency);
    const additional_services_cost = convertFromXOF(
      servicesXOF,
      targetCurrency,
    );
    const tax_cost = convertFromXOF(taxXOF, targetCurrency);
    const total_cost = convertFromXOF(
      baseCostXOF + servicesXOF + taxXOF,
      targetCurrency,
    );

    // 5. Insurance Cost Display (Separate bucket in UI usually)
    // Check if insurance was part of servicesXOF... yes.
    // We should extract it if UI wants it separate.
    // For now, let's keep it simple: if insurance service is ON, it's in additional_services_cost.
    // Wait, UI props has insurance_cost separate.
    // Let's separate it.

    let insuranceXOF = 0;
    let otherServicesXOF = 0;

    if (params.additionalServices) {
      if (params.additionalServices.insurance && params.cargoValue) {
        const insRate =
          rateData.insurance_rate || ADDITIONAL_SERVICES_RATES.insurance.rate;
        const valueXOF =
          (params.cargoValue || 0) / EXCHANGE_RATES[targetCurrency];
        insuranceXOF = Math.max(
          valueXOF * insRate,
          ADDITIONAL_SERVICES_RATES.insurance.min_fee_xof,
        );
      }
      // ... recalculate others
      if (params.additionalServices.priority)
        otherServicesXOF += ADDITIONAL_SERVICES_RATES.priority.flat_fee_xof;
      if (params.additionalServices.packaging)
        otherServicesXOF += ADDITIONAL_SERVICES_RATES.packaging.flat_fee_xof;
      if (params.additionalServices.inspection)
        otherServicesXOF += ADDITIONAL_SERVICES_RATES.inspection.flat_fee_xof;
      if (params.additionalServices.customs_clearance)
        otherServicesXOF +=
          ADDITIONAL_SERVICES_RATES.customs_clearance.flat_fee_xof;
      if (params.additionalServices.door_to_door)
        otherServicesXOF += ADDITIONAL_SERVICES_RATES.door_to_door.flat_fee_xof;
      if (params.additionalServices.storage)
        otherServicesXOF += ADDITIONAL_SERVICES_RATES.storage.flat_fee_xof;
    }

    const insurance_cost = convertFromXOF(insuranceXOF, targetCurrency);
    const other_services_cost = convertFromXOF(
      otherServicesXOF,
      targetCurrency,
    );
    const tax_cost_final = convertFromXOF(
      (baseCostXOF + insuranceXOF + otherServicesXOF) * taxRate,
      targetCurrency,
    );

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
    origin: string,
    destination: string,
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
          .select("mode, type, price, currency") // Changed transport_mode->mode, price_per_unit->price
          .eq("forwarder_id", forwarderId);
        // Removing origin/dest filters as they require UUID lookup and we want to show available services generally

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
