import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Initialize Supabase Client
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log("Fetching Wave configuration from DB...");

        // Fetch Wave credentials from DB
        const { data: gateway, error: dbError } = await supabase
            .from('payment_gateways')
            .select('config, is_active')
            .eq('provider', 'wave')
            .single();

        if (dbError) {
            console.error("DB Error fetching gateway:", dbError);
        }
        if (!gateway) {
            console.error("No gateway found for provider 'wave'");
        }

        if (dbError || !gateway || !gateway.is_active) {
            console.error('Wave Gateway not found or inactive:', dbError);
            return new Response(JSON.stringify({ error: 'Payment method not available' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const waveToken = gateway.config?.secret_key;

        if (!waveToken) {
            console.error('Wave Secret Key is missing in DB config')
            return new Response(JSON.stringify({ error: 'Server Configuration Error: Missing Wave Key' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // 1.5 Rate Limiting
        // const clientIp = req.headers.get("x-forwarded-for") || "unknown";
        // const rateLimitKey = `checkout:${clientIp}`;

        // // Use RPC to check limit (10 attempts per minute per IP)
        // const { data: isAllowed, error: rateError } = await supabase.rpc('check_rate_limit', {
        //     request_key: rateLimitKey,
        //     limit_count: 10,
        //     sub_window_seconds: 60
        // });

        // if (rateError || isAllowed === false) {
        //     console.warn(`Payment Rate limit exceeded for IP ${clientIp}`);
        //     return new Response(JSON.stringify({ error: 'Too many payment attempts. Please wait 1 minute.' }), {
        //         status: 429,
        //         headers: { ...corsHeaders, "Content-Type": "application/json" },
        //     });
        // }

        const { amount, currency, client_reference, error_url, success_url } = await req.json()

        if (!amount || !currency || !client_reference) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        let finalSuccessUrl = success_url || 'https://nextmovecargo.com/dashboard/client/payments?status=success';
        let finalErrorUrl = error_url || 'https://nextmovecargo.com/dashboard/client/payments?status=error';

        // Wave API rejects localhost. For dev testing, we redirect to the public support page
        // which does not require login, preventing the 500 error and the login redirect loop.
        if (finalSuccessUrl.includes('localhost') || finalSuccessUrl.includes('127.0.0.1')) {
            console.log('Localhost detected, switching to public support page for Wave compatibility');
            finalSuccessUrl = 'https://nextmovecargo.com/soutien?status=success';
            finalErrorUrl = 'https://nextmovecargo.com/soutien?status=error';
        }

        console.log(`Creating Wave session for ${amount} ${currency}, ref: ${client_reference}`);
        console.log(`Redirect URLs: Success=${finalSuccessUrl}, Error=${finalErrorUrl}`);

        // Call Wave API
        const response = await fetch('https://api.wave.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${waveToken}`
            },
            body: JSON.stringify({
                amount: amount.toString(),
                currency,
                error_url: finalErrorUrl,
                success_url: finalSuccessUrl,
                client_reference
            })
        })

        const data = await response.json()

        if (!response.ok) {
            console.error('Wave API Error Status:', response.status);
            console.error('Wave API Error Body:', JSON.stringify(data));
            return new Response(JSON.stringify({
                error: 'Wave API Error',
                details: data,
                message: data.message || 'Failed to create checkout session'
            }), {
                status: response.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error('Checkout error:', error)
        // Check for specific Supabase errors
        if (error.code) {
            console.error('Supabase Error Code:', error.code)
            console.error('Supabase Error Details:', error.details)
            console.error('Supabase Error Message:', error.message)
        }
        return new Response(JSON.stringify({
            error: error.message || 'Unknown error',
            full_error: error,
            stack: error.stack
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
