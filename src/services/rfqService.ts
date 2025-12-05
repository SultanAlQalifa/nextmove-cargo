// ═══════════════════════════════════════════════════════════════
// NextMove Cargo - RFQ Service
// Service layer for Request for Quote functionality
// ═══════════════════════════════════════════════════════════════

import { supabase } from '../lib/supabase';
import type {
    RFQRequest,
    CreateRFQData,
    RFQFilters,
    RFQOffer,
    CreateOfferData,
    OfferFilters,
    RFQWithOffers,
    OfferWithRFQ,
    OfferWithForwarder,
    RFQWithClient,
} from '../types/rfq';

// ═══ CLIENT FUNCTIONS ═══

/**
 * Create a new RFQ request (draft by default)
 */
export async function createRFQ(data: CreateRFQData): Promise<RFQRequest> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Ensure profile exists to avoid foreign key constraint error
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

    if (!profile) {
        // Create missing profile
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({
                id: user.id,
                email: user.email,
                role: user.user_metadata?.role || 'client',
                full_name: user.user_metadata?.full_name || 'User',
            });

        if (profileError) {
            console.error('Error creating missing profile:', profileError);
            // Continue anyway, maybe the trigger handled it or it's a race condition
        }
    }

    const { data: rfq, error } = await supabase
        .from('rfq_requests')
        .insert({
            ...data,
            client_id: user.id,
            status: 'draft',
            quantity: data.quantity || 1,
            budget_currency: data.budget_currency || 'XOF',
        })
        .select()
        .single();

    if (error) throw error;
    return rfq;
}

/**
 * Update an existing RFQ (only if status = draft)
 */
export async function updateRFQ(
    id: string,
    data: Partial<CreateRFQData>
): Promise<RFQRequest> {
    const { data: rfq, error } = await supabase
        .from('rfq_requests')
        .update(data)
        .eq('id', id)
        .eq('status', 'draft')
        .select()
        .single();

    if (error) throw error;
    return rfq;
}

/**
 * Publish an RFQ (change status from draft to published)
 */
export async function publishRFQ(id: string): Promise<RFQRequest> {
    const { data: rfq, error } = await supabase
        .from('rfq_requests')
        .update({
            status: 'published',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })
        .eq('id', id)
        .eq('status', 'draft')
        .select()
        .single();

    if (error) throw error;
    return rfq;
}

/**
 * Cancel an RFQ
 */
export async function cancelRFQ(id: string): Promise<RFQRequest> {
    const { data: rfq, error } = await supabase
        .from('rfq_requests')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return rfq;
}

/**
 * Delete an RFQ (only if status = draft)
 */
export async function deleteRFQ(id: string): Promise<void> {
    const { error } = await supabase
        .from('rfq_requests')
        .delete()
        .eq('id', id)
        .eq('status', 'draft');

    if (error) throw error;
}

/**
 * Get client's RFQs with optional filters
 */
export async function getMyRFQs(filters?: RFQFilters): Promise<RFQRequest[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
        .from('rfq_requests')
        .select('*')
        .eq('client_id', user.id)
        .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
        if (Array.isArray(filters.status)) {
            query = query.in('status', filters.status);
        } else {
            query = query.eq('status', filters.status);
        }
    }

    if (filters?.transport_mode) {
        query = query.eq('transport_mode', filters.transport_mode);
    }

    if (filters?.service_type) {
        query = query.eq('service_type', filters.service_type);
    }

    if (filters?.origin_port) {
        query = query.ilike('origin_port', `%${filters.origin_port}%`);
    }

    if (filters?.destination_port) {
        query = query.ilike('destination_port', `%${filters.destination_port}%`);
    }

    if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
    }

    if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

/**
 * Get a single RFQ with all its offers
 */
export async function getRFQWithOffers(id: string): Promise<RFQWithOffers> {
    const { data: rfq, error: rfqError } = await supabase
        .from('rfq_requests')
        .select('*')
        .eq('id', id)
        .single();

    if (rfqError) throw rfqError;

    const { data: offers, error: offersError } = await supabase
        .from('rfq_offers')
        .select('*')
        .eq('rfq_id', id)
        .order('total_price', { ascending: true });

    if (offersError) throw offersError;

    return {
        ...rfq,
        offers: offers || [],
        offers_count: offers?.length || 0,
    };
}

// ═══ FORWARDER FUNCTIONS ═══

/**
 * Get available RFQs for forwarders (published, not expired, targeted or general)
 */
export async function getAvailableRFQs(filters?: RFQFilters): Promise<RFQRequest[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
        .from('rfq_requests')
        .select('*')
        .in('status', ['published', 'offers_received'])
        .or(`specific_forwarder_id.is.null,specific_forwarder_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

    // Apply filters (same as getMyRFQs)
    if (filters?.transport_mode) {
        query = query.eq('transport_mode', filters.transport_mode);
    }

    if (filters?.service_type) {
        query = query.eq('service_type', filters.service_type);
    }

    if (filters?.origin_port) {
        query = query.ilike('origin_port', `%${filters.origin_port}%`);
    }

    if (filters?.destination_port) {
        query = query.ilike('destination_port', `%${filters.destination_port}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

/**
 * Create an offer for an RFQ
 */
export async function createOffer(data: CreateOfferData): Promise<RFQOffer> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: offer, error } = await supabase
        .from('rfq_offers')
        .insert({
            ...data,
            forwarder_id: user.id,
            currency: data.currency || 'XOF',
            validity_days: data.validity_days || 7,
            status: 'pending',
        })
        .select()
        .single();

    if (error) throw error;
    return offer;
}

