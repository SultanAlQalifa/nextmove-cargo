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
            .order("start_time", { ascending: false })
            .limit(1);

        if (error) {
            console.error("Error fetching active session:", error);
            return null;
        }

        return data && data.length > 0 ? data[0] : null;
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

    closeSession: async (sessionId: string, closingData?: { cashCounted: number; cashExpected: number; difference: number; notes?: string }): Promise<void> => {
        const updatePayload: any = {
            status: "closed",
            end_time: new Date().toISOString()
        };

        if (closingData) {
            updatePayload.closing_cash_counted = closingData.cashCounted;
            updatePayload.closing_cash_expected = closingData.cashExpected;
            updatePayload.closing_difference = closingData.difference;
            updatePayload.closing_notes = closingData.notes;
        }

        const { error } = await supabase
            .from("pos_sessions")
            .update(updatePayload)
            .eq("id", sessionId);

        if (error) throw error;
    },

    /**
     * Record a cash operation (in/out) for the active session.
     */
    addCashOperation: async (sessionId: string, type: 'in' | 'out', amount: number, reason: string): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // First, if it's a cash out, verify they have enough funds in the session
        if (type === 'out') {
            const zReport = await posService.getZReport(sessionId);
            if (amount > zReport.totals.expected) {
                throw new Error(`Fonds insuffisants en caisse. Solde actuel : ${zReport.totals.expected} F`);
            }
        }

        // Check if user is admin, manager, owner or forwarder to auto-approve
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const isAdminOrManager = ['admin', 'manager', 'forwarder', 'super-admin'].includes(profile?.role || '');
        const status = (type === 'out' && !isAdminOrManager) ? 'pending' : 'approved';

        const { error } = await supabase.from("pos_cash_operations").insert({
            session_id: sessionId,
            type,
            amount,
            reason,
            status
        });

        if (error) throw error;
    },

    /**
     * Approve or reject a pending cash operation (Admin/Manager only)
     */
    updateCashOperationStatus: async (operationId: string, status: 'approved' | 'rejected'): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase
            .from("pos_cash_operations")
            .update({
                status,
                approved_by: user.id,
                approved_at: new Date().toISOString()
            })
            .eq("id", operationId);

        if (error) throw error;
    },

    /**
     * Retrieve a Z-Report (closing report) data for a given session.
     */
    getZReport: async (sessionId: string): Promise<any> => {
        // Fetch session
        const { data: session, error: sessionError } = await supabase
            .from("pos_sessions")
            .select(`
                *,
                agent:profiles!pos_sessions_agent_id_fkey(full_name, company_name)
            `)
            .eq("id", sessionId)
            .single();

        if (sessionError) throw sessionError;

        // Fetch operations
        const { data: operations, error: opsError } = await supabase
            .from("pos_cash_operations")
            .select("*")
            .eq("session_id", sessionId)
            .order("created_at", { ascending: true });

        if (opsError) throw opsError;

        // Calculate totals (Only consider 'approved' withdrawals for cashOut)
        const cashIn = operations?.filter(o => o.type === 'in' && o.status === 'approved').reduce((sum, o) => sum + o.amount, 0) || 0;
        const cashOut = operations?.filter(o => o.type === 'out' && o.status === 'approved').reduce((sum, o) => sum + o.amount, 0) || 0;
        const pendingOut = operations?.filter(o => o.type === 'out' && o.status === 'pending').reduce((sum, o) => sum + o.amount, 0) || 0;

        return {
            ...session,
            operations: operations || [],
            totals: {
                initial: session.initial_cash || 0,
                sales: session.total_sales || 0,
                cashIn,
                cashOut,
                pendingOut,
                expected: (session.initial_cash || 0) + (session.total_sales || 0) + cashIn - cashOut,
                counted: session.closing_cash_counted || 0,
                difference: session.closing_difference || 0
            }
        };
    },

    quickCreateClient: async (clientData: { full_name: string; phone: string; email?: string }) => {
        const password = "Temp" + Math.random().toString(36).slice(-8) + "!";
        const cleanPhone = clientData.phone.replace(/[^0-9+]/g, '');
        const autoEmail = clientData.email || `${cleanPhone}@guest.nextmovecargo.com`;

        const { data, error } = await supabase.functions.invoke("create-user", {
            body: {
                email: autoEmail,
                password: password,
                fullName: clientData.full_name,
                role: 'client',
                phone: cleanPhone,
                metadata: {
                    phone: cleanPhone,
                    registration_source: 'pos_express',
                    is_guest: true // Prevents welcome email
                }
            }
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        return {
            id: data.user.id,
            full_name: clientData.full_name,
            email: autoEmail,
            phone: cleanPhone,
            role: 'client'
        };
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
    },

    printLabel: async (shipment: any) => {
        const { labelService } = await import("./labelService");
        return labelService.generateLabel(shipment);
    },

    /**
     * Lookup a shipment by tracking number for the current forwarder.
     * Used in POS for Cash-on-Delivery retrieval.
     */
    lookupShipment: async (query: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !query || query.length < 2) return [];

        const { data, error } = await supabase
            .from("shipments")
            .select(`
                *,
                client:profiles!client_id(id, full_name, phone, email)
            `)
            .eq("forwarder_id", user.id)
            .or(`tracking_number.ilike.%${query}%,origin_port.ilike.%${query}%,destination_port.ilike.%${query}%`)
            .order("created_at", { ascending: false })
            .limit(10);

        if (error) {
            console.error("Error looking up shipment:", error);
            return [];
        }

        return data || [];
    },

    /**
     * Record a COD (Cash-on-Delivery) payment collected at the POS and mark shipment as delivered.
     */
    collectCODPayment: async (shipmentId: string, sessionId: string, recipientName: string, signatureBase64?: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // 1. Upload signature if provided
        let signatureUrl = null;
        if (signatureBase64) {
            const { storageService } = await import("./storageService");
            signatureUrl = await storageService.uploadPODSignature(shipmentId, signatureBase64);
        }

        // 2. Update shipment to delivered + paid
        const { error: updateError } = await supabase
            .from("shipments")
            .update({
                status: "delivered",
                arrival_actual_date: new Date().toISOString(),
            })
            .eq("id", shipmentId);

        if (updateError) throw updateError;

        // 3. Create POD Record
        const { podService } = await import("./podService");
        await podService.submitPOD({
            shipment_id: shipmentId,
            driver_id: user.id, // Agent acts as deliverer at POS
            recipient_name: recipientName,
            photo_urls: [],
            signature_url: signatureUrl || undefined,
            notes: "Collecté au POS (Agence)"
        });

        // 4. Create delivery event
        await supabase.from("shipment_events").insert({
            shipment_id: shipmentId,
            status: "delivered",
            location: "POS - Agence",
            description: `Paiement à la livraison collecté. Réceptionné par : ${recipientName}`,
            timestamp: new Date().toISOString()
        });

        // 5. Update session stats
        const { data: shipment } = await supabase
            .from("shipments")
            .select("price")
            .eq("id", shipmentId)
            .single();

        if (shipment && sessionId) {
            try {
                await supabase.rpc("increment_pos_session_stats", {
                    p_session_id: sessionId,
                    p_amount: shipment.price || 0
                });
            } catch {
                console.warn("RPC increment_pos_session_stats not found, skipping.");
            }

            // 6. Notify client of delivery
            const { data: fullShipment } = await supabase
                .from("shipments")
                .select("*, client:profiles!client_id(full_name, phone)")
                .eq("id", shipmentId)
                .single();

            if (fullShipment?.client?.phone) {
                // WhatsApp
                supabase.functions.invoke("send-whatsapp", {
                    body: {
                        shipment_id: shipmentId,
                        status: "delivered",
                        client_phone: fullShipment.client.phone,
                        client_name: fullShipment.client.full_name,
                    }
                }).catch(err => console.warn("COD Delivery WhatsApp notification failed", err));

                // SMS
                supabase.functions.invoke("send-sms", {
                    body: {
                        to: fullShipment.client.phone,
                        content: `🎉 NextMove: Votre colis #${fullShipment.tracking_number} a été livré à ${recipientName}. Merci de votre confiance !`
                    }
                }).catch(err => console.warn("COD Delivery SMS notification failed", err));
            }
        }

        return true;
    }
};
