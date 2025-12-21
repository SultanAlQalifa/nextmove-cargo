import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { to, content } = await req.json();

        if (!to || !content) {
            return new Response(
                JSON.stringify({ error: "Missing required fields: to, content" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
            );
        }

        // Normalize phone number (ensure + prefix for logic)
        const recipients = Array.isArray(to) ? to : [to];

        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Fetch settings
        const { data: settingsData, error: settingsError } = await supabaseAdmin
            .from('system_settings')
            .select('value')
            .eq('key', 'integrations')
            .single();

        if (settingsError || !settingsData) {
            console.error("Failed to fetch settings", settingsError);
            throw new Error("Configuration missing");
        }

        const intechConfig = settingsData.value?.intech_sms;
        const twilioConfig = settingsData.value?.twilio;

        const results = [];

        for (const recipient of recipients) {
            const isSenegal = recipient.startsWith("+221") || recipient.startsWith("221");
            let sent = false;
            let providerUsed = "none";
            let errorMsg = "";

            // --- STRATEGY: Hybrid Routing ---

            // 1. Try Intech SMS (Priority for Senegal)
            if (isSenegal && intechConfig?.enabled) {
                try {
                    console.log(`Attempting Intech SMS for ${recipient}`);
                    const response = await fetch("https://gateway.intechsms.sn/api/send-sms", {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            app_key: intechConfig.app_key,
                            sender: intechConfig.sender || "NextMove",
                            content: content,
                            msisdn: [recipient]
                        }),
                    });
                    const result = await response.json();
                    if (!result.error) {
                        sent = true;
                        providerUsed = "intech";
                    } else {
                        throw new Error(result.msg || "Intech Error");
                    }
                } catch (e) {
                    console.warn(`Intech SMS failed for ${recipient}:`, e);
                    errorMsg = `Intech failed: ${e.message}`;
                }
            }

            // 2. Try Twilio (International OR Fallback for Senegal)
            if (!sent && twilioConfig?.enabled) {
                try {
                    console.log(`Attempting Twilio for ${recipient} (Fallback/Intl)`);
                    const accountSid = twilioConfig.account_sid;
                    const authToken = twilioConfig.auth_token;
                    const fromNumber = twilioConfig.from_number;

                    const body = new URLSearchParams();
                    body.append('To', recipient);
                    body.append('From', fromNumber);
                    body.append('Body', content);

                    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Basic ${btoa(accountSid + ':' + authToken)}`,
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        body: body
                    });

                    const result = await response.json();

                    if (response.ok) {
                        sent = true;
                        providerUsed = "twilio";
                    } else {
                        throw new Error(result.message || "Twilio Error");
                    }
                } catch (e) {
                    console.error(`Twilio failed for ${recipient}:`, e);
                    errorMsg += ` | Twilio failed: ${e.message}`;
                }
            }

            results.push({ recipient, sent, provider: providerUsed, error: sent ? null : errorMsg });
        }

        return new Response(
            JSON.stringify({ success: true, results }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );

    } catch (error: any) {
        console.error("Function error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
        );
    }
});
