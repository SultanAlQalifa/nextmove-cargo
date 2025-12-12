import { supabase } from "../lib/supabase";

interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export const emailService = {
  /**
   * Queue an admin email to be sent (Database Queue Pattern)
   */
  async queueAdminEmail(data: {
    subject: string;
    body: string;
    recipient_group: "all" | "clients" | "forwarders" | "specific";
    recipient_emails?: string[];
    attachments?: {
      name: string;
      path: string;
      fullPath: string;
      publicUrl: string;
      type: string;
      size: number;
    }[];
  }) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error("Not authenticated");

    const { data: result, error } = await supabase
      .from("email_queue")
      .insert({
        ...data,
        sender_id: user.user.id,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  /**
   * Get history of sent admin emails
   */
  async getAdminEmailHistory() {
    const { data, error } = await supabase
      .from("email_queue")
      .select(
        `
                *,
                sender:sender_id(full_name, email)
            `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * Delete an email from history
   */
  async deleteAdminEmail(id: string) {
    const { error } = await supabase.from("email_queue").delete().eq("id", id);

    if (error) throw error;
  },

  /**
   * Send an email using the Supabase Edge Function
   */
  sendEmail: async (
    data: EmailData,
  ): Promise<{ success: boolean; error?: any }> => {
    try {
      const { error } = await supabase.functions.invoke("send-email", {
        body: data,
      });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error sending email:", error);
      return { success: false, error };
    }
  },

  /**
   * Send a welcome email to a new user
   */
  sendWelcomeEmail: async (email: string, name: string) => {
    const subject = "Bienvenue sur NextMove Cargo !";
    const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #2563eb;">Bienvenue, ${name} !</h1>
                <p>Nous sommes ravis de vous compter parmi nous.</p>
                <p>Votre compte a été créé avec succès. Vous pouvez maintenant accéder à votre tableau de bord pour gérer vos expéditions.</p>
                <br/>
                <a href="${window.location.origin}/login" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accéder à mon compte</a>
            </div>
        `;
    return emailService.sendEmail({ to: email, subject, html });
  },

  /**
   * Send a notification when a new RFQ is received (for Forwarders)
   */
  sendRFQNotification: async (email: string, rfqId: string) => {
    const subject = "Nouvelle demande de cotation (RFQ) disponible";
    const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Nouvelle Opportunité !</h2>
                <p>Une nouvelle demande de cotation a été publiée sur la plateforme.</p>
                <p>Connectez-vous pour voir les détails et soumettre une offre.</p>
                <br/>
                <a href="${window.location.origin}/dashboard/forwarder/rfq-market" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Voir les offres</a>
            </div>
        `;
    return emailService.sendEmail({ to: email, subject, html });
  },

  /**
   * Send a notification when an offer is received (for Clients)
   */
  sendOfferNotification: async (email: string, rfqId: string) => {
    const subject = "Vous avez reçu une nouvelle offre !";
    const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #16a34a;">Nouvelle Offre Reçue</h2>
                <p>Un transitaire a soumis une offre pour votre demande de cotation.</p>
                <p>Connectez-vous pour comparer les offres et faire votre choix.</p>
                <br/>
                <a href="${window.location.origin}/dashboard/client/rfqs" style="background-color: #16a34a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Voir mon offre</a>
            </div>
        `;
    return emailService.sendEmail({ to: email, subject, html });
  },

  /**
   * Send the Forwarder Contract/Agreement email
   */
  sendForwarderContractEmail: async (email: string, name: string) => {
    const subject = "Votre dossier de partenariat NextMove Cargo";
    const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                <h1 style="color: #2563eb;">Bienvenue dans le réseau NextMove Cargo</h1>
                <p>Bonjour ${name},</p>
                <p>Nous avons bien reçu votre demande pour devenir partenaire transitaire sur notre plateforme.</p>
                
                <h3 style="color: #1e293b; margin-top: 20px;">Rappel des engagements</h3>
                <ul style="color: #475569;">
                    <li>Respect des standards de qualité et de réactivité.</li>
                    <li>Possession des documents requis (registre de commerce, NINEA, carte import-export, etc.).</li>
                    <li>Transparence totale sur les tarifs et les conditions de service.</li>
                </ul>

                <p>Vous trouverez ci-joint (fictif) le contrat de partenariat détaillé ainsi que la charte de qualité.</p>
                
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                    <p style="margin: 0; font-size: 0.9em; color: #64748b;">
                        En signant électroniquement lors de votre inscription, vous avez accepté ces conditions.
                    </p>
                </div>

                <p>Pour finaliser votre inscription, veuillez cliquer sur le bouton ci-dessous :</p>
                <br/>
                <a href="${window.location.origin}/register?role=forwarder&email=${encodeURIComponent(email)}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Finaliser mon inscription</a>
                
                <p style="margin-top: 30px; font-size: 0.8em; color: #94a3b8;">
                    Ceci est un email automatique, merci de ne pas y répondre.
                </p>
            </div>
        `;
    return emailService.sendEmail({ to: email, subject, html });
  },
  /**
   * Send subscription confirmation email
   */
  sendSubscriptionConfirmation: async (
    email: string,
    name: string,
    planName: string,
    amount: number,
    currency: string,
  ) => {
    const subject = "Confirmation de votre abonnement NextMove Cargo";
    const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
                <h1 style="color: #2563eb;">Abonnement Confirmé !</h1>
                <p>Bonjour ${name},</p>
                <p>Nous vous confirmons l'activation de votre abonnement <strong>${planName}</strong>.</p>
                
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #1e293b;">Détails de la transaction</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 8px 0; color: #64748b;">Plan</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold;">${planName}</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px 0; color: #64748b;">Montant Total</td>
                            <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #2563eb;">${amount.toLocaleString()} ${currency}</td>
                        </tr>
                    </table>
                </div>

                <p>Votre facture a été générée et téléchargée automatiquement.</p>
                <p>Vous pouvez accéder à tous vos services dès maintenant via votre tableau de bord.</p>
                
                <br/>
                <a href="${window.location.origin}/dashboard" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Accéder à mon tableau de bord</a>
            </div>
        `;
    return emailService.sendEmail({ to: email, subject, html });
  },

  /**
   * Send shipment status update email
   */
  sendShipmentStatusUpdate: async (
    email: string,
    trackingNumber: string,
    status: string,
    link: string
  ) => {
    // Translate status for display
    const statusLabels: Record<string, string> = {
      pending: "En Attente (Confirmé)",
      pending_payment: "En Attente de Paiement",
      picked_up: "Ramassé / Enlevé",
      in_transit: "En Transit",
      customs: "En Douane",
      delivered: "Livré",
      cancelled: "Annulé"
    };
    const displayStatus = statusLabels[status] || status;
    const subject = `Mise à jour statut expédition: ${trackingNumber}`;

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #2563eb; margin-top: 0;">Mise à jour de votre expédition</h2>
        <p>L'expédition <strong>#${trackingNumber}</strong> a changé de statut.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #64748b; font-size: 0.9em;">Nouveau Statut</p>
          <h3 style="margin: 5px 0 0 0; color: #1e293b; font-size: 1.5em;">${displayStatus}</h3>
        </div>

        <p>Vous pouvez suivre le détail et voir les documents mis à jour sur votre tableau de bord.</p>
        
        <br/>
        <a href="${link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Suivre mon expédition</a>
      </div>
    `;

    return emailService.sendEmail({ to: email, subject, html });
  },
};
