export interface AutomationSettings {
    auto_quote_enabled: boolean;
    smart_closure_enabled: boolean;
    delivery_feedback_enabled: boolean;
    invoice_reminder_enabled?: boolean;
    weather_alert_enabled?: boolean;
    ticket_auto_ack_enabled?: boolean;
    shipment_update_enabled?: boolean;
    whatsapp_enabled?: boolean;
    // Array of feature keys that are disabled by admin
    // e.g. ['auto_quote', 'smart_closure']
    admin_disabled: string[];
}

export interface Profile {
    id: string;
    email: string;
    role: "client" | "forwarder" | "admin" | "driver" | "super-admin";
    full_name?: string;
    company_name?: string;
    phone?: string;
    address?: string;
    country?: string;
    avatar_url?: string;
    website_url?: string;
    friendly_id?: string;
    account_status?: "active" | "suspended" | "inactive" | "banned" | "pending_approval";
    // Specific fields
    transport_modes?: string[];
    kyc_status?: "pending" | "approved" | "rejected" | "verified";
    client_tier?: "standard" | "premium" | "enterprise";
    trial_ends_at?: string; // ISO Date string
    tier?: "Bronze" | "Silver" | "Gold" | "Platinum"; // Legacy/Loyalty tier
    loyalty_points?: number;

    // New settings field
    automation_settings?: AutomationSettings;

    // Referral System
    referral_code?: string;
    referral_points?: number;
    is_founder?: boolean;

    subscription_status?: "active" | "inactive" | "past_due" | "canceled";

    // Staff / Sub-account fields
    staff_role_id?: string;
    staff_role?: {
        id: string;
        name: string;
        permissions: string[];
        role_family?: string;
    };

    created_at?: string;
    updated_at?: string;
}
