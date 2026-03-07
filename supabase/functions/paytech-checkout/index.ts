// @ts-nocheck
import { serve } from "std/http/server.ts";
import { createClient } from "supabase-js";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const { amount, currency, ref_command, item_name, custom_field, success_url, cancel_url } = await req.json();

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Get PayTech config from database
        const { data: gateway, error: gatewayError } = await supabaseClient
            .from("payment_gateways")
            .select("*")
            .eq("provider", "paytech")
            .single();

        if (gatewayError || !gateway) {
            throw new Error("PayTech gateway not configured");
        }

        const { apikey, secret_key } = gateway.config;
        const env = gateway.is_test_mode ? "test" : "prod";

        const paytechPayload = {
            item_name,
            item_price: amount.toString(),
            currency: currency || "XOF",
            ref_command,
            command_name: item_name,
            env,
            success_url: "https://nextmovecargo.com/dashboard/forwarder/wallet?payment=success",
            cancel_url: "https://nextmovecargo.com/dashboard/forwarder/wallet?payment=cancel",
            ipn_url: `https://dkbnmnpxoesvkbnwuyle.supabase.co/functions/v1/paytech-webhook`,
            custom_field,
        };

        console.log("PAYLOAD:", JSON.stringify(paytechPayload));

        const response = await fetch("https://paytech.sn/api/payment/request-payment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "API_KEY": apikey,
                "API_SECRET": secret_key,
            },
            body: JSON.stringify(paytechPayload),
        });

        const result = await response.json();
        console.log("Réponse brute PayTech API:", JSON.stringify(result));

        return new Response(JSON.stringify(result), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
