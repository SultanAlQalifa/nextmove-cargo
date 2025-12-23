import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
                } else {
                    return new Response("Forbidden", { status: 403 });
                }
            }
            return new Response("Bad Request", { status: 400 });
        }

        // 2. MESSAGE HANDLING (POST)
        if (req.method === "POST") {
            const body = await req.json();
            console.log("Incoming Webhook Body:", JSON.stringify(body, null, 2));

            // Check if it's a WhatsApp status update or message
            if (body.object) {
                if (
                    body.entry &&
                    body.entry[0].changes &&
                    body.entry[0].changes[0] &&
                    body.entry[0].changes[0].value.messages &&
                    body.entry[0].changes[0].value.messages[0]
                ) {
                    const messageObj = body.entry[0].changes[0].value.messages[0];
                    const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
                    const from = messageObj.from; // Phone number (e.g., 221773950119)
                    const msgBody = messageObj.text?.body; // Text content
                    const msgType = messageObj.type;

                    if (msgType !== 'text' || !msgBody) {
                        // For now, only handle text. TODO: Handle images/docs
                        return new Response("EVENT_RECEIVED", { status: 200 });
                    }

                    console.log(`Received message from ${from}: ${msgBody}`);

                    // Initialize Supabase Admin Client
                    const supabaseAdmin = createClient(
                        Deno.env.get("SUPABASE_URL") ?? "",
                        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
                    );

                    // A. FIND USER BY PHONE
                    // Note: "from" usually includes country code without + (e.g. 22177...)
                    // We search loosely or precise depending on DB format. 
                    // Ideally DB has normalized phone numbers. We try valid formats.
                    const { data: users, error: userError } = await supabaseAdmin
                        .from('profiles')
                        .select('id, full_name, email')
                        .or(`phone.eq.${from},phone.eq.+${from}`)
                        .limit(1);

                    let userId = null;
                    let userName = "WhatsApp User";

                    if (users && users.length > 0) {
                        userId = users[0].id;
                        userName = users[0].full_name || userName;
                        console.log(`Found existing user: ${userId} (${userName})`);
                    } else {
                        console.log("User not found for phone:", from);
                        // TODO: Create a "Guest" user or handle unknown. 
                        // For now, we abort or could create a specific LEAD.
                        // Let's TRY to find an existing conversation with metadata 'whatsapp_phone' = from
                    }

                    if (userId) {
                        // B. FIND OR CREATE CONVERSATION
                        // We look for a conversation where this user is a participant
                        // For simplicity, we just find the most recent updated conversation for this user
                        const { data: conversations } = await supabaseAdmin
                            .from('conversation_participants')
                            .select('conversation_id')
                            .eq('user_id', userId)
                            .limit(1);

                        let conversationId = null;

                        if (conversations && conversations.length > 0) {
                            conversationId = conversations[0].conversation_id;
                        } else {
                            // Create new conversation
                            const { data: newConv, error: createError } = await supabaseAdmin
                                .from('conversations')
                                .insert({
                                    last_message: msgBody,
                                    last_message_at: new Date().toISOString(),
                                    // metadata: { source: 'whatsapp', phone: from } // If we had metadata col
                                })
                                .select()
                                .single();

                            if (createError) {
                                console.error("Failed to create conv", createError);
                                throw createError;
                            }
                            conversationId = newConv.id;

                            // Add User as Participant
                            await supabaseAdmin
                                .from('conversation_participants')
                                .insert({ conversation_id: conversationId, user_id: userId });

                            // Add Admin/Support as Participant (Optional, or rely on them seeing it in 'Unassigned')
                            // For now, we assume Support sees all conversations
                        }

                        // C. INSERT MESSAGE
                        const { error: msgError } = await supabaseAdmin
                            .from('messages')
                            .insert({
                                conversation_id: conversationId,
                                sender_id: userId,
                                content: `[WhatsApp] ${msgBody}`, // Prefix to indicate source
                                // metadata: { whatsapp_id: messageObj.id } 
                            });

                        if (msgError) console.error("Failed to insert message", msgError);
                        else console.log("Message inserted into DB");

                        // Update conversation timestamp
                        await supabaseAdmin
                            .from('conversations')
                            .update({
                                last_message: msgBody,
                                last_message_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                            })
                            .eq('id', conversationId);
                    } else {
                        // Handle Unknown User (Lead) - Create a "Lead" profile?
                        // For valid "Omnichannel", we usually create a lead.
                        // We'll return 200 to acknowledge receipt anyway.
                        console.log("Skipping DB insert for unknown user");
                    }

                    return new Response("EVENT_RECEIVED", { status: 200 });
                } else {
                    return new Response("NOT_A_MESSAGE_EVENT", { status: 404 });
                }
            } else {
                return new Response("NOT_A_PAGE_OBJECT", { status: 404 });
            }
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
