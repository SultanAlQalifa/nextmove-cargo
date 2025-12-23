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
        const { shipment_id, status, client_phone, client_name, to, message } = await req.json();

        // Support both specific shipment alerts AND generic messages
        // Priority: Direct 'to' + 'message' (Chat) > Shipment Status Update
        const recipientPhone = to || client_phone;

        if (!recipientPhone) {
            return new Response(
                JSON.stringify({ error: "Missing recipient phone number" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
            );
        }

        // 1. Fetch WhatsApp Credentials
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const { data: settingsData, error: settingsError } = await supabaseAdmin
            .from('system_settings')
            .select('integrations')
            .single();

        if (settingsError || !settingsData) {
            console.error("Failed to fetch settings", settingsError);
            throw new Error("Configuration missing");
        }

        const whatsappConfig = settingsData.integrations?.whatsapp;

        if (!whatsappConfig?.enabled) {
            console.log("WhatsApp disabled in settings.");
            return new Response(
                JSON.stringify({ message: "WhatsApp integration disabled" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
            );
        }

        // 2. Construct Message Body
        let messageBody = "";

        if (message) {
            messageBody = message;
        } else if (shipment_id && status) {
            messageBody = `Bonjour ${client_name || 'Client'}, le statut de votre expédition a changé : *${status}*.`;
            if (status === 'delivered') {
                messageBody = `🎉 Bonne nouvelle ${client_name || ''} ! Votre expédition est LIVRÉE. Merci de votre confiance.`;
            } else if (status === 'in_transit') {
                messageBody = `🚢 Votre expédition est maintenant EN TRANSIT. Vous pouvez la suivre sur votre tableau de bord.`;
            }
        } else {
            return new Response(
                JSON.stringify({ error: "Missing message content or shipment details" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
            );
        }

        // 3. Send to WhatsApp API (Meta Graph API)
        const url = `https://graph.facebook.com/v17.0/${whatsappConfig.phone_number_id}/messages`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${whatsappConfig.api_key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: recipientPhone.replace('+', ''), // Meta usually requires clean number
                type: 'text',
                text: { body: messageBody },
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("WhatsApp API Error", result);
            throw new Error(`WhatsApp API failed: ${result.error?.message || 'Unknown error'}`);
        }

        return new Response(
            JSON.stringify({ success: true, api_response: result }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
        );

    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
        );
    }
});
