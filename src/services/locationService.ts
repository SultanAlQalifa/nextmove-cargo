import { supabase } from '../lib/supabase';

export interface Location {
    id: string;
    name: string;
    type: 'country' | 'port';
    status: 'active' | 'pending' | 'rejected';
    submitted_by?: string; // User ID of the forwarder who submitted it
    created_at: string;
}

export const locationService = {
    /**
     * Get all active locations (for dropdowns)
     */
    getLocations: async (): Promise<Location[]> => {
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .eq('status', 'active')
            .order('name');

        if (error) {
            console.error('Error fetching locations:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Get all pending locations (for Admin)
     */
    getPendingLocations: async (): Promise<Location[]> => {
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching pending locations:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Get all locations (for Admin list)
     */
    getAllLocations: async (): Promise<Location[]> => {
        const { data, error } = await supabase
            .from('locations')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching all locations:', error);
            return [];
        }
        return data || [];
    },

    /**
     * Submit a new location
     */
    addLocation: async (name: string, type: 'country' | 'port'): Promise<Location> => {
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('locations')
            .insert({
                name,
                type,
                status: 'pending', // Default to pending
                submitted_by: user?.id
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Approve a location (Admin only)
     */
    approveLocation: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('locations')
            .update({ status: 'active' })
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Reject a location (Admin only)
     */
    rejectLocation: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('locations')
            .update({ status: 'rejected' })
            .eq('id', id);

        if (error) throw error;
    },

    /**
     * Delete a location (Admin only)
     */
    deleteLocation: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('locations')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
