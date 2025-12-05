import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, wave-signature',
}

serve(async (req) => {
    console.log("WEBHOOK HIT - Method:", req.method)
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const secret = Deno.env.get('WAVE_WEBHOOK_SECRET')
        console.log("Secret configured:", !!secret)

        if (!secret) {
            console.error('WAVE_WEBHOOK_SECRET is not set')
            return new Response('Server Configuration Error', { status: 500 })
        }

        const signature = req.headers.get('wave-signature')
        const authHeader = req.headers.get('authorization')

        let isValid = false
        let bodyText = '' // Declare bodyText here to make it accessible after verification

        // Method 1: Bearer Token (observed behavior)
        if (authHeader && authHeader === `Bearer ${secret}`) {
            console.log('Signature verification passed via Authorization header')
            isValid = true
            bodyText = await req.text() // Read body if auth is successful
        }

        // Method 2: HMAC Signature (standard documentation)
        if (!isValid && signature) {
            try {
                // Read the body as text for verification
                bodyText = await req.text()

                const encoder = new TextEncoder()
                const keyData = encoder.encode(secret)
                const key = await crypto.subtle.importKey(
                    'raw',
                    keyData,
                    { name: 'HMAC', hash: 'SHA-256' },
                    false,
                    ['verify']
                )

                // Convert hex signature to Uint8Array
                const signatureBytes = new Uint8Array(
                    signature.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
                )

                isValid = await crypto.subtle.verify(
                    'HMAC',
                    key,
                    signatureBytes,
                    encoder.encode(bodyText)
                )

                if (isValid) {
                    console.log('Signature verification passed via HMAC')
                }
            } catch (err) {
                console.error('Error verifying HMAC:', err)
            }
        }

        if (!isValid) {
            console.warn('Invalid signature or auth token')
            return new Response('Unauthorized', { status: 401 })
        }

        // Read body (if not already read for HMAC)
        // Since we might have read it in the HMAC block, we need to handle that.
        // A cleaner way is to read it once at the start.

        // Let's restructure slightly to read body once.


        const event = JSON.parse(bodyText)
        console.log('Received Wave event:', event.type)

        // Initialize Supabase Admin Client
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        if (event.type === 'checkout.session.completed') {
            const session = event.data
            const clientReference = session.client_reference // This should be our transaction ID or similar

            if (!clientReference) {
                console.warn('No client_reference in session')
                return new Response('No client_reference', { status: 400 })
            }

            console.log('Processing payment for reference:', clientReference)

            // 1. Update Transaction Status
            // We assume client_reference maps to 'reference' or 'id' in transactions table
            // Or it could be 'wave_session_id' if we stored that.
            // Let's assume it's the transaction ID we generated.

            // First, find the transaction
            const { data: transaction, error: txnFetchError } = await supabaseAdmin
                .from('transactions')
                .select('*')
                .eq('reference', clientReference) // or .eq('id', clientReference) depending on what we send
                .single()

            if (txnFetchError || !transaction) {
                console.error('Transaction not found:', clientReference)
                return new Response('Transaction not found', { status: 404 })
            }

            // Update transaction
            const { error: updateError } = await supabaseAdmin
                .from('transactions')
                .update({
                    status: 'completed',
                    metadata: { ...transaction.metadata, wave_session: session }
                })
                .eq('id', transaction.id)

            if (updateError) {
                console.error('Error updating transaction:', updateError)
                throw updateError
            }

            // 2. Handle Subscription Activation (if applicable)
            // If this transaction is for a subscription, we need to activate it.
            // We can check if the transaction has a 'subscription_id' or check metadata.
            // Alternatively, we can look up the user_subscription that is 'pending' for this user.

            // For this implementation, let's assume we trigger a database function or handle it here.
            // If we have a 'user_subscriptions' record with status 'pending_payment' linked to this txn?
            // Or maybe the transaction metadata tells us what it's for.

            // Let's check if there's a pending subscription for this user
            if (transaction.user_id) {
                const { data: sub } = await supabaseAdmin
                    .from('user_subscriptions')
                    .select('*')
                    .eq('user_id', transaction.user_id)
                    .eq('status', 'pending_payment') // Assuming we use this status
                    .single()

                if (sub) {
                    await supabaseAdmin
                        .from('user_subscriptions')
                        .update({ status: 'active', start_date: new Date().toISOString() })
                        .eq('id', sub.id)
                    console.log('Activated subscription:', sub.id)
                }
            }

            return new Response(JSON.stringify({ received: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        console.error('Webhook error:', error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
