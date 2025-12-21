import { supabase } from "../lib/supabase";
import { fetchWithRetry } from "../utils/supabaseHelpers";
import { notificationService } from "./notificationService";
import { automationService } from "./automationService";

export interface ShipmentEvent {
  id: string;
  status:
  | "pending"
  | "pending_payment"
  | "paid"
  | "picked_up"
  | "in_transit"
  | "customs"
  | "delivered"
  | "cancelled";
  location: string;
  timestamp: string;
  description: string;
}

export interface ShipmentDocument {
  id: string;
  shipment_id: string;
  name: string;
  type: string;
  url: string;
  uploaded_by: string;
  created_at: string;
}


export interface Shipment {
  id: string;
  tracking_number: string;
  rfq_id?: string;
  transport_mode: "sea" | "air";
  service_type: "standard" | "express";
  price: number;
  origin: {
    port: string;
    country: string;
  };
  destination: {
    port: string;
    country: string;
  };
  status:
  | "pending"
  | "pending_payment"
  | "paid"
  | "picked_up"
  | "in_transit"
  | "customs"
  | "delivered"
  | "cancelled"
  | "completed";
  carrier: {
    name: string;
    logo?: string;
  };
  client?: {
    id: string;
    full_name?: string;
    phone?: string;
    email?: string;
  };
  cargo: {
    type: string;
    weight: number;
    volume: number;
    packages: number;
    type_description?: string;
  };
  dates: {
    departure: string;
    arrival_estimated: string;
    arrival_actual?: string;
  };
  progress: number; // 0-100
  events: ShipmentEvent[];
  created_at?: string;
  payment?: {
    amount: number;
    amount_forwarder?: number;
    status: string;
  }[];
  children?: Shipment[];
}

// ... (rest of the file remains same until mapDbShipmentToApp)

// Helper to map DB structure to App interface
function mapDbShipmentToApp(dbRecord: any): Shipment {
  return {
    id: dbRecord.id,
    tracking_number: dbRecord.tracking_number,
    rfq_id: dbRecord.rfq_id,
    transport_mode: dbRecord.transport_mode || "sea",
    service_type: dbRecord.service_type || "standard",
    price: dbRecord.price || 0,
    origin: {
      port: dbRecord.origin_port,
      country: dbRecord.origin_country || "XX",
    },
    destination: {
      port: dbRecord.destination_port,
      country: dbRecord.destination_country || "XX",
    },
    status: dbRecord.status,
    carrier: {
      name: dbRecord.carrier_name || dbRecord.forwarder?.company_name || "Pending",
      logo: dbRecord.carrier_logo,
    },
    cargo: {
      type: dbRecord.cargo_type || "General",
      weight: dbRecord.cargo_weight || 0,
      volume: dbRecord.cargo_volume || 0,
      packages: dbRecord.cargo_packages || 0,
    },
    dates: {
      departure: dbRecord.departure_date,
      arrival_estimated: dbRecord.arrival_estimated_date,
      arrival_actual: dbRecord.arrival_actual_date,
    },
    progress: dbRecord.progress || 0,
    events: (dbRecord.events || []).sort(
      (a: any, b: any) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    ),
    created_at: dbRecord.created_at,
    payment: dbRecord.payment || [],
    client: dbRecord.client
      ? {
        id: dbRecord.client.id,
        full_name: dbRecord.client.full_name,
        phone: dbRecord.client.phone,
        email: dbRecord.client.email,
      }
      : undefined,
    children: (dbRecord.children || []).map(mapDbShipmentToApp),
  };
}

// ... (rest of the file remains same until mapDbShipmentToApp)

