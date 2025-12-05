import { supabase } from '../lib/supabase';

export interface QuoteRequest {
    id?: string;
    client_id?: string;
    supplier_email?: string;
    status: 'pending' | 'quoted' | 'accepted' | 'rejected';
    origin_country: string;
    destination_country: string;
    mode: 'sea' | 'air';
    type: 'standard' | 'express';
    cargo_details: {
        weight_kg?: number;
        volume_cbm?: number;
        dimensions?: string;
        description: string;
    };
    created_at?: string;
}

export interface Quote {
    id: string;
    request_id: string;
    forwarder_id: string;
    amount: number;
    currency: string;
    valid_until?: string;
    status: 'pending' | 'accepted' | 'rejected';
    forwarder?: {
        company_name: string;
    };
}

export const quoteService = {
    async createRequest(request: Omit<QuoteRequest, 'id' | 'status' | 'created_at'>) {
        const { data, error } = await supabase
            .from('quote_requests')
            .insert([{ ...request, status: 'pending' }])
            .select()
            .single();

        if (error) throw error;
        return data as QuoteRequest;
    },

    async getClientRequests(clientId: string) {
        const { data, error } = await supabase
            .from('quote_requests')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as QuoteRequest[];
    },

    async getPendingRequestsForForwarder() {
        const { data, error } = await supabase
            .from('quote_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as QuoteRequest[];
    },

    async submitQuote(quote: Omit<Quote, 'id' | 'status' | 'created_at'>) {
        const { data, error } = await supabase
            .from('quotes')
            .insert([{ ...quote, status: 'pending' }])
            .select()
            .single();

        if (error) throw error;

        // Update request status to quoted
        await supabase
            .from('quote_requests')
            .update({ status: 'quoted' })
            .eq('id', quote.request_id);

        return data as Quote;
    },

    async getQuotesForRequest(requestId: string) {
        const { data, error } = await supabase
            .from('quotes')
            .select(`
        *,
        forwarder:forwarder_id (
          company_name
        )
      `)
            .eq('request_id', requestId);

        if (error) throw error;
        return data as Quote[];
    },

    async acceptQuote(quoteId: string, requestId: string) {
        // 1. Get quote details
        const { data: quote, error: quoteError } = await supabase
            .from('quotes')
            .select('*')
            .eq('id', quoteId)
            .single();

        if (quoteError) throw quoteError;

        // 2. Get request details
        const { data: request, error: requestError } = await supabase
            .from('quote_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (requestError) throw requestError;

        // 3. Create Shipment
        const { data: shipment, error: shipmentError } = await supabase
            .from('shipments')
            .insert([{
                tracking_number: 'TRK-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                client_id: request.client_id,
                forwarder_id: quote.forwarder_id,
                origin_country: request.origin_country,
                destination_country: request.destination_country,
                transport_mode: request.mode,
                transport_type: request.type,
                weight_kg: request.cargo_details.weight_kg,
                volume_cbm: request.cargo_details.volume_cbm,
                description: request.cargo_details.description,
                status: 'booked'
            }])
            .select()
            .single();

        if (shipmentError) throw shipmentError;

        // 4. Update Quote Status
        await supabase.from('quotes').update({ status: 'accepted' }).eq('id', quoteId);

        // 5. Update Request Status
        await supabase.from('quote_requests').update({ status: 'accepted' }).eq('id', requestId);

        return shipment;
    }
};
