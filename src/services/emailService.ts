import { supabase } from "../lib/supabase";

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailHistoryItem {
  id: string;
  created_at: string;
  subject: string;
  body: string;
  recipient_group: "all" | "clients" | "forwarders" | "specific";
  status: "pending" | "processing" | "sent" | "failed";
  error_message?: string;
  sender: {
    full_name: string;
    email: string;
  };
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
  async getAdminEmailHistory(): Promise<EmailHistoryItem[]> {
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
    return data as any; // Cast for joined relation until mapped properly or use generic
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
  async sendEmail(args: { to: string, subject: string, html?: string, message?: string, attachments?: any[] }) {
    const { to, subject, html, message, attachments = [] } = args;
    const { data, error } = await supabase.functions.invoke("process-email-queue", {
      body: {
        to,
        subject,
        message: html || message, // This will now be HTML
        attachments
      },
    });
    if (error) throw error;
    return data;
  },

  /**
   * Generates a professional HTML email wrapper.
   */
  getHtmlTemplate(title: string, bodyContent: string, actionUrl?: string, actionLabel?: string) {
    const primaryColor = "#2563eb"; // Should ideally come from branding
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #334155; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
    .header { background: ${primaryColor}; padding: 32px; text-align: center; color: white; }
    .content { padding: 40px; }
    .footer { padding: 24px; text-align: center; font-size: 12px; color: #64748b; background: #f1f5f9; }
    .button { display: inline-block; padding: 12px 24px; background-color: ${primaryColor}; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
    .logo { font-size: 24px; font-weight: bold; margin-bottom: 8px; }
    h1 { color: #1e293b; margin-top: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">NextMove Cargo</div>
      <div>Plateforme Logistique Innovante</div>
    </div>
    <div class="content">
      <h1>${title}</h1>
      ${bodyContent}
      ${actionUrl ? `<center><a href="${actionUrl}" class="button">${actionLabel || 'Voir Détails'}</a></center>` : ''}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} NextMove Cargo. Tous droits réservés.<br>
      Ce message est automatique, merci de ne pas y répondre directement.
    </div>
  </div>
</body>
</html>`;
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
  sendRFQNotification: async (email: string) => {
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
  sendOfferNotification: async (email: string) => {
    const subject = "Vous avez reçu une nouvelle offre !";
    const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #16a34a;">Nouvelle Offre Reçue</h2>
                <p>Un prestataire a soumis une offre pour votre demande de cotation.</p>
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
                <p>Nous avons bien reçu votre demande pour devenir prestataire sur notre plateforme.</p>
                
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
