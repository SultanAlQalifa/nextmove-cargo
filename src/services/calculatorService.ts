import { supabase } from '../lib/supabase';
import { feeService } from './feeService';
import { platformRateService } from './platformRateService';

// Exchange Rates (Base: EUR)

// Exchange Rates (Base: EUR)
const EXCHANGE_RATES: Record<string, number> = {
    'EUR': 1,
    'XOF': 655.957, // Fixed peg
    'USD': 1.08,
    'CNY': 7.8,
    'GBP': 0.85
};

const convertPrice = (price: number, currency: string): number => {
    const rate = EXCHANGE_RATES[currency] || 1;
    return price * rate;
};

export interface QuoteResult {
    id: string;
    forwarder_id: string;
    forwarder_name: string;
    mode: 'sea' | 'air';
    type: 'standard' | 'express';

    // Cost Breakdown
    base_cost: number;
    insurance_cost: number;
    tax_cost: number; // Added tax cost
    additional_services_cost: number; // Cost for extra services
    total_cost: number;
    currency: string;

    // Details
    transit_time: string;
    price_per_unit: number;
    unit: 'cbm' | 'kg';

    is_platform_rate: boolean;

    // Social Proof (Mocked for now)
    rating: number;
    review_count: number;
}

export interface CalculationParams {
    origin: string;
    destination: string;
    mode: 'sea' | 'air';
    type: 'standard' | 'express';
    weight_kg?: number;
    volume_cbm?: number;

    // New params
    weight?: number; // Added from user instruction
    dimensions?: { length: number; width: number; height: number }; // Added from user instruction
    transportMode?: 'air' | 'sea' | 'road'; // Added from user instruction, note potential conflict with 'mode'
    incoterm?: string; // Added from user instruction
    cargoValue?: number; // Added from user instruction

    calculationMode: 'platform' | 'compare' | 'specific';
    forwarder_id?: string;
    targetCurrency?: string;
    additionalServices?: { // Updated structure from user instruction
        insurance?: boolean;
        priority?: boolean;
        packaging?: boolean;
        inspection?: boolean;
        customs_clearance?: boolean;
        door_to_door?: boolean;
        storage?: boolean;
    };
}

const ADDITIONAL_SERVICES_RATES = {
    insurance: {
        rate: 0.05, // 5% of cargo value
        min_fee: 50,
    },
    priority: {
        flat_fee: 150,
    },
    packaging: {
        flat_fee: 75,
    },
    inspection: {
        flat_fee: 100,
    },
    customs_clearance: {
        flat_fee: 120,
    },
    door_to_door: {
        flat_fee: 200,
    },
    storage: {
        flat_fee: 50,
    }
};

