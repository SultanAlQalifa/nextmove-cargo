// ═══════════════════════════════════════════════════════════════
// NextMove Cargo - RFQ System Types
// ═══════════════════════════════════════════════════════════════

export type RFQStatus =
  | "draft"
  | "published"
  | "offers_received"
  | "offer_accepted"
  | "rejected"
  | "expired"
  | "cancelled";

export type TransportMode = "sea" | "air";
export type ServiceType = "standard" | "express";

export type OfferStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "expired";

export type ServiceNeeded =
  | "door_to_door"
  | "insurance"
  | "packaging"
  | "storage"
  | "priority"
  | "inspection";

// ═══ RFQ REQUEST ═══

export interface RFQRequest {
  id: string;
  client_id: string;

  // Route & Cargo
  origin_port: string;
  destination_port: string;
  cargo_type: string;
  cargo_description?: string;

  // Dimensions & Weight
  weight_kg?: number;
  volume_cbm?: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  quantity: number;

  // Transport Preferences
  transport_mode: TransportMode;
  service_type: ServiceType;
  preferred_departure_date?: string; // ISO date
  required_delivery_date?: string; // ISO date

  // Budget & Services
  budget_amount?: number;
  budget_currency: string;
  services_needed?: ServiceNeeded[];
  special_requirements?: string;

  // Payment & Retry Logic
  payment_method?: "online" | "on_delivery";
  parent_rfq_id?: string;
  is_retry?: boolean;

  // Targeting
  specific_forwarder_id?: string;

  // Status & Metadata
  status: RFQStatus;
  expires_at?: string; // ISO datetime
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
  offers_count?: number;
}

export interface CreateRFQData {
  // Route & Cargo
  origin_port: string;
  destination_port: string;
  cargo_type: string;
  cargo_description?: string;

  // Dimensions & Weight
  weight_kg?: number;
  volume_cbm?: number;
  length_cm?: number;
  width_cm?: number;
  height_cm?: number;
  quantity?: number;

  // Transport Preferences
  transport_mode: TransportMode;
  service_type: ServiceType;
  preferred_departure_date?: string;
  required_delivery_date?: string;

  // Budget & Services
  budget_amount?: number;
  budget_currency?: string;
  services_needed?: ServiceNeeded[];
  special_requirements?: string;

  // Payment & Retry Logic
  payment_method?: "online" | "on_delivery";
  parent_rfq_id?: string;
  is_retry?: boolean;

  // Targeting
  specific_forwarder_id?: string;
}

export interface RFQFilters {
  status?: RFQStatus | RFQStatus[];
  transport_mode?: TransportMode;
  service_type?: ServiceType;
  origin_port?: string;
  destination_port?: string;
  date_from?: string;
  date_to?: string;
}

// ═══ RFQ OFFER ═══

export interface RFQOffer {
  id: string;
  rfq_id: string;
  forwarder_id: string;

  // Pricing Breakdown
  base_price: number;
  insurance_price: number;
  door_to_door_price: number;
  packaging_price: number;
  storage_price: number;
  tax_price: number; // Added tax price
  other_fees: number;
  other_fees_description?: string;
  total_price: number;
  currency: string;

  // Transit Information
  estimated_transit_days: number;
  departure_date?: string; // ISO date
  arrival_date?: string; // ISO date

  // Services & Conditions
  services_included?: string[];
  services_optional?: Record<string, number>; // {service_name: price}
  terms_and_conditions?: string;
  validity_days: number;

  // Communication
  message_to_client?: string;

  // Status & Metadata
  status: OfferStatus;
  submitted_at: string; // ISO datetime
  expires_at?: string; // ISO datetime
  accepted_at?: string; // ISO datetime
  rejected_at?: string; // ISO datetime
  rejected_reason?: string;
}

export interface CreateOfferData {
  rfq_id: string;

  // Pricing Breakdown
  base_price: number;
  insurance_price?: number;
  door_to_door_price?: number;
  packaging_price?: number;
  storage_price?: number;
  tax_price?: number; // Added tax price
  other_fees?: number;
  other_fees_description?: string;
  total_price: number;
  currency?: string;

  // Transit Information
  estimated_transit_days: number;
  departure_date?: string;
  arrival_date?: string;

  // Services & Conditions
  services_included?: string[];
  services_optional?: Record<string, number>;
  terms_and_conditions?: string;
  validity_days?: number;

  // Communication
  message_to_client?: string;
}

export interface OfferFilters {
  status?: OfferStatus | OfferStatus[];
  rfq_id?: string;
  forwarder_id?: string;
  date_from?: string;
  date_to?: string;
}

// ═══ COMBINED TYPES ═══

export interface RFQWithOffers extends RFQRequest {
  offers: OfferWithForwarder[];
  offers_count: number;
}

export interface OfferWithRFQ extends RFQOffer {
  rfq: RFQRequest;
}

export interface OfferWithForwarder extends RFQOffer {
  forwarder: {
    id: string;
    company_name?: string;
    full_name?: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    rating?: number;
    total_shipments?: number;
    transport_modes?: string[];
    kyc_status?: "pending" | "approved" | "rejected" | "verified";
  };
}

export interface RFQWithClient extends RFQRequest {
  client: {
    id: string;
    full_name?: string;
    company_name?: string;
    email: string;
    phone?: string;
  };
}
