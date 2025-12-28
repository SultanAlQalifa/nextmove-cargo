/// <reference lib="deno.ns" />
import { serve } from "std/http/server.ts"
import { createClient } from "supabase-js"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Parse Body safely
        let body;
        try {
            const rawBody = await req.text();
            body = rawBody ? JSON.parse(rawBody) : {};
        } catch (e) {
            console.error("Failed to parse request body:", e);
            body = {};
        }

        const { email, password, fullName, role, phone, metadata, transport_modes, referral_code_used, brand_settings, logo_url } = body;

        console.log('Public Signup Request:', { email, hasPassword: !!password, hasLogo: !!logo_url });

        if (!email) {
            return new Response(JSON.stringify({ error: 'Email is required' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            })
        }

        const finalFullName = fullName || email.split('@')[0];

        // Use provided logo_url or fallback to brand_settings or default
        const logoUrl = logo_url || brand_settings?.logo_url || "https://dkbnmnpxoesvkbnwuyle.supabase.co/storage/v1/object/public/branding/logo.png";
        const siteUrl = Deno.env.get('PUBLIC_SITE_URL') || 'https://nextmovecargo.com';

        let user;
        let emailSubject;
        let emailBody;

        // --- HTML TEMPLATE HELPER ---
        const getHtmlTemplate = (title: string, message: string, buttonText: string, link: string, bottomText: string) => `
            <!DOCTYPE html>
            <html>
            <head> 
                <meta charset="utf-8"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> 
            </head>
            <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <!-- Logo -->
                    <div style="text-align: center; margin-bottom: 30px; margin-top: 20px;">
                        <img src="${logoUrl}" alt="NextMove Cargo" style="height: 40px; width: auto; display: inline-block;">
                    </div>
                    <!-- Card -->
                    <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                        <h2 style="margin-top: 0; color: #0f172a; font-size: 20px; text-align: center;">${title}</h2>
                        <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                            ${message}
                        </p>
                        <!-- Button -->
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${link}" style="background-color: #2563eb; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">
                                ${buttonText}
                            </a>
                        </div>
                        <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin-top: 24px; word-break: break-all;">
                            ${bottomText} <br>
                            <a href="${link}" style="color: #2563eb;">${link}</a>
                        </p>
                    </div>
                    <!-- Footer -->
                    <div style="text-align: center; margin-top: 30px;">
                        <p style="font-size: 12px; color: #94a3b8;">
                            © ${new Date().getFullYear()} NextMove Cargo. Tous droits réservés.
                        </p>
                    </div>
                </div>
            </body>
            </html>
        `;


        if (password) {
            // A. PASSWORD FLOW
            console.log(`[PublicSignup] Starting Password Flow for ${email}...`);
            const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: {
                    full_name: finalFullName,
                    role: role || 'client',
                    referral_code_used: referral_code_used,
                    ...metadata
                }
            });

            if (createError) {
                console.error("[PublicSignup] Auth Create Error:", createError);
                throw createError;
            }
            user = userData.user;

            emailSubject = "Bienvenue sur NextMove Cargo ! 🚀";
            const loginLink = `${siteUrl}/login`;
            emailBody = getHtmlTemplate(
                `Bienvenue, ${finalFullName} !`,
                `Votre compte a été créé avec succès. Vous pouvez maintenant accéder à votre espace pour gérer vos expéditions.`,
                "Accéder à mon espace",
                loginLink,
                "Si le bouton ne fonctionne pas, copiez ce lien :"
            );

        } else {
            // B. MAGIC LINK FLOW
            console.log(`[PublicSignup] Starting Magic Link Flow for ${email}...`);
            const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
                type: 'magiclink',
                email,
                options: {
                    redirectTo: `${siteUrl}/dashboard`,
                    data: {
                        full_name: finalFullName,
                        role: role || 'client',
                        referral_code_used: referral_code_used,
                        ...metadata
                    }
                }
            });

            if (linkError) {
                console.error("[PublicSignup] Magic Link Generate Error:", linkError);
                throw linkError;
            }
            user = linkData.user;
            const actionLink = linkData.properties?.action_link;

            if (!actionLink) {
                console.error("[PublicSignup] Critical: action_link is missing in linkData.properties");
                throw new Error("Failed to generate magic link properties");
            }

            console.log(`[PublicSignup] Magic Link generated successfully for ${email}`);
            emailSubject = "Connexion à NextMove Cargo 🔐";
            emailBody = getHtmlTemplate(
                "Connexion Sécurisée",
                "Vous avez demandé un lien de connexion sans mot de passe. Cliquez sur le bouton ci-dessous pour accéder instantanément à votre tableau de bord.",
                "Me connecter maintenant",
                actionLink,
                "Ce lien est valide pour une seule utilisation. Si le bouton ne fonctionne pas :"
            );
        }

        if (!user) throw new Error("User creation failed");

        // 2. Initial Profile Setup (Ensures Referral Code etc)
        const normalizedName = finalFullName.replace(/[^a-zA-Z]/g, '').toUpperCase();
        const namePrefix = normalizedName.length >= 3 ? normalizedName.substring(0, 3) : (normalizedName + "USR").substring(0, 3);
        const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
        const newReferralCode = `${namePrefix}${randomSuffix}`;

        // Check referrer
        let referrerId = null;
        if (referral_code_used) {
            const { data: referrer } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('referral_code', referral_code_used.trim().toUpperCase())
                .maybeSingle();
            if (referrer) referrerId = referrer.id;
        }

        // Upsert Profile Logic (Safety compatible with trigger)
        // We do a "dumb" update here just to patch fields that the trigger might check or that we want to enforce.
        // Actually, the trigger 'handle_new_user' logic handles creation. We just UPDATE here to be sure about specific fields.
        await supabaseAdmin.from('profiles').update({
            full_name: finalFullName,
            role: role || 'client',
            referral_code: newReferralCode,
            referred_by: referrerId,
            transport_modes: (role === 'forwarder' ? transport_modes : []) || [],
        }).eq('id', user.id);


        // 3. Send Email (via Queue)
        const { data: emailRecord, error: emailError } = await supabaseAdmin
            .from('email_queue')
            .insert({
                sender_id: null, // System sender to avoid FK race condition with profiles
                recipient_group: 'specific',
                recipient_emails: [email],
                subject: emailSubject,
                body: emailBody,
                status: 'pending'
            })
            .select()
            .single();

        if (emailError) {
            console.error("[PublicSignup] Email insertion error:", emailError);
            return new Response(JSON.stringify({
                success: true,
                message: password ? "Compte créé. Un email de confirmation a été envoyé." : "Lien magique envoyé. Vérifiez votre boîte de réception.",
                email_error: emailError.message,
                user
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        if (emailRecord) {
            // Trigger processor
            const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/process-email-queue`;
            const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
            try {
                const triggerResp = await fetch(functionUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${serviceKey}`
                    },
                    body: JSON.stringify({ record: emailRecord })
                });
                const triggerResult = await triggerResp.json();
                console.log("Queue trigger result:", triggerResult);
            } catch (e) {
                console.error("Queue trigger error:", e);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: password ? "Compte créé." : "Lien magique envoyé !",
            user
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error: any) {
        console.error('Signup Error:', error);
        // Return 200 with error property to prevent client-side "FunctionsHttpError"
        // and allow the client to read the actual error message in the body.
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    }
})
