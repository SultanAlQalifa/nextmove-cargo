import { supabase } from '../lib/supabase';
import { fetchWithRetry } from '../utils/supabaseHelpers';

export interface ShipmentEvent {
    id: string;
    status: 'pending' | 'picked_up' | 'in_transit' | 'customs' | 'delivered' | 'cancelled';
    location: string;
    timestamp: string;
    description: string;
}

export interface Shipment {
    id: string;
    tracking_number: string;
    rfq_id?: string;
    transport_mode: 'sea' | 'air';
    service_type: 'standard' | 'express';
    price: number;
    origin: {
        port: string;
        country: string;
    };
    destination: {
        port: string;
        country: string;
    };
    status: 'pending' | 'in_transit' | 'customs' | 'delivered' | 'cancelled' | 'completed';
    carrier: {
        name: string;
        logo?: string;
    };
    cargo: {
        type: string;
        weight: number;
        volume: number;
        packages: number;
    };
    dates: {
        departure: string;
        arrival_estimated: string;
        arrival_actual?: string;
    };
    progress: number; // 0-100
    events: ShipmentEvent[];
    created_at?: string;
    payment?: {
        amount: number;
        amount_forwarder?: number;
        status: string;
    }[];
}

// ... (rest of the file remains same until mapDbShipmentToApp)

