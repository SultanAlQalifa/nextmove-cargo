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
        const cpm_trans_id = body.get("cpm_trans_id");
        const cpm_site_id = body.get("cpm_site_id");
        const cpm_trans_date = body.get("cpm_trans_date");
        const cpm_amount = body.get("cpm_amount");
        const cpm_currency = body.get("cpm_currency");
        const cpm_custom = body.get("cpm_custom");
        const cpm_designation = body.get("cpm_designation");
        const cpm_status = body.get("cpm_status");
        const cpm_error_message = body.get("cpm_error_message");
        const cpm_payid = body.get("cpm_payid");
        const cpm_payment_date = body.get("cpm_payment_date");
        const cpm_payment_time = body.get("cpm_payment_time");
        const cpm_error_code = body.get("cpm_error_code");
        const cpm_resultat = body.get("cpm_resultat");
        const cpm_trans_status = body.get("cpm_trans_status");
        const cpm_payment_method = body.get("cpm_payment_method");

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Get CinetPay config to verify Site ID
        const { data: gateway, error: gatewayError } = await supabaseClient
            .from("payment_gateways")
            .select("*")
            .eq("provider", "cinetpay")
            .single();

        if (gatewayError || !gateway) {
            throw new Error("CinetPay gateway not configured");
        }

        if (cpm_site_id !== gateway.config.site_id) {
            throw new Error("Invalid Site ID");
        }

        // Process only successful payment results
        if (cpm_resultat === "00") {
            const metadata = JSON.parse(cpm_custom as string || "{}");
            const { shipment_id } = metadata;

            // Update the transaction in our database
            const { error: updateError } = await supabaseClient
                .from("transactions")
                .update({ status: "completed" })
                .eq("reference", cpm_trans_id)
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
        } else {
            // Handle failure if needed
            console.log(`Payment failed for ${cpm_trans_id}: ${cpm_error_message}`);
            await supabaseClient
                .from("transactions")
                .update({ status: "failed" })
                .eq("reference", cpm_trans_id)
                .eq("status", "pending");
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
