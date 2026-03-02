import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENWEATHER_API_KEY = Deno.env.get("OPENWEATHER_API_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        if (!OPENWEATHER_API_KEY) {
            return new Response(JSON.stringify({ error: "OPENWEATHER_API_KEY not configured" }), { status: 500, headers: corsHeaders });
        }

        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 1. Fetch active shipments (in transit or pending) with weather alerts enabled for forwarder
        const { data: shipments, error: fetchError } = await supabaseAdmin
            .from('shipments')
            .select(`
                id, 
                tracking_number, 
                origin_port, 
                destination_port, 
                forwarder_id,
                forwarder:profiles!forwarder_id(automation_settings)
            `)
            .in('status', ['in_transit', 'pending_shipping', 'pending_pickup']);

        if (fetchError) throw fetchError;

        let alertCount = 0;

        for (const shipment of (shipments || [])) {
            // Check if user has weather alerts enabled
            const settings = shipment.forwarder?.automation_settings;
            if (settings?.weather_alert_enabled === false) continue;

            // Check weather at destination port (most critical for delays)
            const city = shipment.destination_port.split(',')[0].trim();
            const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPENWEATHER_API_KEY}&units=metric`);

            if (!weatherRes.ok) {
                console.error(`Weather check failed for ${city}: ${weatherRes.statusText}`);
                continue;
            }

            const weatherData = await weatherRes.json();
            const condition = weatherData.weather[0]?.main?.toLowerCase();
            const windSpeed = weatherData.wind?.speed; // m/s

            // Thresholds for alert: Storm, extreme wind (> 20m/s ~ 72km/h)
            if (condition.includes('storm') || condition.includes('thunderstorm') || windSpeed > 20) {

                // 2. Create Notification
                await supabaseAdmin.from('notifications').insert({
                    user_id: shipment.forwarder_id,
                    type: 'weather_alert',
                    title: `Alerte Météo : ${shipment.tracking_number}`,
                    message: `Conditions extrêmes détectées à ${city} (${condition}, vent ${Math.round(windSpeed * 3.6)}km/h). Prévoyez de potentiels retards.`,
                    link: `/dashboard/forwarder/shipments/${shipment.id}`,
                    read: false
                });

                alertCount++;
                console.log(`Weather alert triggered for ${shipment.tracking_number} at ${city}`);
            }
        }

        return new Response(JSON.stringify({ success: true, alerts_sent: alertCount }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
