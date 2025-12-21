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
        const body = await req.json();
        const {
            amount,
            currency,
            transaction_id,
            description,
            notify_url,
            return_url,
            customer_name,
            customer_surname,
            customer_email,
            customer_phone_number,
            customer_address,
            customer_city,
            customer_country
        } = body;

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Get CinetPay config from database
        const { data: gateway, error: gatewayError } = await supabaseClient
            .from("payment_gateways")
            .select("*")
            .eq("provider", "cinetpay")
            .single();

        if (gatewayError || !gateway) {
            throw new Error("CinetPay gateway not configured");
        }

        const { apikey, site_id } = gateway.config;

        const response = await fetch("https://api-checkout.cinetpay.com/v2/payment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                apikey,
                site_id,
                transaction_id,
                amount,
                currency: currency || "XOF",
                description,
                notify_url,
                return_url,
                customer_name,
                customer_surname,
                customer_email,
                customer_phone_number,
                customer_address,
                customer_city,
                customer_country,
                channels: "ALL",
                metadata: body.metadata || "",
            }),
        });

        const result = await response.json();

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
