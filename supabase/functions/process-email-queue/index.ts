// @ts-nocheck
/// <reference lib="deno.ns" />
// @ts-ignore
import { serve } from "std/http/server.ts";
// @ts-ignore
import { createClient } from "supabase-js";
// @ts-ignore
import { createTransport } from "nodemailer";
import { Buffer } from "node:buffer";

// @ts-ignore: Buffer is needed for nodemailer
globalThis.Buffer = Buffer;

// @ts-ignore
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// @ts-ignore
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// @ts-ignore
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
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 1. Parse Payload
        let records: EmailQueueRecord[] = [];
        let isBatch = false;

        try {
            const payload = await req.json();
            if (payload.record) {
                records = [payload.record];
            } else {
                throw new Error("No record in payload");
            }
        } catch (e) {
            // Cron mode or empty payload
            console.log("Fetching pending emails from queue...");
            const { data: pending, error: fetchError } = await supabaseAdmin
                .from('email_queue')
                .select('*')
                .eq('status', 'pending')
                .limit(10); // Batch size limit

            if (fetchError) throw fetchError;
            records = pending || [];
            isBatch = true;
        }

        if (records.length === 0) {
            return new Response(JSON.stringify({ message: "No pending emails" }), { status: 200, headers: corsHeaders });
        }

        console.log(`Processing ${records.length} emails...`);

        // 2. Fetch Settings (Reusable)
        const { data: brandingData } = await supabaseAdmin
            .from('system_settings')
            .select('value')
            .eq('key', 'branding')
            .single();

        const { data: emailData } = await supabaseAdmin
            .from('system_settings')
            .select('value')
            .eq('key', 'email')
            .single();

        const settingsMap = {
            branding: brandingData?.value,
            email: emailData?.value
        };

        const smtpConfig = settingsMap.email || {};
        const branding = settingsMap.branding || {};
        const contact = branding.pages?.contact || {};
        const social = branding.social_media || {};

        const address = contact.address || '123 Avenue Leopold Sedar Senghor, Dakar, Sénégal';
        const emailContact = contact.email || 'contact@nextmovecargo.com';
        const companyName = branding.platform_name || 'NextMove Cargo';

        // Logo logic
        let logoUrl = branding.logo_url;
        if (!logoUrl || logoUrl.includes('placeholder')) {
            logoUrl = 'https://dkbnmnpxoesvkbnwuyle.supabase.co/storage/v1/object/public/email-attachments/Pink%20Clean%20Minimal%20Coffee%20Cup%20Mockup%20Instagram%20Post.png';
        }

        // Links
        const fbLink = social.facebook || '#';
        const liLink = social.linkedin || '#';
        const instaLink = social.instagram || '#';

        // 3. Process Each Record
        let processedCount = 0;

        for (const record of records) {
            try {
                console.log(`Processing email ${record.id}: ${record.subject}`);

                // Mark as processing
                await supabaseAdmin.from('email_queue').update({ status: 'processing' }).eq('id', record.id);

                // Determine Recipients
                let targetEmails: string[] = [];
                if (record.recipient_group === 'specific') {
                    const RawEmails = record.recipient_emails || [];

                    // Split between actual emails and potential UUIDs
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    const resolvedEmails = RawEmails.filter(e => emailRegex.test(e));
                    const potentialIds = RawEmails.filter(e => !emailRegex.test(e) && e.length >= 36);

                    if (potentialIds.length > 0) {
                        const { data: profiles } = await supabaseAdmin
                            .from('profiles')
                            .select('email')
                            .in('id', potentialIds);

                        if (profiles) {
                            resolvedEmails.push(...profiles.map((p: any) => p.email).filter(Boolean));
                        }
                    }
                    targetEmails = resolvedEmails;
                } else {
                    let query = supabaseAdmin.from('profiles').select('email');
                    if (record.recipient_group === 'clients') query = query.eq('role', 'client');
                    else if (record.recipient_group === 'forwarders') query = query.eq('role', 'forwarder');

                    const { data: profiles, error: pError } = await query;
                    if (pError) throw pError;
                    targetEmails = profiles.map((p: any) => p.email).filter(Boolean);
                }
                targetEmails = [...new Set(targetEmails)];

                if (targetEmails.length === 0) {
                    await supabaseAdmin.from('email_queue').update({ status: 'sent', error_message: 'No recipients' }).eq('id', record.id);
                    continue;
                }

                // Attachments
                const emailAttachments = record.attachments?.map((att: any) => ({
                    filename: att.name,
                    path: att.publicUrl
                })) || [];

                // Wrap in template if not already a full HTML document
                const isFullHtml = record.body.toLowerCase().includes('<!doctype') || record.body.toLowerCase().includes('<html');
                const finalHtml = isFullHtml ? record.body : getHtmlTemplate(record.body, logoUrl, companyName, address, emailContact, fbLink, liLink, instaLink);

                // Send Batches (BCC)
                const BATCH_SIZE = 50;
                let failCount = 0;
                let successCount = 0;

                for (let i = 0; i < targetEmails.length; i += BATCH_SIZE) {
                    const batch = targetEmails.slice(i, i + BATCH_SIZE);
                    try {
                        if (smtpConfig?.smtp_host && smtpConfig?.smtp_user) {
                            // SMTP
                            const transporter = createTransport({
                                host: smtpConfig.smtp_host,
                                port: smtpConfig.smtp_port,
                                secure: smtpConfig.smtp_port === 465,
                                auth: { user: smtpConfig.smtp_user, pass: smtpConfig.smtp_pass },
                                pool: false,
                                timeout: 15000,
                            });
                            const fromAddress = `"${smtpConfig.from_name || companyName}" <${smtpConfig.from_email || smtpConfig.smtp_user}>`;

                            await transporter.sendMail({
                                from: fromAddress,
                                to: fromAddress, // Send to self, BCC others
                                bcc: batch,
                                subject: record.subject,
                                html: finalHtml,
                                attachments: emailAttachments
                            });
                        } else {
                            // RESEND
                            if (!RESEND_API_KEY) throw new Error("No SMTP and no RESEND_API_KEY");

                            const fromEmail = smtpConfig?.from_email ? `"${companyName}" <${smtpConfig.from_email}>` : `${companyName} <onboarding@resend.dev>`;

                            const res = await fetch("https://api.resend.com/emails", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization": `Bearer ${RESEND_API_KEY}`,
                                },
                                body: JSON.stringify({
                                    from: fromEmail,
                                    to: ["delivered@resend.dev"], // Safe sink
                                    bcc: batch,
                                    subject: record.subject,
                                    html: finalHtml,
                                    attachments: emailAttachments
                                })
                            });

                            if (!res.ok) {
                                const data = await res.json();
                                throw new Error(`Resend Error: ${data.message}`);
                            }
                        }
                        successCount += batch.length;
                    } catch (err: any) {
                        console.error("Batch send failed:", err);
                        failCount += batch.length;
                    }
                }

                // Update Status
                const finalStatus = failCount === 0 ? 'sent' : (successCount > 0 ? 'sent' : 'failed'); // Partial success = sent
                await supabaseAdmin.from('email_queue').update({
                    status: finalStatus,
                    updated_at: new Date().toISOString(),
                    error_message: failCount > 0 ? `Failed some: ${failCount}` : null
                }).eq('id', record.id);

                processedCount++;

            } catch (rError: any) {
                console.error(`Error processing record ${record.id}:`, rError);
                await supabaseAdmin.from('email_queue').update({
                    status: 'failed',
                    error_message: rError.message
                }).eq('id', record.id);
            }
        }

        return new Response(JSON.stringify({ success: true, processed: processedCount }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});

function getHtmlTemplate(body: string, logoUrl: string, companyName: string, address: string, emailContact: string, fb: string, li: string, insta: string) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f0f2f5; font-family: sans-serif; color: #1a1a1a;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
                <div style="height: 6px; background: linear-gradient(90deg, #0f172a, #3b82f6);"></div>
                <div style="padding: 30px 40px;">
                    ${body}
                </div>
            </div>
            <div style="margin-top: 30px; text-align: center;">
                <img src="${logoUrl}" alt="${companyName}" style="height: 50px; object-fit: contain;">
                <p style="font-size: 12px; color: #6b7280; margin-top: 20px;">
                    ${companyName} - ${address}<br>
                    <a href="mailto:${emailContact}" style="color: #6b7280;">${emailContact}</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
}
