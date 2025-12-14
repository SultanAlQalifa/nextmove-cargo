import { supabase } from "../lib/supabase";
import {
  Consolidation,
  CreateConsolidationData,
  ConsolidationBookingData,
  ConsolidationFilters,
} from "../types/consolidation";

export const consolidationService = {
  async getConsolidations(filters: ConsolidationFilters = {}) {
    let query = supabase
      .from("consolidations")
      .select(
        `
                *,
                initiator:profiles(company_name, email)
            `,
      )
      .order("created_at", { ascending: false });

    if (filters.type) {
      query = query.eq("type", filters.type);
    }
    if (filters.origin_port) {
      query = query.eq("origin_port", filters.origin_port);
    }
    if (filters.destination_port) {
      query = query.eq("destination_port", filters.destination_port);
    }
    if (filters.transport_mode) {
      query = query.eq("transport_mode", filters.transport_mode);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    } else {
      // Default to showing open consolidations if no status specified
      query = query.in("status", ["open", "closing_soon", "full"]);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Consolidation[];
  },

  async adminGetConsolidations() {
    const { data, error } = await supabase
      .from("consolidations")
      .select(
        `
          *,
          initiator:profiles(company_name, email),
          shipments(forwarder_id)
        `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return data.map((c: any) => {
      // Safely handle if shipment is array or null
      const linkedShipment = Array.isArray(c.shipments) ? c.shipments[0] : c.shipments;
      return {
        ...c,
        linked_shipment_forwarder_id: linkedShipment?.forwarder_id || null
      };
    });
  },

  async getMyConsolidations(userId: string) {
    const { data, error } = await supabase
      .from("consolidations")
      .select("*")
      .eq("initiator_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Consolidation[];
  },

  async createConsolidation(data: CreateConsolidationData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // Ensure profile exists to avoid foreign key constraint error
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      // Create missing profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || "client",
        full_name: user.user_metadata?.full_name || "User",
      });

      if (profileError) {
        console.error("Error creating missing profile:", profileError);
      }
    }

    const { data: newConsolidation, error } = await supabase
      .from("consolidations")
      .insert([{ ...data, initiator_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return newConsolidation as Consolidation;
  },

  async updateConsolidation(id: string, updates: Partial<Consolidation>) {
    const { data, error } = await supabase
      .from("consolidations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Consolidation;
  },

  async deleteConsolidation(id: string) {
    const { error } = await supabase
      .from("consolidations")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async bulkCreateConsolidations(data: CreateConsolidationData[]) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const consolidations = data.map((item) => ({
      ...item,
      initiator_id: user.id,
    }));

    const { error } = await supabase
      .from("consolidations")
      .insert(consolidations);

    if (error) throw error;
  },

  async bookConsolidationSlot(booking: ConsolidationBookingData) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // 1. Get Consolidation
    const { data: consolidation, error: consError } = await supabase
      .from("consolidations")
      .select("*")
      .eq("id", booking.consolidation_id)
      .single();

    if (consError || !consolidation) throw new Error("Consolidation introuvable");

    // 2. Generate Tracking Number (Simple client-side generation for now)
    const trackingNumber = `GRP-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;

    // 3. Create Shipment
    const { data: shipment, error: shipError } = await supabase
      .from("shipments")
      .insert({
        tracking_number: trackingNumber,
        client_id: user.id,
        // Only assign forwarder if it's a forwarder offer. 
        // For client requests, it stays null until a forwarder claims it.
        forwarder_id: consolidation.type === 'forwarder_offer' ? consolidation.initiator_id : null,
        consolidation_id: consolidation.id,
        origin_port: consolidation.origin_port,
        destination_port: consolidation.destination_port,
        cargo_weight: booking.weight_kg,
        cargo_volume: booking.volume_cbm,
        cargo_type: booking.goods_nature,
        status: "pending",
        // Financials would go here if columns avail, otherwise handled by future update
      })
      .select()
      .single();

    if (shipError) {
      console.error("Booking Error:", shipError);
      throw new Error("Erreur lors de la création de l'expédition");
    }

    // 4. Update Load
    await supabase
      .from("consolidations")
      .update({
        current_load_cbm: (consolidation.current_load_cbm || 0) + Number(booking.volume_cbm),
        current_load_kg: (consolidation.current_load_kg || 0) + Number(booking.weight_kg),
      })
      .eq("id", consolidation.id);

    return shipment;
  },

  async claimConsolidation(consolidationId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    // 1. Find the shipment linked to this consolidation (the client's request payload)
    const { data: shipment, error: findError } = await supabase
      .from("shipments")
      .select("*")
      .eq("consolidation_id", consolidationId)
      .is("forwarder_id", null) // It should be unassigned
      .single();

    if (findError || !shipment) {
      throw new Error("Cette demande n'est plus disponible ou a déjà été prise en charge.");
    }

    // 2. Assign to Forwarder
    const { error: updateError } = await supabase
      .from("shipments")
      .update({ forwarder_id: user.id, status: 'pending' }) // Update status if needed
      .eq("id", shipment.id);

    if (updateError) throw updateError;

    // 3. Update Consolidation status? 
    // Maybe mark it as "assigned" or leave as open but now it effectively belongs to the forwarder?
    // Since it's a 1-to-1 mapping for the "Request", we can mark it as closed for other forwarders?
    await supabase
      .from("consolidations")
      .update({ status: 'full' }) // Effectively "Sold"
      .eq("id", consolidationId);

    return shipment;
  },

  async adminAssignForwarder(consolidationId: string, forwarderId: string) {
    // 1. Find the shipment linked to this consolidation
    const { data: shipment, error: findError } = await supabase
      .from("shipments")
      .select("*")
      .eq("consolidation_id", consolidationId)
      .single();

    if (findError || !shipment) {
      throw new Error("Shipment not found for this consolidation");
    }

    // 2. Update Shipment
    const { error: updateError } = await supabase
      .from("shipments")
      .update({ forwarder_id: forwarderId, status: 'pending' })
      .eq("id", shipment.id);

    if (updateError) throw updateError;

    // 3. Update Consolidation
    await supabase
      .from("consolidations")
      .update({ status: 'full' })
      .eq("id", consolidationId);

    return shipment;
  }
};
