import { supabase } from "../lib/supabase";

export interface Location {
  id: string;
  name: string;
  type: "country" | "port";
  status: "active" | "pending" | "rejected";
  submitted_by?: string;
  created_at: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}

const PORT_COORDINATES: Record<string, LatLng> = {
  "Guangzhou": { lat: 23.1291, lng: 113.2644 },
  "Shenzhen": { lat: 22.5431, lng: 114.0579 },
  "Yiwu": { lat: 29.3072, lng: 120.0744 },
  "Hong Kong": { lat: 22.3193, lng: 114.1694 },
  "Ningbo": { lat: 29.8683, lng: 121.5440 },
  "Shanghai": { lat: 31.2304, lng: 121.4737 },
  "Dakar": { lat: 14.6928, lng: -17.4467 },
  "Abidjan": { lat: 5.3600, lng: -4.0083 },
  "Lagos": { lat: 6.5244, lng: 3.3792 },
  "Casablanca": { lat: 33.5731, lng: -7.5898 },
  "Marseille": { lat: 43.2965, lng: 5.3698 },
  "Le Havre": { lat: 49.4944, lng: 0.1014 },
  "Paris": { lat: 48.8566, lng: 2.3522 },
  "Valencia": { lat: 39.4699, lng: -0.3763 },
  "Barcelona": { lat: 41.3851, lng: 2.1734 },
  "New York": { lat: 40.7128, lng: -74.0060 },
  "Dubai": { lat: 25.2048, lng: 55.2708 },
};

export const locationService = {
  /**
   * Get coordinates for a port by name or ID
   */
  getCoordinates: (name: string): LatLng | null => {
    return PORT_COORDINATES[name] || null;
  },
  /**
   * Get all active locations (for dropdowns)
   */
  getLocations: async (): Promise<Location[]> => {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("status", "active")
      .order("name");

    if (error) {
      console.error("Error fetching locations:", error);
      return [];
    }
    return data || [];
  },

  /**
   * Get all pending locations (for Admin)
   */
  getPendingLocations: async (): Promise<Location[]> => {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending locations:", error);
      return [];
    }
    return data || [];
  },

  /**
   * Get all locations (for Admin list)
   */
  getAllLocations: async (): Promise<Location[]> => {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all locations:", error);
      return [];
    }
    return data || [];
  },

  /**
   * Submit a new location
   */
  addLocation: async (
    name: string,
    type: "country" | "port",
  ): Promise<Location> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("locations")
      .insert({
        name,
        type,
        status: "pending", // Default to pending
        submitted_by: user?.id,
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
      .from("locations")
      .update({ status: "active" })
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Reject a location (Admin only)
   */
  rejectLocation: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("locations")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Delete a location (Admin only)
   */
  deleteLocation: async (id: string): Promise<void> => {
    const { error } = await supabase.from("locations").delete().eq("id", id);

    if (error) throw error;
  },
};
