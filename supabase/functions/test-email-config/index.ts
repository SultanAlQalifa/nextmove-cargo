/// <reference lib="deno.ns" />
import { serve } from "std/http/server.ts";
import { createClient } from "supabase-js";
import { createTransport } from "nodemailer";
import { Buffer } from "node:buffer";

// @ts-ignore: Buffer is needed for nodemailer
globalThis.Buffer = Buffer;

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        console.log("[TestEmail] Function invoked");
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            console.error("[TestEmail] Missing Authorization header");
            return new Response(JSON.stringify({ success: false, error: 'Authorization header is required' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Verify Admin Auth
        const supabaseClient = createClient(
            SUPABASE_URL,
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
        );
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

        if (authError || !user) {
            console.error("[TestEmail] Auth error:", authError);
            return new Response(JSON.stringify({ success: false, error: 'Unauthorized: ' + (authError?.message || 'No user') }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Fetch user profile to check admin role
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin' && profile?.role !== 'super-admin') {
            return new Response(JSON.stringify({ success: false, error: 'Admin access required' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // Fetch current email settings or use provided config
        let smtpConfig;
        try {
            const body = await req.clone().json();
            if (body?.config) {
                console.log("[TestEmail] Using provided config from request body");
                smtpConfig = body.config;
            }
        } catch (e) {
            // No body or invalid JSON, fallback to DB
        }

        if (!smtpConfig) {
            console.log("[TestEmail] Fetching config from database");
            const { data: emailData } = await supabaseAdmin
                .from('system_settings')
                .select('value')
                .eq('key', 'email')
                .single();
            smtpConfig = emailData?.value;
        }
        const testRecipient = user.email;

        console.log(`[TestEmail] Starting test for ${testRecipient}...`);

        if (smtpConfig?.smtp_host && smtpConfig?.smtp_user) {
            console.log(`[TestEmail] Testing SMTP delivery...`);
            const transporter = createTransport({
                host: smtpConfig.smtp_host,
                port: smtpConfig.smtp_port,
                secure: smtpConfig.smtp_port === 465,
                auth: {
                    user: smtpConfig.smtp_user,
                    pass: smtpConfig.smtp_pass,
                },
                pool: false,
                timeout: 15000,
            });

            try {
                const from_email = smtpConfig.from_email || smtpConfig.smtp_user || "contact@nextmovecargo.com";
                await transporter.sendMail({
                    from: `"${smtpConfig.from_name || 'NextMove Test'}" <${from_email}>`,
                    to: testRecipient,
                    subject: "NextMove Cargo - Test de Configuration Email 🧪",
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #333;">
                            <h1 style="color: #059669;">✅ Test réussi !</h1>
                            <p>Félicitations, votre configuration <b>SMTP</b> fonctionne correctement.</p>
                        </div>
                    `
                });
                return new Response(JSON.stringify({ success: true, provider: 'SMTP' }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200,
                });
            } catch (smtpError: any) {
                return new Response(JSON.stringify({
                    success: false,
                    error: `Erreur SMTP (${smtpError.code || 'UNKNOWN'}): ${smtpError.message}`,
                }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200,
                });
            }
        } else {
            console.log(`[TestEmail] Testing Resend fallback...`);
            if (!RESEND_API_KEY) {
                return new Response(JSON.stringify({ success: false, error: "Configuration absente : Ni SMTP ni Resend API Key n'ont été trouvés." }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200,
                });
            }

            const fromEmail = smtpConfig?.from_email ? `"${smtpConfig.from_name || 'NextMove Test'}" <${smtpConfig.from_email}>` : `NextMove Test <onboarding@resend.dev>`;

            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: fromEmail,
                    to: [testRecipient],
                    subject: "NextMove Cargo - Test de Configuration Resend 🧪",
                    html: `<h1>✅ Test réussi !</h1><p>Votre configuration Resend fonctionne avec l'expéditeur : ${fromEmail}</p>`
                }),
            });

            if (!res.ok) {
                const responseData = await res.json();
                console.error("[TestEmail] Resend error:", responseData);
                return new Response(JSON.stringify({ success: false, error: `Resend Error: ${responseData.message || JSON.stringify(responseData)}` }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                    status: 200,
                });
            }

            return new Response(JSON.stringify({ success: true, provider: 'Resend' }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }
    } catch (error: any) {
        return new Response(JSON.stringify({ success: false, error: `Erreur interne: ${error.message}` }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    }
});
