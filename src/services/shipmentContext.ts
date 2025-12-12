import { supabase } from "../lib/supabase";

export const shipmentContext = {
    /**
     * Fetch active shipments for a user and format them as a context string for the AI.
     * @param userId The ID of the authenticated user
     * @returns A string describing the user's active shipments, or an empty string if none found.
     */
    getActiveShipmentsContext: async (userId: string): Promise<string> => {
        try {
            const { data: shipments, error } = await supabase
                .from("shipments")
                .select(`
          tracking_number,
          origin_port,
          destination_port,
          status,
          arrival_estimated_date,
          cargo_type
        `)
                .eq("client_id", userId)
                .in("status", ["pending", "picked_up", "in_transit", "customs"])
                .order("created_at", { ascending: false })
                .limit(3);

            if (error) {
                console.error("Error fetching shipment context:", error);
                return "";
            }

            if (!shipments || shipments.length === 0) {
                return "";
            }

            let context = "\n\n[CONTEXTE EXPÉDITIONS UTILISATEUR]\n";
            context += "L'utilisateur a les expéditions actives suivantes. Utilise ces infos pour répondre précisément :\n";

            shipments.forEach((shipment) => {
                context += `- Colis ${shipment.tracking_number} (${shipment.cargo_type}) : De ${shipment.origin_port} vers ${shipment.destination_port}. Statut : ${shipment.status}. Arrivée prévue le : ${shipment.arrival_estimated_date || "Non définie"}.\n`;
            });

            return context;
        } catch (err) {
            console.error("Unexpected error in shipment context:", err);
            return "";
        }
    },
};
