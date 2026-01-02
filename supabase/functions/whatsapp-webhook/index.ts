import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const WHATSAPP_TOKEN = Deno.env.get("WHATSAPP_TOKEN");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const SYSTEM_PROMPT = `
Tu es l'Expert Logistique de NextMove Cargo. Ton rôle est d'aider les clients sur WhatsApp.
Sois concis (max 2-3 phrases), professionnel et utilise des emojis.
Si on te demande un prix, suggère d'utiliser le calculateur sur le site.
Réponds en Français.
`;

async function getAIResponse(message: string) {
    if (!OPENAI_API_KEY) return "Désolé, je ne peux pas répondre pour le moment (IA non configurée).";

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    { role: "user", content: message }
                ],
                max_tokens: 200,
            }),
        });

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (err) {
        console.error("AI Error:", err);
        return "Je rencontre une petite difficulté technique. Un agent humain va prendre le relais.";
    }
}

async function sendWhatsAppMessage(phoneNumberId: string, to: string, text: string) {
    if (!WHATSAPP_TOKEN) {
        console.error("WHATSAPP_TOKEN missing");
        return;
    }

    try {
        const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${WHATSAPP_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                to: to,
                type: "text",
                text: { body: text },
            }),
        });
        const resData = await response.json();
        console.log("WhatsApp Send Response:", resData);
    } catch (err) {
        console.error("Failed to send WhatsApp message:", err);
    }
}

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);

        // 1. WEBHOOK VERIFICATION (GET)
        if (req.method === "GET") {
            const mode = url.searchParams.get("hub.mode");
            const token = url.searchParams.get("hub.verify_token");
            const challenge = url.searchParams.get("hub.challenge");

            // Verify Token: Retrieve from Env or hardcode for now (better to use Env)
            const VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "nextmove_cargo_secret_token";

            if (mode && token) {
                if (mode === "subscribe" && token === VERIFY_TOKEN) {
                    console.log("WEBHOOK_VERIFIED");
                    return new Response(challenge, { status: 200 });
                }
            }
            return new Response("Forbidden", { status: 403 });
        }

        // 2. MESSAGE HANDLING (POST)
        if (req.method === "POST") {
            const body = await req.json();

            if (body.object && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
                const value = body.entry[0].changes[0].value;
                const messageObj = value.messages[0];
                const phoneNumberId = value.metadata.phone_number_id;
                const from = messageObj.from;
                const msgBody = messageObj.text?.body;

                if (msgBody) {
                    console.log(`WhatsApp from ${from}: ${msgBody}`);

                    const supabaseAdmin = createClient(
                        Deno.env.get("SUPABASE_URL") ?? "",
                        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
                    );

                    // 1. Get AI Response
                    const aiReply = await getAIResponse(msgBody);

                    // 2. Send AI Response back to WhatsApp
                    await sendWhatsAppMessage(phoneNumberId, from, aiReply);

                    // 3. Save to DB (Optional Logging)
                    const { data: users } = await supabaseAdmin
                        .from('profiles')
                        .select('id')
                        .or(`phone.eq.${from},phone.eq.+${from}`)
                        .limit(1);

                    const userId = users?.[0]?.id;

                    if (userId) {
                        // Insert user message
                        await supabaseAdmin.from('messages').insert({
                            content: `[WhatsApp] ${msgBody}`,
                            sender_id: userId,
                            metadata: { source: 'whatsapp', whatsapp_id: messageObj.id }
                        });

                        // Insert AI reply
                        await supabaseAdmin.from('messages').insert({
                            content: `[WhatsApp AI] ${aiReply}`,
                            sender_id: null, // System/AI
                            metadata: { source: 'whatsapp_ai' }
                        });
                    }
                }
            }
            return new Response("EVENT_RECEIVED", { status: 200 });
        }

        return new Response("Method Not Allowed", { status: 405 });

    } catch (error: any) {
        console.error("Webhook Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
