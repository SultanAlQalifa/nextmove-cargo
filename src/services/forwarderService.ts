import { supabase } from "../lib/supabase";

export interface ForwarderProfile {
  id: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  country: string;
  full_name?: string;
  kyc_status: "pending" | "verified" | "rejected" | "unverified";
  subscription_status: "active" | "inactive" | "past_due" | "canceled";
  documents: {
    id: string;
    name: string;
    type: string;
    url: string;
    status: "pending" | "approved" | "rejected";
  }[];
  joined_at: string;
  isFeatured?: boolean;
  isPromoted?: boolean;
  website_url?: string;
  avatar_url?: string;
  rating?: number;
  review_count?: number;
}

export interface ForwarderOption {
  id: string;
  name: string;
  website_url?: string;
  logo?: string;
  rating?: number;
  review_count?: number;
}

export const forwarderService = {
  /**
   * Get all forwarders (Admin only)
   */
  getForwarders: async (): Promise<ForwarderProfile[]> => {
    console.log("forwarderService: Fetching profiles with role='forwarder'...");
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
                *,
                documents:forwarder_documents(*)
            `,
      )
      .eq("role", "forwarder")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("forwarderService: Error fetching forwarders:", error);
      throw error;
    }

    console.log("forwarderService: Raw data received from DB:", data);
    console.log("forwarderService: Row count:", data?.length || 0);

    return (data || []).map(mapDbForwarderToApp);
  },

  /**
   * Get all active and verified forwarders (For clients/public)
   */
  getAllActiveForwarders: async (): Promise<ForwarderOption[]> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, company_name, full_name, website_url, avatar_url, rating, review_count")
      .eq("role", "forwarder")
      .eq("account_status", "active")
      .order("company_name");

    if (error) throw error;

    return (data || []).map((f) => ({
      id: f.id,
      name: f.company_name || f.full_name || "Prestataire Inconnu",
      website_url: f.website_url,
      logo: f.avatar_url,
      rating: f.rating || 0,
      review_count: f.review_count || 0,
    }));
  },

  /**
   * Update forwarder verification status
   */
  updateStatus: async (
    id: string,
    status: "verified" | "rejected",
  ): Promise<void> => {
    const { error } = await supabase
      .from("profiles")
      .update({ kyc_status: status })
      .eq("id", id);

    if (error) throw error;
  },

  verifyAllDocuments: async (forwarderId: string): Promise<void> => {
    const { error } = await supabase
      .from("forwarder_documents")
      .update({ status: "verified" })
      .eq("forwarder_id", forwarderId);

    if (error) throw error;
  },

  /**
   * Suspend a forwarder account
   */
  suspendForwarder: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_status: "canceled" })
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Deactivate a forwarder account (Soft delete/Hide)
   */
  deactivateForwarder: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_status: "inactive" })
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Activate a forwarder account
   */
  activateForwarder: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_status: "active" })
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Delete a forwarder (Hard delete - Use with caution)
   */
  deleteForwarder: async (id: string): Promise<void> => {
    // Note: This might fail if there are foreign key constraints (shipments, offers, etc.)
    // Ideally, we should use deactivateForwarder instead.
    const { error } = await supabase.from("profiles").delete().eq("id", id);

    if (error) throw error;
  },

  /**
   * Update forwarder profile details
   */
  updateForwarder: async (
    id: string,
    data: Partial<ForwarderProfile>,
  ): Promise<void> => {
    // Extract only the fields that belong to the profiles table
    const { documents, ...profileData } = data as any;

    const { error } = await supabase
      .from("profiles")
      .update(profileData)
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Invite a new forwarder (Mock for now - usually involves Auth API)
   */
  inviteForwarder: async (_email: string): Promise<void> => {
    // In a real app, this would call a Supabase Edge Function to send an invite email
    // or use supabase.auth.admin.inviteUserByEmail()

    await new Promise((resolve) => setTimeout(resolve, 1000));
  },

  /**
   * Upload a document for a forwarder
   */
  uploadDocument: async (
    forwarderId: string,
    file: File,
    type: string,
  ): Promise<void> => {
    // 1. Upload file to Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${forwarderId}/${type}_${Date.now()}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("forwarder-documents")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Get Public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("forwarder-documents").getPublicUrl(filePath);

    // 3. Create record in forwarder_documents table
    // Check if document of this type already exists to update it or insert new
    const { data: existingDoc } = await supabase
      .from("forwarder_documents")
      .select("id")
      .eq("forwarder_id", forwarderId)
      .eq("document_type", type)
      .maybeSingle();

    if (existingDoc) {
      const { error: updateError } = await supabase
        .from("forwarder_documents")
        .update({
          document_url: publicUrl,
          status: "pending", // Reset status on new upload
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingDoc.id);

      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabase
        .from("forwarder_documents")
        .insert({
          forwarder_id: forwarderId,
          document_type: type,
          document_url: publicUrl,
          status: "pending",
        });

      if (insertError) throw insertError;
    }
  },

  /**
   * Get documents for a forwarder
   */
  getDocuments: async (forwarderId: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from("forwarder_documents")
      .select("*")
      .eq("forwarder_id", forwarderId);

    if (error) throw error;

    // Map DB fields to App interface
    return (data || []).map((doc) => ({
      id: doc.id,
      name: doc.document_type, // Map document_type to name for frontend matching
      url: doc.document_url, // Map document_url to url
      status: doc.status,
      updated_at: doc.updated_at,
    }));
  },

  // Rates Management
  addRate: async (rate: Omit<Rate, "id">): Promise<Rate> => {
    const { data, error } = await supabase
      .from("forwarder_rates")
      .insert(rate)
      .select()
      .single();

    if (error) throw error;
    return mapDbRateToApp(data);
  },

  getRates: async (forwarderId: string): Promise<Rate[]> => {
    const { data, error } = await supabase
      .from("forwarder_rates")
      .select("*")
      .eq("forwarder_id", forwarderId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDbRateToApp);
  },

  updateRate: async (id: string, updates: Partial<Rate>): Promise<Rate> => {
    const { data, error } = await supabase
      .from("forwarder_rates")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapDbRateToApp(data);
  },

  deleteRate: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("forwarder_rates")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};

export interface Rate {
  id: string;
  forwarder_id: string;
  origin_country: string;
  destination_country: string;
  transport_mode: "sea" | "air" | "road" | "rail";
  service_type: "FCL" | "LCL" | "Express" | "Standard";
  min_quantity: number;
  max_quantity: number;
  price: number;
  currency: string;
  unit: string; // kg, cbm, container
  transit_time_min?: number;
  transit_time_max?: number;
}

function mapDbRateToApp(dbRecord: any): Rate {
  return {
    id: dbRecord.id,
    forwarder_id: dbRecord.forwarder_id,
    origin_country: dbRecord.origin_country,
    destination_country: dbRecord.destination_country,
    transport_mode: dbRecord.transport_mode,
    service_type: dbRecord.service_type,
    min_quantity: dbRecord.min_quantity,
    max_quantity: dbRecord.max_quantity,
    price: dbRecord.price,
    currency: dbRecord.currency,
    unit: dbRecord.unit,
    transit_time_min: dbRecord.transit_time_min,
    transit_time_max: dbRecord.transit_time_max,
  };
}

// Helper to map DB structure to App interface
function mapDbForwarderToApp(dbRecord: any): ForwarderProfile {
  return {
    id: dbRecord.id,
    company_name: dbRecord.company_name,
    full_name: dbRecord.full_name,
    email: dbRecord.email,
    phone: dbRecord.phone || "",
    address: dbRecord.address || "",
    country: dbRecord.country || "",
    kyc_status: dbRecord.kyc_status || dbRecord.verification_status || "pending",
    subscription_status: dbRecord.subscription_status || dbRecord.account_status || "inactive",
    documents: dbRecord.documents || [],
    joined_at: dbRecord.created_at,
    isFeatured: dbRecord.is_featured,
    isPromoted: dbRecord.is_promoted,
    website_url: dbRecord.website_url,
    avatar_url: dbRecord.avatar_url,
    rating: dbRecord.rating || 0,
    review_count: dbRecord.review_count || 0,
  };
}
