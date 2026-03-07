import { supabase } from "../lib/supabase";

export interface AgencyStats {
    agency_id: string;
    agency_name: string;
    agency_email: string;
    total_revenue: number;
    total_shipments: number;
    total_packages: number;
    total_weight: number;
    total_volume: number;
}

export interface BusinessKPIs {
    revenue: {
        current: number;
        previous: number;
        trend: number;
    };
    shipments: {
        current: number;
        previous: number;
        trend: number;
    };
    total_clients: number;
    active_agencies: number;
}

export const analyticsService = {
    /**
     * Get performance metrics for all agencies (forwarders)
     */
    getAgencyPerformance: async (): Promise<AgencyStats[]> => {
        const { data, error } = await supabase.rpc("get_agency_performance");
        if (error) throw error;
        return data || [];
    },

    /**
     * Get global business KPIs
     */
    getBusinessKPIs: async (): Promise<BusinessKPIs> => {
        const { data, error } = await supabase.rpc("get_business_kpis");
        if (error) throw error;
        return data;
    },

    /**
     * Get revenue over time (last 6 months)
     * Reusing rfqService logic but could be centralized here
     */
    getRevenuePerformance: async () => {
        const { data, error } = await supabase.rpc("get_financial_performance");
        if (error) throw error;
        return (data || []).map((d: any) => ({
            name: new Date(d.mois).toLocaleDateString('fr-FR', { month: 'short' }),
            value: Number(d.revenu)
        }));
    }
};
