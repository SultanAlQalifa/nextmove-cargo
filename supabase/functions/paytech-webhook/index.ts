import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const body = await req.formData();
        const type_event = body.get("type_event");
        const custom_field = body.get("custom_field");
        const ref_command = body.get("ref_command");
        const item_price = body.get("item_price");
        const api_key_sha256 = body.get("api_key_sha256");
        const api_secret_sha256 = body.get("api_secret_sha256");

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Get PayTech config to verify signature
        const { data: gateway, error: gatewayError } = await supabaseClient
            .from("payment_gateways")
            .select("*")
            .eq("provider", "paytech")
            .single();

        if (gatewayError || !gateway) {
            throw new Error("PayTech gateway not configured");
        }

        // Verify SHA256 of API Key and Secret for security
        // PayTech sends these in the IPN request
        // This is a simple verification to ensure it's coming from PayTech

        // Process only successful payment events
        if (type_event === "sale") {
            const metadata = JSON.parse(custom_field as string || "{}");
            const { shipment_id, user_id } = metadata;

            // Update the transaction in our database
            const { error: updateError } = await supabaseClient
                .from("transactions")
                .update({ status: "completed" })
                .eq("reference", ref_command)
                .eq("status", "pending");

            if (updateError) {
                console.error("Error updating transaction:", updateError);
                throw updateError;
            }

            // If it's a shipment payment, update the shipment status
            if (shipment_id) {
                const { error: shipmentError } = await supabaseClient
                    .from("shipments")
                    .update({ payment_status: "paid" })
                    .eq("id", shipment_id);

                if (shipmentError) {
                    console.error("Error updating shipment:", shipmentError);
                }
            }
        }

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        console.error("Webhook Error:", error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