// Helper to generate secure tracking number
export const generateTrackingNumber = (): string => {
  const prefix = "NMC";
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

export const shipmentService = {
  /**
   * Create shipment from payment transaction
   */
  createShipmentFromPayment: async (transactionId: string): Promise<Shipment | null> => {
    // Mock implementation to satisfy interface requirement for now
    // In real scenario, this would extract metadata from transaction to build shipment

    return null;
  },
  /**
   * Get all shipments for the current client
   */
  getClientShipments: async (): Promise<Shipment[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    try {
      const data = await fetchWithRetry<any[]>(() =>
        supabase
          .from("shipments")
          .select(
            `
                        *,
                        events:shipment_events(*),
                        payment:transactions(*),
                        forwarder:profiles!forwarder_id(company_name)
            `,
          )
          .eq("client_id", user.id)
          .order("created_at", { ascending: false }),
      );

      return (data || []).map(mapDbShipmentToApp);
    } catch (error) {
      console.error("Error fetching client shipments:", error);
      throw error;
    }
  },

  /**
   * Get a single shipment by ID
   */
  getShipmentById: async (id: string): Promise<Shipment | undefined> => {
    try {
      const data = await fetchWithRetry<any>(() =>
        supabase
          .from("shipments")
          .select(
            `
          *,
            events: shipment_events(*),
            payment: transactions(*),
            children: shipments!parent_shipment_id(*)
              `,
          )
          .eq("id", id)
          .single(),
      );

      if (!data) return undefined;
      return mapDbShipmentToApp(data);
    } catch (error) {
      console.error("Error fetching shipment by ID:", error);
      return undefined;
    }
  },

  /**
   * Get shipment by RFQ ID
   */
  getShipmentByRfqId: async (rfqId: string): Promise<Shipment | undefined> => {
    try {
      const data = await fetchWithRetry<any>(() =>
        supabase
          .from("shipments")
          .select("id, status")
          .eq("rfq_id", rfqId)
          .maybeSingle(),
      );

      if (!data) return undefined;
      // We only need basic info for the link, but mapping full object is safer if we expand usage
      // However, we only selected id and status to be efficient.
      // Let's just return a partial object or cast it if acceptable, 
      // or fetch full if we want to be consistent. 
      // Fetching full to reuse mapDbShipmentToApp safely.
      const fullData = await fetchWithRetry<any>(() =>
        supabase
          .from("shipments")
          .select(
            `
          *,
            events: shipment_events(*),
            payment: transactions(*),
            children: shipments!parent_shipment_id(*)
              `,
          )
          .eq("rfq_id", rfqId)
          .single(),
      );

      return mapDbShipmentToApp(fullData);
    } catch (error) {
      console.error("Error fetching shipment by RFQ ID:", error);
      return undefined;
    }
  },

  /**
   * Get all shipments for the current forwarder
   */
  getForwarderShipments: async (): Promise<Shipment[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    try {
      const data = await fetchWithRetry<any[]>(() =>
        supabase
          .from("shipments")
          .select(
            `
          *,
            events: shipment_events(*),
            payment: transactions(*),
            client: profiles!client_id(id, full_name, phone, email)
              `,
          )
          .eq("forwarder_id", user.id)
          .order("created_at", { ascending: false }),
      );

      return (data || []).map(mapDbShipmentToApp);
    } catch (error) {
      console.error("Error fetching forwarder shipments:", error);
      throw error;
    }
  },

  /**
   * Assign a driver to a shipment (Mock implementation for now as Driver system is separate)
   */
  assignDriver: async (shipmentId: string, _driverId: string): Promise<void> => {
    try {
      // We can simulate an event update
      // Using straight await here as standard try/catch is enough for writes
      const { error } = await supabase.from("shipment_events").insert({
        shipment_id: shipmentId,
        status: "in_transit",
        location: "Warehouse",
        description: "Chauffeur assigné pour enlèvement",
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error assigning driver:", error);
      throw error;
    }
  },

  /**
   * Get shipments assigned to a specific driver
   */
  getShipmentsForDriver: async (_driverId: string): Promise<Shipment[]> => {
    try {
      const data = await fetchWithRetry<any[]>(() =>
        supabase
          .from("shipments")
          .select(
            `
          *,
            events: shipment_events(*)
            `,
          )
          // .eq('driver_id', driverId) // Uncomment when column exists
          .limit(5),
      );

      return (data || []).map(mapDbShipmentToApp);
    } catch (error) {
      console.error("Error fetching driver shipments:", error);
      throw error;
    }
  },

  /**
   * Submit Proof of Delivery
   */
  submitPOD: async (podData: {
    shipment_id: string;
    photo_urls: string[];
    recipient_name: string;
    delivered_at: string;
    latitude: number;
    longitude: number;
    driver_notes?: string;
  }): Promise<void> => {
    try {
      // 1. Update shipment status to delivered
      const { error: shipmentError } = await supabase
        .from("shipments")
        .update({ status: "delivered" })
        .eq("id", podData.shipment_id);

      if (shipmentError) throw shipmentError;

      // 2. Create POD record (assuming a 'pods' table exists, or just log event)
      const { error: eventError } = await supabase
        .from("shipment_events")
        .insert({
          shipment_id: podData.shipment_id,
          status: "delivered",
          location: `Lat: ${podData.latitude}, Lng: ${podData.longitude}`,
          description: `Livré à ${podData.recipient_name}.Notes: ${podData.driver_notes || "Aucune"}`,
        });

      if (eventError) throw eventError;
    } catch (error) {
      console.error("Error submitting POD:", error);
      throw error;
    }
  },

  /**
   * Create a new shipment
   */
  /**
   * Create a new shipment
   */
  createShipment: async (shipmentData: any): Promise<Shipment> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    try {
      // Generate tracking number if not provided
      const trackingNumber = shipmentData.tracking_number || generateTrackingNumber();

      const dataToInsert = {
        tracking_number: trackingNumber,
        client_id: shipmentData.client_id || user.id,
        forwarder_id: user.id,
        origin_port: shipmentData.origin_port || "",
        origin_country: shipmentData.origin_country || "CN",
        destination_port: shipmentData.destination_port || "",
        destination_country: shipmentData.destination_country || "SN",
        carrier_name: shipmentData.carrier_name,
        transport_type: shipmentData.transport_mode || "sea",
        transport_mode: shipmentData.transport_mode || "sea",
        service_type: shipmentData.service_type || "standard",
        price: shipmentData.price || 0,
        cargo_type: shipmentData.cargo_type,
        cargo_packages: shipmentData.cargo_packages || 0,
        cargo_weight: shipmentData.cargo_weight,
        cargo_volume: shipmentData.cargo_volume,
        departure_date: shipmentData.departure_date || null,
        arrival_estimated_date: shipmentData.arrival_estimated_date || null,
        parent_shipment_id: shipmentData.parent_shipment_id || null,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("shipments")
        .insert(dataToInsert)
        .select()
        .single();

      if (error) throw error;

      // Log initial creation event
      await supabase.from("shipment_events").insert({
        shipment_id: data.id,
        status: 'pending',
        location: data.origin_country || 'Origin',
        description: 'Expédition créée',
        timestamp: new Date().toISOString()
      });

      if (user.id !== dataToInsert.client_id) {
        import("./connectionService").then(({ connectionService }) => {
          connectionService.ensureConnection(user.id, dataToInsert.client_id);
        });
      }

      return mapDbShipmentToApp(data);
    } catch (error) {
      console.error("Error creating shipment:", error);
      throw error;
    }
  },

  /**
   * Bulk create shipments
   */
  bulkCreateShipments: async (shipmentsData: any[]): Promise<void> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    try {
      const dataToInsert = shipmentsData.map((s) => ({
        ...s,
        tracking_number: s.tracking_number || generateTrackingNumber(),
        forwarder_id: user.id,
        status: "pending",
        created_at: new Date().toISOString(),
      }));

      const { error } = await supabase.from("shipments").insert(dataToInsert);

      if (error) throw error;
    } catch (error) {
      console.error("Error bulk creating shipments:", error);
      throw error;
    }
  },

  /**
   * Update a shipment
   */
  updateShipment: async (
    id: string,
    updates: Partial<Shipment>,
    note?: string
  ): Promise<Shipment> => {
    try {
      const dbUpdates: any = {};

      if (updates.status) dbUpdates.status = updates.status;
      if (updates.transport_mode) {
        dbUpdates.transport_mode = updates.transport_mode;
        dbUpdates.transport_type = updates.transport_mode;
      }
      if (updates.service_type) dbUpdates.service_type = updates.service_type;
      if (updates.carrier?.name) dbUpdates.carrier_name = updates.carrier.name;
      if (updates.price !== undefined) dbUpdates.price = updates.price;

      if (updates.cargo?.weight !== undefined) dbUpdates.cargo_weight = updates.cargo.weight;
      if (updates.cargo?.volume !== undefined) dbUpdates.cargo_volume = updates.cargo.volume;
      if (updates.cargo?.packages !== undefined) dbUpdates.cargo_packages = updates.cargo.packages;
      if (updates.cargo?.type) dbUpdates.cargo_type = updates.cargo.type;

      if (updates.dates?.departure) dbUpdates.departure_date = updates.dates.departure;
      if (updates.dates?.arrival_estimated) dbUpdates.arrival_estimated_date = updates.dates.arrival_estimated;
      if (updates.dates?.arrival_actual) dbUpdates.arrival_actual_date = updates.dates.arrival_actual;

      if (updates.origin?.port) dbUpdates.origin_port = updates.origin.port;
      if (updates.destination?.port) dbUpdates.destination_port = updates.destination.port;

      dbUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("shipments")
        .update(dbUpdates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Log Event if status changed
      if (updates.status) {
        await supabase.from("shipment_events").insert({
          shipment_id: id,
          status: updates.status,
          location: updates.origin?.country || 'System', // Ideal would be to pass location
          description: note || `Statut mis à jour vers ${updates.status}`,
          timestamp: new Date().toISOString()
        });
      }

      const updatedShipment = mapDbShipmentToApp(data);

      if (updates.status && updatedShipment.client?.phone) {
        supabase.functions
          .invoke("send-whatsapp", {
            body: {
              shipment_id: id,
              status: updates.status,
              client_phone: updatedShipment.client.phone,
              client_name: updatedShipment.client.full_name,
            },
          })
          .then(({ error }) => {
            if (error) console.warn("Failed to send WhatsApp notification:", error);
          })
          .catch((err) => {
            console.warn("Error triggering WhatsApp function:", err);
          });

        // Trigger SMS Notification
        supabase.functions
          .invoke("send-sms", {
            body: {
              to: updatedShipment.client.phone,
              content: `NextMove: Le statut de votre expédition #${updatedShipment.tracking_number} est passé à : ${updates.status.toUpperCase()}.`,
            },
          })
          .then(({ error }) => {
            if (error) console.warn("Failed to send SMS notification:", error);
          })
          .catch((err) => {
            console.warn("Error triggering SMS function:", err);
          });

        if (updatedShipment.client?.id) {
          notificationService.sendNotification(
            updatedShipment.client.id,
            `Mise à jour : #${updatedShipment.tracking_number}`,
            `Le statut de votre expédition est maintenant : ${updates.status}`,
            "shipment_update",
            `${window.location.origin}/dashboard/client/shipments`
          ).catch(err => console.error("Failed to send in-app notification", err));
        }
      }

      if (updates.status === "delivered" && updatedShipment.client?.id) {
        automationService.handleShipmentDelivery(id, updatedShipment.client.id);
      }

      return updatedShipment;
    } catch (error) {
      console.error("Error updating shipment:", error);
      throw error;
    }
  },

  /**
   * Delete a shipment (Only if status is pending)
   */
  deleteShipment: async (id: string): Promise<void> => {
    try {
      // 1. Verify status first (Double check server-side logic would be better but RLS handles auth, logic here handles business rule)
      const { data: shipment, error: fetchError } = await supabase
        .from("shipments")
        .select("status")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;
      if (!shipment) throw new Error("Expédition non trouvée");

      if (shipment.status !== "pending") {
        throw new Error(
          'Impossible de supprimer une expédition qui n\'est plus "En Attente".',
        );
      }

      // 2. Perform delete
      const { error: deleteError } = await supabase
        .from("shipments")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;
    } catch (error) {
      console.error("Error deleting shipment:", error);
      throw error;
    }
  },

  /**
   * Get all shipments (Admin only)
   */
  getAllShipments: async (): Promise<Shipment[]> => {
    try {
      const data = await fetchWithRetry<any[]>(() =>
        supabase
          .from("shipments")
          .select(
            `
          *,
            events: shipment_events(*),
            payment: transactions(*),
            client: profiles!client_id(id, full_name, phone, email)
            `,
          )
          .order("created_at", { ascending: false }),
      );

      return (data || []).map(mapDbShipmentToApp);
    } catch (error) {
      console.error("Error fetching all shipments:", error);
      throw error;
    }
  },

  /**
   * Get documents for a shipment
   */
  getDocuments: async (shipmentId: string): Promise<ShipmentDocument[]> => {
    try {
      const { data, error } = await supabase
        .from("shipment_documents")
        .select("*")
        .eq("shipment_id", shipmentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching documents:", error);
      return [];
    }
  },

  /**
   * Upload a document for a shipment
   */
  uploadDocument: async (
    shipmentId: string,
    file: File,
    type: string,
  ): Promise<ShipmentDocument | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${shipmentId}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Storage upload failed:", uploadError);
        // If bucket doesn't exist or RLS issues, we throw to inform user logic failed
        // rather than falling back to mock which mimics success deceptively.
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("documents")
        .getPublicUrl(filePath);

      // 3. Insert record
      const { data, error } = await supabase
        .from("shipment_documents")
        .insert({
          shipment_id: shipmentId,
          name: file.name,
          type: type,
          url: publicUrl,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error uploading document:", error);
      throw error;
    }
  },
};
