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

        const response = await fetch("https://paytech.sn/api/payment/request-payment", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "API_KEY": apikey,
                "API_SECRET": secret_key,
            },
            body: new URLSearchParams({
                item_name,
                item_price: amount.toString(),
                currency: currency || "XOF",
                ref_command,
                command_name: item_name,
                env,
                success_url,
                cancel_url,
                ipn_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/paytech-webhook`,
                custom_field,
            }).toString(),
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
