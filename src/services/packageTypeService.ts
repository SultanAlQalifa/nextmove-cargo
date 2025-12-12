import { supabase } from "../lib/supabase";

export interface PackageType {
  id: string;
  label: string;
  value: string;
  status: "active" | "pending" | "rejected";
  submitted_by?: string; // User ID of the forwarder who submitted it
  created_at: string;
}

export const packageTypeService = {
  /**
   * Get all active package types (for dropdowns)
   */
  getPackageTypes: async (): Promise<PackageType[]> => {
    const { data, error } = await supabase
      .from("package_types")
      .select("*")
      .eq("status", "active")
      .order("label");

    if (error) {
      console.error("Error fetching package types:", error);
      return [];
    }
    return data || [];
  },

  /**
   * Get all pending package types (for Admin)
   */
  getPendingPackageTypes: async (): Promise<PackageType[]> => {
    const { data, error } = await supabase
      .from("package_types")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending package types:", error);
      return [];
    }
    return data || [];
  },

  /**
   * Get all package types (for Admin list)
   */
  getAllPackageTypes: async (): Promise<PackageType[]> => {
    const { data, error } = await supabase
      .from("package_types")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching all package types:", error);
      return [];
    }
    return data || [];
  },

  /**
   * Submit a new package type
   */
  addPackageType: async (label: string): Promise<PackageType> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("package_types")
      .insert({
        label,
        value: label, // Use label as value for simplicity
        status: "pending", // Default to pending
        submitted_by: user?.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Approve a package type (Admin only)
   */
  approvePackageType: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("package_types")
      .update({ status: "active" })
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Reject a package type (Admin only)
   */
  rejectPackageType: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("package_types")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Delete a package type (Admin only)
   */
  deletePackageType: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("package_types")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};
