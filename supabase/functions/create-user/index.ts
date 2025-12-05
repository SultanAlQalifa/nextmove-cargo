import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 1. Check if the user is authenticated
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            })
        }

        // 1.5 Check if user has permission to create users (Admin or Forwarder)
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const allowedRoles = ['admin', 'super-admin', 'forwarder']
        if (!profile || !allowedRoles.includes(profile.role)) {
            return new Response(JSON.stringify({ error: 'Forbidden: Insufficient permissions' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403,
            })
        }

        // 2. Get request body
        const { email, password, fullName, role, metadata } = await req.json()

        if (!email || !password || !role) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        // 3. Create user using Service Role (Admin)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm for manually created users
            user_metadata: {
                full_name: fullName,
                role: role, // 'driver', 'staff', etc.
                ...metadata // e.g., forwarder_id
            }
        })

        if (createError) throw createError

        // 4. Create Profile (if not automatically created by triggers)
        // We'll upsert to be safe, assuming a trigger might exist or not.
        // Ideally, your 'profiles' table has an 'id' matching auth.users.id
        if (newUser.user) {
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: newUser.user.id,
                    email: email,
                    full_name: fullName,
                    role: 'staff', // Generic role for profile
                    staff_role_id: role, // Specific staff role (driver, manager, etc.)
                    forwarder_id: metadata?.forwarder_id, // Link to the forwarder
                    account_status: 'active',
                    // Add any other necessary fields
                })

            if (profileError) {
                console.error('Error creating profile:', profileError)
                // We don't fail the whole request if profile creation fails, but it's risky.
                // In a robust system, we might rollback or retry.
            }
        }

        return new Response(
            JSON.stringify({ user: newUser.user, message: 'User created successfully' }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
