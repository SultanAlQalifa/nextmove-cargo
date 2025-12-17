/// <reference lib="deno.ns" />
import { serve } from "std/http/server.ts";
import { createClient } from "supabase-js";
import { createTransport } from "nodemailer";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailQueueRecord {
    id: string;
    subject: string;
    body: string;
    recipient_group: 'all' | 'clients' | 'forwarders' | 'specific';
    recipient_emails?: string[]; // stored as JSONB in DB
    attachments?: any[];
    sender_id: string;
}

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Initialize Admin Client
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 2. Parse Payload (Webhook 'INSERT' payload or manual invoke)
        const payload = await req.json();
        const record: EmailQueueRecord = payload.record || payload; // Handle both Webhook wrapper and direct invoke

        if (!record || !record.id) {
            throw new Error("No record found in payload");
        }

        console.log(`Processing email ${record.id}: ${record.subject}`);

        // 3. Mark as Processing
        await supabaseAdmin
            .from('email_queue')
            .update({ status: 'processing' })
            .eq('id', record.id);

        // 4. Fetch SMTP and Branding Settings
        // We fetch branding from public settings
        const { data: brandingData } = await supabaseAdmin
            .from('system_settings')
            .select('value')
            .eq('key', 'branding')
            .single();

        // We fetch sensitive email config from private secrets
        // CORRECTION: The UI saves to 'system_settings', so we must read from there too.
        // system_secrets might be deprecated or unused by the UI.
        const { data: emailData } = await supabaseAdmin
            .from('system_settings')
            .select('value')
            .eq('key', 'email')
            .single();

        interface SystemSettings {
            email?: {
                smtp_host?: string;
                smtp_port?: number;
                smtp_user?: string;
                smtp_pass?: string;
                from_name?: string;
                from_email?: string;
            };
            branding?: {
                logo_url?: string;
                platform_name?: string;
                pages?: {
                    contact?: {
                        address?: string;
                        email?: string;
                    };
                };
                social_media?: {
                    facebook?: string;
                    linkedin?: string;
                    instagram?: string;
                };
            };
        }

        const settingsMap: SystemSettings = {
            branding: brandingData?.value,
            email: emailData?.value
        };

        const smtpConfig = settingsMap.email;
        const branding = settingsMap.branding || {};
        const contact = branding.pages?.contact || {};
        const social = branding.social_media || {};

        const address = contact.address || '123 Avenue Leopold Sedar Senghor, Dakar, Sénégal';
        const emailContact = contact.email || 'contact@nextmovecargo.com';
        const companyName = branding.platform_name || 'NextMove Cargo';

        // Use branding logo if available and not a placeholder, otherwise fallback to our premium asset
        let logoUrl = branding.logo_url;
        if (!logoUrl || logoUrl.includes('placeholder')) {
            logoUrl = 'https://dkbnmnpxoesvkbnwuyle.supabase.co/storage/v1/object/public/email-attachments/Pink%20Clean%20Minimal%20Coffee%20Cup%20Mockup%20Instagram%20Post.png';
        }

        const fbLink = social.facebook && social.facebook !== '' ? social.facebook : '#';
        const liLink = social.linkedin && social.linkedin !== '' ? social.linkedin : '#';
        const instaLink = social.instagram && social.instagram !== '' ? social.instagram : '#';


        // 5. Determine Recipients
        let targetEmails: string[] = [];

        if (record.recipient_group === 'specific') {
            targetEmails = record.recipient_emails || [];
        } else {
            let query = supabaseAdmin.from('profiles').select('email');

            if (record.recipient_group === 'clients') {
                query = query.eq('role', 'client');
            } else if (record.recipient_group === 'forwarders') {
                query = query.eq('role', 'forwarder');
            }

            const { data: profiles, error: profileError } = await query;
            if (profileError) throw profileError;

            targetEmails = profiles.map((p: any) => p.email).filter((e: any) => e); // Filter nulls
        }

        // Deduplicate
        targetEmails = [...new Set(targetEmails)];
        console.log(`Found ${targetEmails.length} recipients.`);

        if (targetEmails.length === 0) {
            await supabaseAdmin
                .from('email_queue')
                .update({ status: 'sent', error_message: 'No recipients found' })
                .eq('id', record.id);
            return new Response(JSON.stringify({ message: "No recipients" }), { status: 200, headers: corsHeaders });
        }

        // 6. Send Emails
        // Strategy: Batch or Loop? For < 100, loop is fine. For > 100, maybe BCC batching.
        // For privacy, we should NOT put everyone in "To".
        // We will use BCC for groups of 50 to save API calls.

        const BATCH_SIZE = 50;
        const batches = [];
        for (let i = 0; i < targetEmails.length; i += BATCH_SIZE) {
            batches.push(targetEmails.slice(i, i + BATCH_SIZE));
        }

        let successCount = 0;
        let failCount = 0;

        // Attachments formatting for Nodemailer/Resend?
        // Attachments in DB are { publicUrl, name, ... }.
        // Nodemailer supports { path: url }. Resend supports { filename, path }.
        const emailAttachments = record.attachments?.map((att: any) => ({
            filename: att.name,
            path: att.publicUrl
        })) || [];

        for (const batch of batches) {
            try {
                if (smtpConfig?.smtp_host && smtpConfig?.smtp_user) {
                    // SMTP Mode
                    const transporter = createTransport({
                        host: smtpConfig.smtp_host,
                        port: smtpConfig.smtp_port,
                        secure: smtpConfig.smtp_port === 465,
                        auth: {
                            user: smtpConfig.smtp_user,
                            pass: smtpConfig.smtp_pass,
                        }
                    });

                    await transporter.sendMail({
                        from: `"${smtpConfig.from_name || companyName}" <${smtpConfig.from_email || 'noreply@nextemove.com'}>`,
                        bcc: batch, // Hidden recipients
                        subject: record.subject,
                        html: record.body,
                        attachments: emailAttachments
                    });
                } else {
                    // Resend Mode
                    if (!RESEND_API_KEY) throw new Error("No SMTP Config and No RESEND_API_KEY");

                    console.log(`Sending batch of ${batch.length} emails via Resend...`);
                    const fromEmail = smtpConfig?.from_email ? `"${smtpConfig.from_name || companyName}" <${smtpConfig.from_email}>` : `${companyName} <onboarding@resend.dev>`;
                    // Use the sender email as the 'To' address to satisfy requirements while using BCC for recipients
                    const toEmail = smtpConfig?.from_email || "admin@nextmove-cargo.com";

                    console.log(`Sending batch of ${batch.length} emails via Resend from ${fromEmail}...`);
                    const res = await fetch("https://api.resend.com/emails", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${RESEND_API_KEY}`,
                        },
                        body: JSON.stringify({
                            from: fromEmail,
                            to: [toEmail],
                            bcc: batch,
                            subject: record.subject,
                            // Professional HTML Template
                            html: `
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <meta charset="utf-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                </head>
                                <body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1a1a1a;">
                                    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                                        
                                        <!-- Main Card -->
                                        <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.05);">
                                            
                                            <!-- Brand Accent -->
                                            <div style="height: 6px; background: linear-gradient(90deg, #0f172a, #3b82f6);"></div>
                                            
                                            <!-- Header Spacer -->
                                            <div style="padding: 30px 40px 0 40px;"></div>

                                            <!-- Main Content -->
                                            <div style="padding: 10px 40px 40px 40px; font-size: 15px; line-height: 1.6; color: #374151;">
                                                ${record.body}
                                            </div>
                                        </div>

                                        <!-- Corporate Footer (Outside Card) -->
                                        <div style="margin-top: 30px; text-align: center; padding: 0 20px;">
                                            
                                            <!-- Logo (Larger) -->
                                            <div style="margin-bottom: 25px;">
                                                <img src="${logoUrl}" alt="${companyName}" style="height: 65px; width: auto; max-width: 220px; object-fit: contain;">
                                            </div>

                                            <!-- Social Media Mockups -->
                                            <div style="margin-bottom: 25px;">
                                                <a href="${liLink}" style="text-decoration: none; margin: 0 8px; display: inline-block;">
                                                    <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" alt="LinkedIn" width="22" height="22" style="opacity: 0.6; filter: grayscale(100%); transition: opacity 0.2s;">
                                                </a>
                                                <a href="${fbLink}" style="text-decoration: none; margin: 0 8px; display: inline-block;">
                                                    <img src="https://cdn-icons-png.flaticon.com/512/174/174848.png" alt="Facebook" width="22" height="22" style="opacity: 0.6; filter: grayscale(100%); transition: opacity 0.2s;">
                                                </a>
                                                <a href="${instaLink}" style="text-decoration: none; margin: 0 8px; display: inline-block;">
                                                    <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" width="22" height="22" style="opacity: 0.6; filter: grayscale(100%); transition: opacity 0.2s;">
                                                </a>
                                            </div>

                                            <!-- Address & Contact -->
                                            <div style="margin-bottom: 20px;">
                                                <p style="font-size: 12px; color: #6b7280; margin: 3px 0;">
                                                    ${companyName} International
                                                </p>
                                                <p style="font-size: 12px; color: #9ca3af; margin: 3px 0;">
                                                    ${address}
                                                </p>
                                                <p style="font-size: 12px; color: #9ca3af; margin: 3px 0;">
                                                    <a href="mailto:${emailContact}" style="color: #6b7280; text-decoration: none;">${emailContact}</a>
                                                </p>
                                            </div>

                                            <!-- Legal -->
                                            <div style="font-size: 11px; color: #9ca3af;">
                                                <p style="margin: 0;">
                                                    &copy; ${new Date().getFullYear()} ${companyName}.
                                                    <span style="margin: 0 6px;">•</span>
                                                    <a href="#" style="color: #9ca3af; text-decoration: none;">Confidentialité</a>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </body>
                                </html>
                            `,
                            attachments: emailAttachments
                        }),
                    });

                    const responseData = await res.json();

                    if (!res.ok) {
                        console.error("Resend API Error:", responseData);
                        throw new Error(`Resend Error: ${JSON.stringify(responseData)}`);
                    } else {
                        console.log("Resend Success:", responseData);
                    }
                }
                successCount += batch.length;
            } catch (err) {
                console.error("Batch failed", err);
                failCount += batch.length;
            }
        }

        // 7. Update Final Status
        const finalStatus = failCount === 0 ? 'sent' : (successCount > 0 ? 'sent' : 'failed');
        const errorMsg = failCount > 0 ? `Failed to send to ${failCount} recipients.` : null;

        const { error: updateError } = await supabaseAdmin
            .from('email_queue')
            .update({
                status: finalStatus,
                updated_at: new Date().toISOString(),
                error_message: errorMsg
            })
            .eq('id', record.id);

        if (updateError) {
            console.error("Failed to update final status:", updateError);
        } else {
            console.log(`Successfully updated status to ${finalStatus} for ${record.id}`);
        }

        return new Response(JSON.stringify({ success: true, sent: successCount }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: unknown) {
        const err = error as Error;
        console.error("Error processing queue:", err);

        // Try to update DB with error
        try {
            const payload = await req.clone().json(); // clone because body might be used
            const record = payload.record || payload;
            if (record?.id) {
                const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
                await supabaseAdmin.from('email_queue').update({ status: 'failed', error_message: err.message }).eq('id', record.id);
            }
        } catch { }

        return new Response(JSON.stringify({ error: err.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
