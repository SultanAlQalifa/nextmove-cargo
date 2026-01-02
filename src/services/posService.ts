import { supabase } from "../lib/supabase";
import { Shipment } from "./shipmentService";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export interface POSSession {
    id: string;
    station_id?: string;
    agent_id: string;
    opened_at: string;
    closed_at?: string;
    initial_cash: number;
    total_sales: number;
    status: 'open' | 'closed';
}

export const posService = {
    /**
     * Mock functionality for MVP Express
     * In a full implementation, this would hit the DB.
     */
    generateReceipt: (shipment: Shipment) => {
        const doc = new jsPDF({
            unit: "mm",
            format: [80, 200], // Standard thermal printer width
        });

        // Font setup
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("NEXTMOVE CARGO", 40, 10, { align: "center" });

        doc.setFontSize(10);
        doc.text("Reçu d'Expédition", 40, 16, { align: "center" });

        doc.setLineWidth(0.1);
        doc.line(5, 20, 75, 20);

        // Shipment Info
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(`N° Suivi: ${shipment.tracking_number}`, 5, 26);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 5, 31);
        doc.text(`Client: ${shipment.client?.full_name || "Client Passager"}`, 5, 36);

        doc.line(5, 40, 75, 40);

        // Cargo Details
        doc.text("DETAILS CARGAISON", 5, 45);
        doc.text(`Mode: ${shipment.transport_mode.toUpperCase()}`, 5, 50);
        doc.text(`Poids: ${shipment.cargo.weight} kg`, 5, 55);
        doc.text(`Volume: ${shipment.cargo.volume} CBM`, 5, 60);

        doc.line(5, 65, 75, 65);

        // Financials
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("TOTAL:", 5, 72);
        doc.text(`${shipment.price.toLocaleString()} XOF`, 75, 72, { align: "right" });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text("Merci de votre confiance !", 40, 85, { align: "center" });
        doc.text("Suivez votre colis sur nextmove-cargo.com", 40, 89, { align: "center" });

        // Output
        window.open(doc.output("bloburl"), "_blank");
    },

    getActiveSession: async (): Promise<POSSession | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from("pos_sessions")
            .select("*")
            .eq("agent_id", user.id)
            .eq("status", "open")
            .maybeSingle();

        if (error) {
            console.error("Error fetching active session:", error);
            return null;
        }

        return data;
    },

    openSession: async (initialCash: number): Promise<POSSession> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Check if there is already an open session
        const active = await posService.getActiveSession();
        if (active) return active;

        const { data, error } = await supabase
            .from("pos_sessions")
            .insert({
                agent_id: user.id,
                initial_cash: initialCash,
                status: "open",
                start_time: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    closeSession: async (sessionId: string): Promise<void> => {
        const { error } = await supabase
            .from("pos_sessions")
            .update({
                status: "closed",
                end_time: new Date().toISOString()
            })
            .eq("id", sessionId);

        if (error) throw error;
    },

    quickCreateClient: async (clientData: { full_name: string; phone: string; email?: string }) => {
        const password = "Temp" + Math.random().toString(36).slice(-8) + "!";

        const { data, error } = await supabase.functions.invoke("create-user", {
            body: {
                email: clientData.email || `${clientData.phone}@nextmove-cargo.com`,
                password: password,
                fullName: clientData.full_name,
                role: 'client',
                metadata: {
                    phone: clientData.phone,
                    registration_source: 'pos_express'
                }
            }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        return data.user;
    },

    getRealRates: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from("forwarder_rates")
            .select("*")
            .eq("forwarder_id", user.id);

        if (error) {
            console.error("Error fetching rates:", error);
            return [];
        }

        return data;
    },

    searchClients: async (query: string) => {
        if (!query || query.length < 2) return [];

        const { data, error } = await supabase
            .from("profiles")
            .select("id, full_name, email, phone")
            .eq("role", "client")
            .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
            .limit(5);

        if (error) {
            console.error("Error searching clients:", error);
            return [];
        }

        return data;
    },

    printToHardware: async (shipment: any) => {
        const { printService } = await import("./printService");
        return printService.printShipment(shipment);
    }
};
