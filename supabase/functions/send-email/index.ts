// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createTransport } from "https://esm.sh/nodemailer@6.9.7";

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
            console.log("Sending via SMTP...");
            const transporter = createTransport({
                host: smtpConfig.smtp_host,
                port: smtpConfig.smtp_port,
                secure: smtpConfig.smtp_port === 465,
                auth: {
                    user: smtpConfig.smtp_user,
                    pass: smtpConfig.smtp_pass,
                },
            });

            await transporter.sendMail({
                from: `"${smtpConfig.from_name || 'NextMove Cargo'}" <${smtpConfig.from_email || 'noreply@nextemove.com'}>`,
                to: to,
                subject: subject,
                html: html,
            });

            return new Response(JSON.stringify({ message: "Email sent via SMTP" }), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });

        } else {
            // Fallback to Resend
            console.log("Sending via Resend...");
            if (!RESEND_API_KEY) {
                throw new Error("Missing RESEND_API_KEY environment variable and no SMTP config found");
            }

            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: from || "NextMove Cargo <onboarding@resend.dev>",
                    to: [to],
                    subject: subject,
                    html: html,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                return new Response(JSON.stringify({ error: data }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

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
