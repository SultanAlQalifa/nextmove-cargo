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
                price: (async () => {
                    // Calculate Discount based on Plan
                    const { data: sub } = await supabase.from('user_subscriptions')
                        .select('plan:subscription_plans(name)')
                        .eq('user_id', rfq.client_id)
                        .eq('status', 'active')
                        .single();

                    const planObj = Array.isArray(sub?.plan) ? sub?.plan[0] : sub?.plan;
                    const planName = planObj?.name?.toLowerCase() || '';
                    let discount = 0;
                    if (planName.includes('elite') || planName.includes('enterprise')) discount = 0.10;
                    else if (planName.includes('pro')) discount = 0.05;

                    const finalPrice = offer.total_price * (1 - discount);
                    return Math.floor(finalPrice); // Round down to avoid decimals issues in XOF
                })(),
                currency: offer.currency,

                // Dates
                departure_date: departureDate.toISOString(),
                arrival_estimated_date: arrivalDate.toISOString(),

                // Carrier (Forwarder is the carrier wrapper here)
                carrier_name: offer.forwarder?.company_name || "Forwarder",
                carrier_logo: offer.forwarder?.avatar_url
            });

            // 4. QUEUE AUTOMATED EMAIL (Client Notification)
            const clientEmailSubject = `Confirmation d'Acceptation de l'Offre - RFQ ${rfq.id.slice(0, 8)}`;
            const clientEmailBody = `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #2563eb;">Offre Acceptée !</h2>
                    <p>Bonjour,</p>
                    <p>Vous avez accepté l'offre de transport de <strong>${offer.forwarder?.company_name || 'votre transitaire'}</strong>.</p>
                    <p><strong>Détails de l'expédition :</strong></p>
                    <ul>
                        <li>Numéro de Suivi : <strong>${trackingNumber}</strong></li>
                        <li>Montant : ${offer.total_price} ${offer.currency}</li>
                        <li>Départ estimé : ${departureDate.toLocaleDateString()}</li>
                    </ul>
                    <p>Votre expédition a été créée et est en attente de paiement.</p>
                </div>
            `;

            await fetchWithRetry(() =>
                supabase.from('email_queue').insert({
                    sender_id: null, // System Notification
                    subject: clientEmailSubject,
                    body: clientEmailBody,
                    recipient_group: 'specific',
                    recipient_emails: [rfq.client_id], // In a real app we'd fetch the email, here we use ID as placeholder or simulation
                    status: 'pending'
                })
            );

            // 5. QUEUE AUTOMATED EMAIL (Forwarder Notification)
            const forwarderEmailSubject = `Nouveau Contrat Remporté - RFQ ${rfq.id.slice(0, 8)}`;
            const forwarderEmailBody = `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #16a34a;">Félicitations !</h2>
                    <p>Votre offre a été retenue pour la demande de cotation.</p>
                    <p>Un nouveau dossier d'expédition a été généré : <strong>${trackingNumber}</strong>.</p>
                    <p>Veuillez préparer les documents nécessaires.</p>
                </div>
            `;

            await fetchWithRetry(() =>
                supabase.from('email_queue').insert({
                    sender_id: null, // System Notification
                    subject: forwarderEmailSubject,
                    body: forwarderEmailBody,
                    recipient_group: 'specific',
                    recipient_emails: [offer.forwarder_id],
                    status: 'pending'
                })
            );

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
            const { data: shipment } = await supabase.from('shipments').select('forwarder_id, tracking_number').eq('id', shipmentId).single();
            if (shipment?.forwarder_id) {
                const { data: profile } = await supabase.from('profiles').select('automation_settings').eq('id', shipment.forwarder_id).single();
                if (profile?.automation_settings && profile.automation_settings.delivery_feedback_enabled === false) {
                    logger.info(`[Automation] Feedback Request skipped for Forwarder ${shipment.forwarder_id} (Disabled by user).`);
                    return;
                }
            }

            // In-App Notification
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

            // QUEUE EMAIL: Feedback Request
            const feedbackSubject = `Livraison Effectuée - ${shipment?.tracking_number || 'Expédition'}`;
            const feedbackBody = `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #2563eb;">Votre colis est arrivé !</h2>
                    <p>Nous espérons que vous êtes satisfait de votre expérience.</p>
                    <p>Merci de prendre un moment pour noter la prestation de votre transitaire.</p>
                    <div style="margin-top: 20px;">
                        <a href="${window.location.origin}/dashboard/client/shipments/${shipmentId}" 
                           style="background-color: #fbbf24; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                           Laisser un avis
                        </a>
                    </div>
                </div>
            `;

            await fetchWithRetry(() =>
                supabase.from('email_queue').insert({
                    sender_id: null,
                    subject: feedbackSubject,
                    body: feedbackBody,
                    recipient_group: 'specific',
                    recipient_emails: [clientId], // We'd resolve this to an actual email
                    status: 'pending'
                })
            );

            logger.info(`[Automation] Shipment ${shipmentId} delivered. Feedback request queued.`);

        } catch (error) {
            console.error("[Automation] Error handling delivery:", error);
        }
    },

    /**
     * Checks for unpaid invoices > 48h and sends reminders.
     */
    checkOverdueInvoices: async (): Promise<void> => {
        try {
            // Find invoices with status 'unpaid' or 'overdue' where due_date has passed by at least 48h
            const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

            const { data: invoices, error } = await supabase
                .from('invoices')
                .select('*, profile:profiles!user_id(email, full_name, automation_settings)')
                .in('status', ['unpaid', 'overdue'])
                .lt('due_date', fortyEightHoursAgo);

            if (error) throw error;

            for (const invoice of (invoices || [])) {
                // Check if reminders are enabled for this user
                if (invoice.profile?.automation_settings?.invoice_reminder_enabled === false) continue;

                const subject = `Rappel de Paiement : Facture ${invoice.number}`;
                const body = `
                    <div style="font-family: sans-serif; padding: 20px;">
                        <h2 style="color: #ef4444;">Rappel de Paiement</h2>
                        <p>Bonjour ${invoice.profile?.full_name || 'Utilisateur'},</p>
                        <p>Votre facture <strong>${invoice.number}</strong> d'un montant de <strong>${invoice.amount} ${invoice.currency}</strong> est arrivée à échéance le ${new Date(invoice.due_date).toLocaleDateString()}.</p>
                        <p>Merci de régulariser votre situation dans les plus brefs délais pour éviter toute interruption de service.</p>
                        <div style="margin-top: 20px;">
                            <a href="${window.location.origin}/dashboard/client/billing" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                Voir ma facture
                            </a>
                        </div>
                    </div>
                `;

                await supabase.from('email_queue').insert({
                    recipient_emails: [invoice.profile?.email || invoice.user_id],
                    subject,
                    body,
                    status: 'pending'
                });

                logger.info(`[Automation] Reminder queued for invoice ${invoice.number}`);
            }
        } catch (e) {
            logger.error("[Automation] Error checking overdue invoices:", e);
        }
    },

    /**
     * Simulation: Checks weather for active shipments. (Stub)
     */
    checkWeatherConditions: async (userId: string): Promise<void> => {
        try {
            const { data: profile } = await supabase.from('profiles').select('automation_settings').eq('id', userId).single();
            if (profile?.automation_settings?.weather_alert_enabled === false) return;

            // In a real app, this would call a weather API (OpenWeather)
            // For now, we remain as a conceptual stub or log it.
            logger.info("[Automation] Weather check simulation for user", userId);
        } catch (e) { logger.error(e); }
    },

    /**
    * Sends auto-response for new ticket.
    */
    handleNewTicket: async (ticketId: string, forwarderId: string): Promise<void> => {
        try {
            const { data: profile } = await supabase.from('profiles').select('automation_settings').eq('id', forwarderId).single();
            if (profile?.automation_settings?.ticket_auto_ack_enabled === false) return;

            const autoReply = "Merci pour votre message. Notre équipe a bien reçu votre ticket et l'étudie actuellement. Nous reviendrons vers vous dans les plus brefs délais.";

            await supabase.from('ticket_messages').insert({
                ticket_id: ticketId,
                sender_id: forwarderId,
                content: autoReply
            });

            logger.info(`[Automation] Auto-reply sent for ticket ${ticketId}`);
        } catch (e) {
            logger.error("[Automation] Error handling new ticket auto-ack:", e);
        }
    },

    /**
     * Checks for stale RFQs (no offers > 48h) and notifies the user.
     */
    checkStaleRFQs: async (): Promise<void> => {
        try {
            const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

            // Find RFQs created > 48h ago that are still pending
            const { data: staleRFQs, error } = await supabase
                .from('rfq_requests')
                .select('*, profile:profiles!client_id(email, full_name)')
                .eq('status', 'pending')
                .lt('created_at', fortyEightHoursAgo);

            if (error) throw error;

            for (const rfq of (staleRFQs || [])) {
                // Check if there are truly 0 offers
                const { count } = await supabase
                    .from('rfq_offers')
                    .select('*', { count: 'exact', head: true })
                    .eq('rfq_id', rfq.id);

                if (count === 0) {
                    // Send notification to client
                    await supabase.from('notifications').insert({
                        user_id: rfq.client_id,
                        type: 'rfq_stale',
                        title: 'Votre demande est sans réponse',
                        message: `Votre demande RFQ ${rfq.id.slice(0, 8)} n'a pas encore reçu d'offres. Souhaitez-vous la modifier ?`,
                        link: `/dashboard/client/rfq/${rfq.id}`,
                        read: false
                    });

                    // Optionnally queue an email if preferred
                    logger.info(`[Automation] Stale RFQ notification sent for ${rfq.id}`);
                }
            }
        } catch (e) {
            logger.error("[Automation] Error checking stale RFQs:", e);
        }
    }
};