// Helper to map DB structure to App interface
function mapDbShipmentToApp(dbRecord: any): Shipment {
    return {
        id: dbRecord.id,
        tracking_number: dbRecord.tracking_number,
        rfq_id: dbRecord.rfq_id,
        transport_mode: dbRecord.transport_mode || 'sea',
        service_type: dbRecord.service_type || 'standard',
        price: dbRecord.price || 0,
        origin: {
            port: dbRecord.origin_port,
            country: dbRecord.origin_country || 'XX'
        },
        destination: {
            port: dbRecord.destination_port,
            country: dbRecord.destination_country || 'XX'
        },
        status: dbRecord.status,
        carrier: {
            name: dbRecord.carrier_name || 'Pending',
            logo: dbRecord.carrier_logo
        },
        cargo: {
            type: dbRecord.cargo_type || 'General',
            weight: dbRecord.cargo_weight || 0,
            volume: dbRecord.cargo_volume || 0,
            packages: dbRecord.cargo_packages || 0
        },
        dates: {
            departure: dbRecord.departure_date,
            arrival_estimated: dbRecord.arrival_estimated_date,
            arrival_actual: dbRecord.arrival_actual_date
        },
        progress: dbRecord.progress || 0,
        events: (dbRecord.events || []).sort((a: any, b: any) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
        created_at: dbRecord.created_at,
        payment: dbRecord.payment || []
    };
}

// ... (rest of the file remains same until mapDbShipmentToApp)



export const shipmentService = {
    /**
     * Get all shipments for the current client
     */
    getClientShipments: async (): Promise<Shipment[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        try {
            const data = await fetchWithRetry<any[]>(() =>
                supabase
                    .from('shipments')
                    .select(`
                        *,
                        events:shipment_events(*),
                        payment:transactions(*)
                    `)
                    .eq('client_id', user.id)
                    .order('created_at', { ascending: false })
            );

            return (data || []).map(mapDbShipmentToApp);
        } catch (error) {
            console.error('Error fetching client shipments:', error);
            throw error;
        }
    },

    /**
     * Get a single shipment by ID
     */
    getShipmentById: async (id: string): Promise<Shipment | undefined> => {
        try {
            const data = await fetchWithRetry<any>(() =>
                supabase
                    .from('shipments')
                    .select(`
                        *,
                        events:shipment_events(*),
                        payment:transactions(*)
                    `)
                    .eq('id', id)
                    .single()
            );

            if (!data) return undefined;
            return mapDbShipmentToApp(data);
        } catch (error) {
            console.error('Error fetching shipment by ID:', error);
            return undefined;
        }
    },

    /**
     * Get all shipments for the current forwarder
     */
    getForwarderShipments: async (): Promise<Shipment[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        try {
            const data = await fetchWithRetry<any[]>(() =>
                supabase
                    .from('shipments')
                    .select(`
                        *,
                        events:shipment_events(*),
                        payment:transactions(*)
                    `)
                    .eq('forwarder_id', user.id)
                    .order('created_at', { ascending: false })
            );

            return (data || []).map(mapDbShipmentToApp);
        } catch (error) {
            console.error('Error fetching forwarder shipments:', error);
            throw error;
        }
    },

    /**
     * Assign a driver to a shipment (Mock implementation for now as Driver system is separate)
     */
    assignDriver: async (shipmentId: string, driverId: string): Promise<void> => {
        try {
            // We can simulate an event update
            // Using straight await here as standard try/catch is enough for writes
            const { error } = await supabase.from('shipment_events').insert({
                shipment_id: shipmentId,
                status: 'in_transit',
                location: 'Warehouse',
                description: 'Chauffeur assigné pour enlèvement'
            });

            if (error) throw error;
        } catch (error) {
            console.error('Error assigning driver:', error);
            throw error;
        }
    },

    /**
     * Get shipments assigned to a specific driver
     */
    getShipmentsForDriver: async (driverId: string): Promise<Shipment[]> => {
        try {
            const data = await fetchWithRetry<any[]>(() =>
                supabase
                    .from('shipments')
                    .select(`
                        *,
                        events:shipment_events(*)
                    `)
                    // .eq('driver_id', driverId) // Uncomment when column exists
                    .limit(5)
            );

            return (data || []).map(mapDbShipmentToApp);
        } catch (error) {
            console.error('Error fetching driver shipments:', error);
            throw error;
        }
    },

    /**
     * Submit Proof of Delivery
     */
    submitPOD: async (podData: {
        shipment_id: string;
        photo_urls: string[];
        recipient_name: string;
        delivered_at: string;
        latitude: number;
        longitude: number;
        driver_notes?: string;
    }): Promise<void> => {
        try {
            // 1. Update shipment status to delivered
            const { error: shipmentError } = await supabase
                .from('shipments')
                .update({ status: 'delivered' })
                .eq('id', podData.shipment_id);

            if (shipmentError) throw shipmentError;

            // 2. Create POD record (assuming a 'pods' table exists, or just log event)
            const { error: eventError } = await supabase
                .from('shipment_events')
                .insert({
                    shipment_id: podData.shipment_id,
                    status: 'delivered',
                    location: `Lat: ${podData.latitude}, Lng: ${podData.longitude}`,
                    description: `Livré à ${podData.recipient_name}. Notes: ${podData.driver_notes || 'Aucune'}`
                });

            if (eventError) throw eventError;
        } catch (error) {
            console.error('Error submitting POD:', error);
            throw error;
        }
    },

    /**
     * Create a new shipment
     */
    createShipment: async (shipmentData: any): Promise<Shipment> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        try {
            // Ensure forwarder_id is set
            const dataToInsert = {
                ...shipmentData,
                forwarder_id: user.id,
                status: 'pending',
                created_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('shipments')
                .insert(dataToInsert)
                .select()
                .single();

            if (error) throw error;
            return mapDbShipmentToApp(data);
        } catch (error) {
            console.error('Error creating shipment:', error);
            throw error;
        }
    },

    /**
     * Bulk create shipments
     */
    bulkCreateShipments: async (shipmentsData: any[]): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        try {
            const dataToInsert = shipmentsData.map(s => ({
                ...s,
                forwarder_id: user.id,
                status: 'pending',
                created_at: new Date().toISOString()
            }));

            const { error } = await supabase
                .from('shipments')
                .insert(dataToInsert);

            if (error) throw error;
        } catch (error) {
            console.error('Error bulk creating shipments:', error);
            throw error;
        }
    },

    /**
     * Get all shipments (Admin only)
     */
    getAllShipments: async (): Promise<Shipment[]> => {
        try {
            const data = await fetchWithRetry<any[]>(() =>
                supabase
                    .from('shipments')
                    .select(`
                        *,
                        events:shipment_events(*),
                        payment:transactions(*)
                    `)
                    .order('created_at', { ascending: false })
            );

            return (data || []).map(mapDbShipmentToApp);
        } catch (error) {
            console.error('Error fetching all shipments:', error);
            throw error;
        }
    }
};