export const calculatorService = {
    async calculateQuotes(params: CalculationParams): Promise<QuoteResult[]> {
        const quantity = params.mode === 'sea' ? (params.volume_cbm || 0) : (params.weight_kg || 0);

        if (quantity <= 0) return [];

        // Fetch active fees to find tax
        const fees = await feeService.getFees();
        const taxFee = fees.find(f => f.category === 'tax' && f.isActive);
        const taxRate = taxFee && taxFee.type === 'percentage' ? taxFee.value / 100 : 0;

        // MODE 1: Platform Rates
        if (params.calculationMode === 'platform') {
            const targetCurrency = params.targetCurrency || 'EUR';

            // Fetch dynamic rates
            const allRates = await platformRateService.getAllRates();
            const rateConfig = allRates.find(r => r.mode === params.mode && r.type === params.type);

            if (!rateConfig) {
                console.warn(`No platform rate found for ${params.mode} ${params.type}`);
                return [];
            }

            // Calculate in EUR first (assuming base rates are in EUR as per DB seed)
            // If DB allows other currencies, we should convert rateConfig.price to EUR first. 
            // For now, assuming standard base is EUR.
            const base_cost_eur = quantity * rateConfig.price;
            const insurance_cost_eur = base_cost_eur * rateConfig.insurance_rate;

            // Calculate Additional Services
            let additional_services_eur = 0;
            if (params.additionalServices) {
                if (params.additionalServices.insurance && params.cargoValue) {
                    const insuranceCost = Math.max(
                        params.cargoValue * ADDITIONAL_SERVICES_RATES.insurance.rate,
                        ADDITIONAL_SERVICES_RATES.insurance.min_fee
                    );
                    additional_services_eur += insuranceCost;
                }
                if (params.additionalServices.priority) {
                    additional_services_eur += ADDITIONAL_SERVICES_RATES.priority.flat_fee;
                }
                if (params.additionalServices.packaging) {
                    additional_services_eur += ADDITIONAL_SERVICES_RATES.packaging.flat_fee;
                }
                if (params.additionalServices.inspection) {
                    additional_services_eur += ADDITIONAL_SERVICES_RATES.inspection.flat_fee;
                }
                if (params.additionalServices.customs_clearance) {
                    additional_services_eur += ADDITIONAL_SERVICES_RATES.customs_clearance.flat_fee;
                }
                if (params.additionalServices.door_to_door) {
                    additional_services_eur += ADDITIONAL_SERVICES_RATES.door_to_door.flat_fee;
                }
                if (params.additionalServices.storage) {
                    additional_services_eur += ADDITIONAL_SERVICES_RATES.storage.flat_fee;
                }
            }

            // Calculate tax in EUR (including additional services)
            const tax_cost_eur = (base_cost_eur + insurance_cost_eur + additional_services_eur) * taxRate;

            // Convert to target currency
            const base_cost = convertPrice(base_cost_eur, targetCurrency);
            const insurance_cost = convertPrice(insurance_cost_eur, targetCurrency);
            const additional_services_cost = convertPrice(additional_services_eur, targetCurrency);
            const tax_cost = convertPrice(tax_cost_eur, targetCurrency);
            const price_per_unit = convertPrice(rateConfig.price, targetCurrency);

            return [{
                id: 'platform-rate',
                forwarder_id: 'platform',
                forwarder_name: 'NextMove Platform',
                mode: params.mode,
                type: params.type,
                base_cost,
                insurance_cost,
                tax_cost,
                additional_services_cost,
                total_cost: base_cost + insurance_cost + tax_cost + additional_services_cost,
                currency: targetCurrency,
                transit_time: `${rateConfig.min_days}-${rateConfig.max_days} days`,
                price_per_unit,
                unit: rateConfig.unit as 'cbm' | 'kg',
                is_platform_rate: true,
                rating: 4.9,
                review_count: 1250
            }];
        }

        // MODE 2 & 3: Forwarder Rates
        let query = supabase
            .from('rates')
            .select(`
                *,
                profiles:forwarder_id (
                    company_name
                )
            `)
            .eq('mode', params.mode)
            .eq('type', params.type);

        if (params.calculationMode === 'specific' && params.forwarder_id) {
            query = query.eq('forwarder_id', params.forwarder_id);
        }

        const { data: rates, error } = await query;

        if (error) {
            console.error('Error fetching rates:', error);
            return [];
        }

        // Mock data if no rates found (for demonstration/testing purposes)
        let ratesList = rates || [];
        if (ratesList.length === 0 && params.calculationMode === 'compare') {
            ratesList = [
                {
                    id: 'mock-1',
                    forwarder_id: 'fwd-1',
                    profiles: { company_name: 'Global Logistics' },
                    mode: params.mode,
                    type: params.type,
                    price_per_unit: params.mode === 'sea' ? 85 : 9,
                    transit_time_min: params.mode === 'sea' ? 40 : 4,
                    transit_time_max: params.mode === 'sea' ? 55 : 6,
                    insurance_rate: 0.06,
                    currency: 'EUR'
                },
                {
                    id: 'mock-2',
                    forwarder_id: 'fwd-2',
                    profiles: { company_name: 'FastTrack Cargo' },
                    mode: params.mode,
                    type: params.type,
                    price_per_unit: params.mode === 'sea' ? 110 : 14,
                    transit_time_min: params.mode === 'sea' ? 25 : 2,
                    transit_time_max: params.mode === 'sea' ? 40 : 3,
                    insurance_rate: 0.07,
                    currency: 'EUR'
                },
                {
                    id: 'mock-3',
                    forwarder_id: 'fwd-3',
                    profiles: { company_name: 'EcoShip Partners' },
                    mode: params.mode,
                    type: params.type,
                    price_per_unit: params.mode === 'sea' ? 75 : 7.5,
                    transit_time_min: params.mode === 'sea' ? 50 : 6,
                    transit_time_max: params.mode === 'sea' ? 65 : 9,
                    insurance_rate: 0.05,
                    currency: 'EUR'
                }
            ];
        }

        if (ratesList.length === 0) return [];

        // Fetch platform rates for default insurance fallback
        const allRates = await platformRateService.getAllRates();
        const platformConfig = allRates.find(r => r.mode === params.mode && r.type === params.type);

        return ratesList.map((rate: any) => {
            // Use forwarder specific insurance if available, otherwise fallback to platform default for that mode/type
            const targetCurrency = params.targetCurrency || 'EUR';

            // Fallback to 5% if no platform config found (safety)
            const fallbackInsurance = platformConfig ? platformConfig.insurance_rate : 0.05;
            const insuranceRate = rate.insurance_rate || fallbackInsurance;

            // Assume DB rates are in EUR for now, or convert if DB has currency field
            // For simplicity, assuming DB rates are EUR based.
            const base_cost_eur = quantity * rate.price_per_unit;
            const insurance_cost_eur = base_cost_eur * insuranceRate;

            // Calculate additional services cost
            let additional_services_eur = 0;
            if (params.additionalServices) {
                if (params.additionalServices.insurance && params.cargoValue) {
                    const insuranceCost = Math.max(
                        params.cargoValue * ADDITIONAL_SERVICES_RATES.insurance.rate,
                        ADDITIONAL_SERVICES_RATES.insurance.min_fee
                    );
                    additional_services_eur += insuranceCost;
                }
                if (params.additionalServices.priority) {
                    additional_services_eur += ADDITIONAL_SERVICES_RATES.priority.flat_fee;
                }
                if (params.additionalServices.packaging) {
                    additional_services_eur += ADDITIONAL_SERVICES_RATES.packaging.flat_fee;
                }
                if (params.additionalServices.inspection) {
                    additional_services_eur += ADDITIONAL_SERVICES_RATES.inspection.flat_fee;
                }
            }

            // Calculate tax in EUR
            const tax_cost_eur = (base_cost_eur + insurance_cost_eur + additional_services_eur) * taxRate;

            // Convert to target currency
            const base_cost = convertPrice(base_cost_eur, targetCurrency);
            const insurance_cost = convertPrice(insurance_cost_eur, targetCurrency);
            const additional_services_cost = convertPrice(additional_services_eur, targetCurrency);
            const tax_cost = convertPrice(tax_cost_eur, targetCurrency);
            const price_per_unit = convertPrice(rate.price_per_unit, targetCurrency);

            return {
                id: rate.id,
                forwarder_id: rate.forwarder_id,
                forwarder_name: rate.profiles?.company_name || 'Unknown Forwarder',
                mode: rate.mode,
                type: rate.type,
                base_cost,
                insurance_cost,
                tax_cost,
                additional_services_cost,
                total_cost: base_cost + insurance_cost + tax_cost + additional_services_cost,
                currency: targetCurrency,
                transit_time: `${rate.transit_time_min}-${rate.transit_time_max} days`,
                price_per_unit,
                unit: (params.mode === 'sea' ? 'cbm' : 'kg') as 'cbm' | 'kg',
                is_platform_rate: false,
                rating: 3.5 + Math.random() * 1.5, // Random rating 3.5 - 5.0
                review_count: Math.floor(Math.random() * 500) + 10
            };
        }).sort((a, b) => a.total_cost - b.total_cost);
    }
};