/**
 * Update an offer (only if status = pending)
 */
export async function updateOffer(
    id: string,
    data: Partial<CreateOfferData>
): Promise<RFQOffer> {
    const { data: offer, error } = await supabase
        .from('rfq_offers')
        .update(data)
        .eq('id', id)
        .eq('status', 'pending')
        .select()
        .single();

    if (error) throw error;
    return offer;
}

/**
 * Withdraw an offer
 */
export async function withdrawOffer(id: string): Promise<RFQOffer> {
    const { data: offer, error } = await supabase
        .from('rfq_offers')
        .update({ status: 'withdrawn' })
        .eq('id', id)
        .eq('status', 'pending')
        .select()
        .single();

    if (error) throw error;
    return offer;
}

/**
 * Get forwarder's offers with optional filters
 */
export async function getMyOffers(filters?: OfferFilters): Promise<OfferWithRFQ[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
        .from('rfq_offers')
        .select(`
            *,
            rfq:rfq_requests(*)
        `)
        .eq('forwarder_id', user.id)
        .order('submitted_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
        if (Array.isArray(filters.status)) {
            query = query.in('status', filters.status);
        } else {
            query = query.eq('status', filters.status);
        }
    }

    if (filters?.rfq_id) {
        query = query.eq('rfq_id', filters.rfq_id);
    }

    if (filters?.date_from) {
        query = query.gte('submitted_at', filters.date_from);
    }

    if (filters?.date_to) {
        query = query.lte('submitted_at', filters.date_to);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

// ═══ CLIENT - OFFER MANAGEMENT ═══

/**
 * Get offers for a specific RFQ (with forwarder details)
 */
export async function getOffersForRFQ(rfqId: string): Promise<OfferWithForwarder[]> {
    const { data, error } = await supabase
        .from('rfq_offers')
        .select(`
            *,
            forwarder:profiles!forwarder_id(
                id,
                company_name,
                email,
                phone
            )
        `)
        .eq('rfq_id', rfqId)
        .order('total_price', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Accept an offer (and reject all others for the same RFQ)
 */
export async function acceptOffer(offerId: string): Promise<RFQOffer> {
    // Get the offer to find the RFQ ID
    const { data: offer, error: offerError } = await supabase
        .from('rfq_offers')
        .select('rfq_id')
        .eq('id', offerId)
        .single();

    if (offerError) throw offerError;

    // Start a transaction-like operation
    // 1. Accept the selected offer
    const { data: acceptedOffer, error: acceptError } = await supabase
        .from('rfq_offers')
        .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
        })
        .eq('id', offerId)
        .select()
        .single();

    if (acceptError) throw acceptError;

    // 2. Reject all other pending offers for this RFQ
    await supabase
        .from('rfq_offers')
        .update({
            status: 'rejected',
            rejected_at: new Date().toISOString(),
            rejected_reason: 'Client accepted another offer',
        })
        .eq('rfq_id', offer.rfq_id)
        .eq('status', 'pending')
        .neq('id', offerId);

    // 3. Update RFQ status
    await supabase
        .from('rfq_requests')
        .update({ status: 'offer_accepted' })
        .eq('id', offer.rfq_id);

    return acceptedOffer;
}

/**
 * Reject an offer
 */
export async function rejectOffer(
    offerId: string,
    reason?: string
): Promise<RFQOffer> {
    const { data: offer, error } = await supabase
        .from('rfq_offers')
        .update({
            status: 'rejected',
            rejected_at: new Date().toISOString(),
            rejected_reason: reason,
        })
        .eq('id', offerId)
        .select()
        .single();

    if (error) throw error;
    return offer;
}

// ═══ ADMIN FUNCTIONS ═══

/**
 * Get all RFQs (admin only)
 */
export async function getAllRFQs(filters?: RFQFilters): Promise<RFQWithClient[]> {
    let query = supabase
        .from('rfq_requests')
        .select(`
            *,
            client:profiles!client_id(
                id,
                full_name,
                company_name,
                email,
                phone
            )
        `)
        .order('created_at', { ascending: false });

    // Apply same filters as getMyRFQs
    if (filters?.status) {
        if (Array.isArray(filters.status)) {
            query = query.in('status', filters.status);
        } else {
            query = query.eq('status', filters.status);
        }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as RFQWithClient[];
}

/**
 * Get all offers (admin only)
 */
export async function getAllOffers(filters?: OfferFilters): Promise<RFQOffer[]> {
    let query = supabase
        .from('rfq_offers')
        .select('*')
        .order('submitted_at', { ascending: false });

    if (filters?.status) {
        if (Array.isArray(filters.status)) {
            query = query.in('status', filters.status);
        } else {
            query = query.eq('status', filters.status);
        }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

// Export all functions
export const rfqService = {
    // Client
    createRFQ,
    updateRFQ,
    publishRFQ,
    cancelRFQ,
    deleteRFQ,
    getMyRFQs,
    getRFQWithOffers,

    // Forwarder
    getAvailableRFQs,
    createOffer,
    updateOffer,
    withdrawOffer,
    getMyOffers,

    // Client - Offers
    getOffersForRFQ,
    acceptOffer,
    rejectOffer,

    // Admin
    getAllRFQs,
    getAllOffers,
};
