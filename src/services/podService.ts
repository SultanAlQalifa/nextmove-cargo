import { supabase } from "../lib/supabase";

export interface POD {
  id: string;
  shipment_id: string;
  tracking_number: string;
  status: "pending" | "verified" | "rejected";
  submitted_at: string;
  verified_at?: string;
  forwarder: {
    id: string;
    name: string;
  };
  client: {
    id: string;
    name: string;
  };
  documents: {
    url: string;
    name: string;
    type: string;
  }[];
  notes?: string;
}

export const podService = {
  getPODs: async (): Promise<POD[]> => {
    const { data, error } = await supabase
      .from("pods")
      .select(
        `
                *,
                shipment:shipments(
                    id,
                    tracking_number,
                    forwarder:profiles!forwarder_id(id, company_name),
                    client:profiles!client_id(id, company_name)
                )
            `,
      )
      .order("submitted_at", { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDbPODToApp);
  },

  getForwarderPODs: async (): Promise<POD[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("pods")
      .select(
        `
                *,
                shipment:shipments!inner(
                    id,
                    tracking_number,
                    forwarder_id,
                    forwarder:profiles!forwarder_id(id, company_name),
                    client:profiles!client_id(id, company_name)
                )
            `,
      )
      .eq("shipment.forwarder_id", user.id)
      .order("submitted_at", { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDbPODToApp);
  },

  reviewPOD: async (
    id: string,
    status: "verified" | "rejected",
    notes?: string,
  ): Promise<void> => {
    const updates: any = { status, notes };
    if (status === "verified") {
      updates.verified_at = new Date().toISOString();
    }

    const { error } = await supabase.from("pods").update(updates).eq("id", id);

    if (error) throw error;
  },
};

function mapDbPODToApp(dbRecord: any): POD {
  return {
    id: dbRecord.id,
    shipment_id: dbRecord.shipment_id,
    tracking_number:
      dbRecord.tracking_number || dbRecord.shipment?.tracking_number,
    status: dbRecord.status,
    submitted_at: dbRecord.submitted_at,
    verified_at: dbRecord.verified_at,
    forwarder: {
      id: dbRecord.shipment?.forwarder?.id,
      name: dbRecord.shipment?.forwarder?.company_name || "Unknown",
    },
    client: {
      id: dbRecord.shipment?.client?.id,
      name: dbRecord.shipment?.client?.company_name || "Unknown",
    },
    documents: dbRecord.documents || [],
    notes: dbRecord.notes,
  };
}
