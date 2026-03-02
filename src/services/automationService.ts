import { supabase } from "../lib/supabase";
import { fetchWithRetry } from "../utils/supabaseHelpers";
import { logger } from "../utils/logger";

export const automationService = {
    /**
     * handleOfferAcceptance is now handled exclusively by the 'accept_rfq_offer' RPC in the backend.
     * This client method is kept as a reference for the logic moved to PostgreSQL.
     */
    handleOfferAcceptance: async (_acceptedOfferId: string, _rfqId: string): Promise<void> => {
        logger.info("[Automation] handleOfferAcceptance skipped: now handled by backend RPC.");
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
                    <p>Merci de prendre un moment pour noter la prestation de votre prestataire.</p>
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

            const emailsToQueue = (invoices || [])
                .filter(invoice => invoice.profile?.automation_settings?.invoice_reminder_enabled !== false)
                .map(invoice => {
                    const subject = `Rappel de Paiement: Facture ${invoice.number}`;
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
                    return {
                        recipient_emails: [invoice.profile?.email || invoice.user_id],
                        subject,
                        body,
                        status: 'pending',
                        sender_id: null
                    };
                });

            if (emailsToQueue.length > 0) {
                await supabase.from('email_queue').insert(emailsToQueue);
                logger.info(`[Automation] ${emailsToQueue.length} reminders queued in batch.`);
            }
        } catch (e) {
            logger.error("[Automation] Error checking overdue invoices:", e);
        }
    },

    /**
     * Triggers a weather check for active shipments via Supabase Edge Function.
     */
    checkWeatherConditions: async (userId: string): Promise<void> => {
        try {
            const { data, error } = await supabase.functions.invoke('weather-alerts', {
                body: { userId }
            });

            if (error) throw error;
            logger.info("[Automation] Weather check triggered via Edge Function", data);
        } catch (e) {
            logger.error("[Automation] Weather check failed:", e);
        }
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
                .select(`
    *,
    profile: profiles!client_id(email, full_name),
        offers: rfq_offers(id)
                `)
                .eq('status', 'pending')
                .lt('created_at', fortyEightHoursAgo);

            if (error) throw error;

            const notifications = (staleRFQs || [])
                .filter(rfq => !rfq.offers || (rfq.offers as any[]).length === 0)
                .map(rfq => ({
                    user_id: rfq.client_id,
                    type: 'rfq_stale',
                    title: 'Votre demande est sans réponse',
                    message: `Votre demande RFQ ${rfq.id.slice(0, 8)} n'a pas encore reçu d'offres. Souhaitez-vous la modifier ?`,
                    link: `/dashboard/client/rfq/${rfq.id}`,
                    read: false
                }));

            if (notifications.length > 0) {
                await supabase.from('notifications').insert(notifications);
                logger.info(`[Automation] ${notifications.length} stale RFQ notifications sent in batch.`);
            }
        } catch (e) {
            logger.error("[Automation] Error checking stale RFQs:", e);
        }
    }
};
