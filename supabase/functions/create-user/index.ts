import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
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
        const { email, password, fullName, role, metadata, transport_modes, referral_code_used } = await req.json()

        if (!email || !password || !role) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200, // Return 200 so UI can parse the 'error' field
            })
        }

        // 3. Create user using Service Role (Admin)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Determine base role and staff role connection
        let baseRole = 'admin'; // Default fallback
        let staffRoleId = role; // Default assumption: input role is a UUID

        // SECURITY: Privilege Escalation Prevention
        // If the creator is a FORWARDER, they can ONLY create CLIENTS.
        if (profile.role === 'forwarder') {
            console.log('Security Enforcement: Requester is Forwarder. Forcing new user role to "client".');
            baseRole = 'client';
            staffRoleId = null;
        } else {
            // Logic for Admins/System
            if (role === 'client') {
                baseRole = 'client';
                staffRoleId = null;
            } else if (role === 'forwarder') {
                baseRole = 'forwarder';
                staffRoleId = null;
            } else {
                // It is a specific Staff Role ID (UUID/Slug)
                // 1. Try to fetch the role definition to get its family
                const { data: roleDef } = await supabaseAdmin
                    .from('staff_roles')
                    .select('role_family')
                    .eq('id', role)
                    .single();

                if (roleDef?.role_family) {
                    // If the role has an explicit family defined (e.g. 'admin', 'forwarder', 'client')
                    // We usage THAT as the base role.
                    baseRole = roleDef.role_family;
                } else {
                    // Fallback Logic (if column missing or empty)
                    if (metadata?.forwarder_id) {
                        baseRole = 'forwarder';
                    } else {
                        baseRole = 'admin';
                    }
                }
            }
        }

        console.log('Creating user with email:', email, 'baseRole:', baseRole, 'staffRole:', staffRoleId);
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm for manually created users
            user_metadata: {
                full_name: fullName,
                role: baseRole, // Valid Enum Value for Trigger
                ...metadata
            }
        })

        if (createError) {
            console.error('Supabase Auth createUser error:', JSON.stringify(createError, null, 2));
            throw new Error(`Auth error: ${createError.message || createError.msg || JSON.stringify(createError)}`);
        }


        // 3.5 Prepare Referral Data
        const normalizedName = fullName.replace(/[^a-zA-Z]/g, '').toUpperCase();
        const namePrefix = normalizedName.length >= 3 ? normalizedName.substring(0, 3) : (normalizedName + "USR").substring(0, 3);
        const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
        const newReferralCode = `${namePrefix}${randomSuffix}`;

        let referrerId = null;
        if (typeof referral_code_used === 'string' && referral_code_used.trim().length > 0) {
            const { data: referrer } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('referral_code', referral_code_used.trim().toUpperCase())
                .single();
            if (referrer) {
                referrerId = referrer.id;
            }
        }

        // 4. Profile Creation / Update
        // The trigger 'on_auth_user_created' SHOULD create the profile automatically.
        // But if it fails (caught by our new Safe Trigger), the profile won't exist.
        // So we try verification first.

        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('id', newUser.user!.id)
            .single();

        if (!existingProfile) {
            console.warn('Trigger failed to create profile. Executing manual fallback creation.');
            const { error: manualProfileError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    id: newUser.user!.id,
                    email: email,
                    full_name: fullName,
                    role: baseRole,
                    avatar_url: '',
                    staff_role_id: staffRoleId, // Correctly set to NULL if client/base-forwarder
                    forwarder_id: metadata?.forwarder_id,
                    transport_modes: transport_modes || [],
                    account_status: 'active',
                    referral_code: newReferralCode,
                    referred_by: referrerId
                });

            if (manualProfileError) {
                console.error('Manual fallback profile creation failed:', manualProfileError);
                throw new Error(`Profile creation failed: ${manualProfileError.message}`);
            }
        } else {
            // Profile exists (trigger worked), so we just UPDATE it with the specific staff role and referral info
            console.log('Profile created by trigger. Updating additional fields.');
            const { error: profileUpdateError } = await supabaseAdmin
                .from('profiles')
                .update({
                    role: baseRole, // Ensure the base role is correct (trigger might have defaulted differently)
                    staff_role_id: staffRoleId, // The actual staff role UUID or NULL
                    forwarder_id: metadata?.forwarder_id,
                    transport_modes: transport_modes || [],
                    account_status: 'active',
                    referral_code: newReferralCode, // Ensure code is set even if trigger missed it (trigger has logic but this is safer)
                    referred_by: referrerId
                })
                .eq('id', newUser.user!.id);

            if (profileUpdateError) {
                console.error('Error updating profile:', profileUpdateError);
                throw new Error(`Profile update error: ${profileUpdateError.message}`);
            }
        }

        // 4.5 Create Referral Record if applicable
        if (referrerId) {
            // Fetch system settings for referral points
            let pointsToAward = 100; // default
            try {
                const { data: settingsData } = await supabaseAdmin
                    .from('system_settings')
                    .select('value')
                    .eq('key', 'referral')
                    .single();

                if (settingsData?.value?.points_per_referral) {
                    pointsToAward = Number(settingsData.value.points_per_referral);
                }
            } catch (err) {
                console.warn('Could not fetch referral settings, using default 100:', err);
            }

            const { error: referralError } = await supabaseAdmin
                .from('referrals')
                .insert({
                    referrer_id: referrerId,
                    referred_id: newUser.user!.id,
                    status: 'pending',
                    points_earned: pointsToAward
                });

            if (referralError) {
                console.error('Error creating referral record:', referralError);
                // Non-critical error, don't fail the user creation
            } else {
                // Update referrer's total points immediately (optional, or wait for validation)
                // For now, we just record the potential points. 
                // If you want to award them immediately:
                /*
                await supabaseAdmin.rpc('increment_referral_points', { 
                   user_id: referrerId, 
                   points: pointsToAward 
                });
                */
            }
        }

        // 5. Send Welcome Email via Queue
        // process-email-queue will wrap this content in the main template
        const welcomeSubject = "Bienvenue sur NextMove Cargo - Vos identifiants";
        const welcomeBody = `
                <p>Bonjour <strong>${fullName}</strong>,</p>
                <p>Votre compte a été créé avec succès sur la plateforme NextMove Cargo.</p>
                <p>Voici vos identifiants de connexion :</p>
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Email :</strong> ${email}</p>
                    <p style="margin: 5px 0;"><strong>Mot de passe temporaire :</strong> ${password}</p>
                </div>
                <p>Nous vous recommandons de changer votre mot de passe dès votre première connexion.</p>
                <p>
                    <a href="${Deno.env.get('PUBLIC_SITE_URL') || 'https://nextmovecargo.com'}/auth" 
                       style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 10px;">
                        Se connecter
                    </a>
                </p>
            `;

        const { data: emailRecord, error: emailError } = await supabaseAdmin
            .from('email_queue')
            .insert({
                sender_id: user.id, // The admin/forwarder who created this user
                recipient_group: 'specific',
                recipient_emails: [email],
                subject: welcomeSubject,
                body: welcomeBody,
                status: 'pending' // Ready to be picked up by process-email-queue
            })
            .select()
            .single();

        if (emailError) {
            console.error('Error queuing welcome email:', emailError);
        } else if (emailRecord) {
            // Manually trigger the processor
            console.log('Triggering email processor for:', emailRecord.id);

            // Fire and forget (but await the fetch initiation to ensure it's sent)
            const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-email-queue`;
            const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

            fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${serviceKey}`
                },
                body: JSON.stringify({ record: emailRecord })
            }).catch(err => console.error("Failed to trigger process-email-queue:", err));
        }

        return new Response(
            JSON.stringify({
                user: newUser.user,
                message: 'User created successfully',
                emailQueued: !emailError,
                emailError: emailError
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )
    } catch (error: unknown) {
        const err = error as Error | { message: string, msg?: string };
        console.error('Create user error:', err);
        const errorMessage = (err as any)?.message || (err as any)?.msg || JSON.stringify(err);
        return new Response(JSON.stringify({ error: errorMessage }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200, // Return 200 so UI can parse the 'error' field
        })
    }
})
