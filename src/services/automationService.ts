import { supabase } from "../lib/supabase";
import { fetchWithRetry } from "../utils/supabaseHelpers";
import { logger } from "../utils/logger";

export const automationService = {
    /**
     * Checks if an RFQ should be automatically closed (e.g. when an offer is accepted)
     * This is typically called after an offer is accepted.
     */
    handleOfferAcceptance: async (acceptedOfferId: string, rfqId: string): Promise<void> => {
        try {
            // Check if automation is enabled for the forwarder who owns the accepted offer
            const { data: offer } = await supabase
                .from('rfq_offers')
                .select('*, forwarder:profiles!forwarder_id(company_name, avatar_url), rfq:rfq_requests(*)')
                .eq('id', acceptedOfferId)
                .single();

            if (!offer) {
                logger.error("[Automation] Offer not found:", acceptedOfferId);
                return;
            }



            // 1. Update RFQ status to 'offer_accepted'
            await fetchWithRetry(() =>
                supabase
                    .from("rfq_requests")
                    .update({ status: "offer_accepted" })
                    .eq("id", rfqId)
            );

            // 2. Reject all other pending offers for this RFQ (Cleanup)
            await fetchWithRetry(() =>
                supabase
                    .from("rfq_offers")
                    .update({ status: "rejected", rejected_reason: "Une autre offre a été acceptée (Automation)" })
                    .eq("rfq_id", rfqId)
                    .neq("id", acceptedOfferId)
                    .eq("status", "pending")
            );

            // 3. CREATE SHIPMENT (The "Post-Acceptance" Workflow)
            const rfq = offer.rfq;
            const trackingNumber = `SHP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

            // Calculate Arrival Date based on Departure + Transit Days
            // If departure is null, assume today + 3 days for prep
            const departureDate = offer.departure_date ? new Date(offer.departure_date) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
            const arrivalDate = new Date(departureDate);
            arrivalDate.setDate(arrivalDate.getDate() + (offer.estimated_transit_days || 30));

            const { error: shipmentError } = await supabase.from("shipments").insert({
                tracking_number: trackingNumber,
                rfq_id: rfq.id,
                client_id: rfq.client_id,
                forwarder_id: offer.forwarder_id,
                status: "pending_payment", // Starts as pending_payment, waiting for payment

                // Route
                origin_port: rfq.origin_port,
                origin_country: rfq.origin_country || "XX",
                destination_port: rfq.destination_port,
                destination_country: rfq.destination_country || "XX",

                // Cargo
                cargo_type: rfq.cargo_type,
                cargo_weight: rfq.weight_kg || 0,
                cargo_volume: rfq.volume_cbm || 0,
                cargo_packages: rfq.quantity || 1,

                // Service
                transport_mode: rfq.transport_mode,
                transport_type: rfq.transport_mode,
                service_type: rfq.service_type,
                price: offer.total_price,
                currency: offer.currency,

                // Dates
                departure_date: departureDate.toISOString(),
                arrival_estimated_date: arrivalDate.toISOString(),

                // Carrier (Forwarder is the carrier wrapper here)
                carrier_name: offer.forwarder?.company_name || "Forwarder",
                carrier_logo: offer.forwarder?.avatar_url
            });

            if (shipmentError) {
                logger.error("[Automation] Error creating shipment:", shipmentError);
            } else {
                logger.info(`[Automation] Shipment created: ${trackingNumber}`);
            }

            logger.info(`[Automation] RFQ ${rfqId} closed. Other offers rejected.`);
        } catch (error) {
            logger.error("[Automation] Error handling offer acceptance:", error);
        }
    },

    /**
     * Triggered when a shipment is marked as 'Delivered'.
     * Sends a feedback request notification (simulation) and updates history.
     */
    handleShipmentDelivery: async (shipmentId: string, clientId: string): Promise<void> => {
        try {
            // Check if automation is enabled for the forwarder
            // We need to find who the forwarder is for this shipment
            const { data: shipment } = await supabase.from('shipments').select('forwarder_id').eq('id', shipmentId).single();
            if (shipment?.forwarder_id) {
                const { data: profile } = await supabase.from('profiles').select('automation_settings').eq('id', shipment.forwarder_id).single();
                if (profile?.automation_settings && profile.automation_settings.delivery_feedback_enabled === false) {
                    logger.info(`[Automation] Feedback Request skipped for Forwarder ${shipment.forwarder_id} (Disabled by user).`);
                    return;
                }
            }

            // Simulation: In a real app, this would trigger an Edge Function to send an email
            logger.info(`[Automation] Shipment ${shipmentId} delivered. Triggering feedback request for Client ${clientId}.`);

            // We could insert a notification into the DB
            await fetchWithRetry(() =>
                supabase.from("notifications").insert({
                    user_id: clientId,
                    type: "feedback_request",
                    title: "Votre colis est arrivé !",
                    message: "Confirmez la bonne réception et notez le service.",
                    link: `/dashboard/client/shipments/${shipmentId}`,
                    read: false
                })
            );

        } catch (error) {
            console.error("[Automation] Error handling delivery:", error);
        }
    },

    /**
     * Checks for unpaid invoices > 48h and sends reminders. (Stub)
     */
    checkOverdueInvoices: async (userId: string): Promise<void> => {
        try {
            const { data: profile } = await supabase.from('profiles').select('automation_settings').eq('id', userId).single();
            if (profile?.automation_settings?.invoice_reminder_enabled === false) return;

            console.log(`[Automation] Checking overdue invoices for Forwarder ${userId} (Enabled)...`);
            // Logic to find invoices and likely call 'send-email' edge function
        } catch (e) { console.error(e); }
    },

    /**
     * Simulation: Checks weather for active shipments. (Stub)
     */
    checkWeatherConditions: async (userId: string): Promise<void> => {
        try {
            const { data: profile } = await supabase.from('profiles').select('automation_settings').eq('id', userId).single();
            if (profile?.automation_settings?.weather_alert_enabled === false) return;

            console.log(`[Automation] Checking weather alerts for Forwarder ${userId} (Enabled)...`);
            // Logic to check external API
        } catch (e) { console.error(e); }
    },

    /**
    * Sends auto-response for new ticket. (Stub)
    */
    handleNewTicket: async (ticketId: string, forwarderId: string): Promise<void> => {
        try {
            const { data: profile } = await supabase.from('profiles').select('automation_settings').eq('id', forwarderId).single();
            if (profile?.automation_settings?.ticket_auto_ack_enabled === false) return;

            console.log(`[Automation] Sending Ticket Auto-Ack for Forwarder ${forwarderId} (Enabled)...`);
            // Logic to insert 'auto-reply' message into ticket_messages
        } catch (e) { console.error(e); }
    },

    /**
     * Checks for stale RFQs (no offers > 48h) and notifies the user.
     * This would typically be a scheduled job, but we can simulate/trigger it on dashboard load.
     */
    checkStaleRFQs: async (userId: string): Promise<void> => {
        // Implementation placeholder for scheduled checks
        // In frontend-only, we might run this when the user visits the "My RFQs" page
        // to show a "Boost" button suggestion.
    }
};
