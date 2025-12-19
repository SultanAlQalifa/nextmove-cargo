/// <reference lib="deno.ns" />
import { serve } from "std/http/server.ts";
import { createClient } from "supabase-js";
import { createTransport } from "nodemailer";
import { Buffer } from "node:buffer";

// @ts-ignore: Buffer is needed for nodemailer
globalThis.Buffer = Buffer;

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
    to: string;
    subject: string;
    html: string;
    from?: string;
}

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // 1. Verify Authentication (User context)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { data: { user }, error: authError } = await supabaseClient.auth.getUser()

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { to, subject, html, from } = await req.json() as EmailRequest;

        // 2. Fetch SMTP Settings using Service Role (Admin context)
        const adminClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // 1.5 Rate Limiting (Iron Dome)
        const rateLimitKey = `email:${user.id}`;
        const { data: isAllowed, error: rateError } = await adminClient.rpc('check_rate_limit', {
            request_key: rateLimitKey,
            limit_count: 5, // 5 emails per minute
            sub_window_seconds: 60
        });

        if (rateError || isAllowed === false) {
            console.warn(`Rate limit exceeded for user ${user.id}`);
            return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please wait 1 minute.' }), {
                status: 429,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }



        const { data: settingsData } = await adminClient
            .from('system_settings')
            .select('value')
            .eq('key', 'email')
            .single();

        const smtpConfig = settingsData?.value;

        // 3. Send Email
        if (smtpConfig?.smtp_host && smtpConfig?.smtp_user) {
            // Use SMTP
            console.log(`[SendEmail] Attempting SMTP delivery to ${to}...`);
            const transporter = createTransport({
                host: smtpConfig.smtp_host,
                port: smtpConfig.smtp_port,
                secure: smtpConfig.smtp_port === 465,
                auth: {
                    user: smtpConfig.smtp_user,
                    pass: smtpConfig.smtp_pass,
                },
                pool: false,
                timeout: 15000, // 15s timeout
            });

            try {
                await transporter.sendMail({
                    from: `"${smtpConfig.from_name || 'NextMove Cargo'}" <${smtpConfig.from_email || smtpConfig.smtp_user || 'djeylanidjitte@gmail.com'}>`,
                    to: to,
                    subject: subject,
                    html: html,
                });

                console.log(`[SendEmail] SMTP Success for ${to}`);
                return new Response(JSON.stringify({ message: "Email sent via SMTP" }), {
                    status: 200,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            } catch (smtpErr: any) {
                console.error(`[SendEmail] SMTP Failed for ${to}:`, smtpErr);
                throw new Error(`SMTP Error: ${smtpErr.message}`);
            }
        } else {
            // Fallback to Resend
            console.log(`[SendEmail] Attempting Resend delivery to ${to}...`);
            if (!RESEND_API_KEY) {
                console.error("[SendEmail] Configuration error: No SMTP and No RESEND_API_KEY");
                throw new Error("Missing RESEND_API_KEY environment variable and no SMTP config found");
            }

            const fromEmail = from || (smtpConfig?.from_email ? `"${smtpConfig.from_name || 'NextMove Cargo'}" <${smtpConfig.from_email}>` : "NextMove Cargo <onboarding@resend.dev>");

            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: fromEmail,
                    to: [to],
                    subject: subject,
                    html: html,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                console.error(`[SendEmail] Resend API Error for ${to}:`, data);
                return new Response(JSON.stringify({
                    error: `Resend Error (${res.status}): ${data.message || JSON.stringify(data)}`
                }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            console.log(`[SendEmail] Resend Success for ${to}`);
            return new Response(JSON.stringify(data), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
    } catch (error: any) {
        console.error("Error sending email:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
