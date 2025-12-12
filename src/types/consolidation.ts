export type ConsolidationType = "forwarder_offer" | "client_request";

export type ConsolidationStatus =
  | "open"
  | "closing_soon"
  | "full"
  | "in_transit"
  | "completed"
  | "cancelled";

export interface Consolidation {
  id: string;
  initiator_id: string;
  type: ConsolidationType;

  // Route
  origin_port: string;
  destination_port: string;
  transport_mode: "sea" | "air";

  // Capacity & Load
  total_capacity_cbm?: number;
  total_capacity_kg?: number;
  current_load_cbm: number;
  current_load_kg: number;

  // Dates
  departure_date?: string;
  arrival_date?: string;
  deadline_date?: string;

  // Pricing
  price_per_cbm?: number;
  price_per_kg?: number;
  min_cbm: number;
  currency: string;

  // Metadata
  title?: string;
  description?: string;
  services_requested?: string[];
  status: ConsolidationStatus;

  created_at: string;
  updated_at: string;

  // Joined Profile (for display)
  initiator?: {
    company_name?: string;
    email: string;
    rating?: number;
  };
}

export interface CreateConsolidationData {
  type: ConsolidationType;
  origin_port: string;
  destination_port: string;
  transport_mode: "sea" | "air";

  total_capacity_cbm?: number;
  total_capacity_kg?: number;

  departure_date?: string;
  arrival_date?: string;
  deadline_date?: string;

  price_per_cbm?: number;
  price_per_kg?: number;
  min_cbm?: number;
  currency?: string;

  title?: string;
  description?: string;
  services_requested?: string[];
}

export interface ConsolidationFilters {
  type?: ConsolidationType;
  origin_port?: string;
  destination_port?: string;
  transport_mode?: "sea" | "air";
  status?: ConsolidationStatus;
}
