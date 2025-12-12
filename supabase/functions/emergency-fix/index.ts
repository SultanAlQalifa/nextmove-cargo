// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

declare const Deno: any;


const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Create Supabase client with Admin (Service Role) Key
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Emergency Probe: Safe System Health Check
        // Checks basic connectivity to critical tables

        const { data, error } = await supabaseAdmin
            .from('staff_roles')
            .select('count')
            .single();

        return new Response(
            JSON.stringify({
                status: 'operational',
                message: 'System is healthy',
                db_check: error ? 'failed' : 'success'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
    } catch (error: any) {
        // If it's the role not found error, we might want to see what WAS found
        let availableRoles = [];
        try {
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );
            const { data } = await supabaseAdmin.from('staff_roles').select('id, name');
            availableRoles = data || [];
        } catch (e) { }

        return new Response(
            JSON.stringify({ error: error.message, available_roles: availableRoles }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
    }
});
