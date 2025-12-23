import { supabase } from "../lib/supabase";
import { fetchWithRetry } from "../utils/supabaseHelpers";
import { Profile as UserProfile, AutomationSettings } from "../types/profile";
import { auditService } from "./auditService";

export type { UserProfile };

export const profileService = {
  getProfile: async (
    userId: string,
    skipCache = false,
  ): Promise<UserProfile | null> => {
    // 1. Try to get from localStorage first
    const cachedProfile = localStorage.getItem(`user_profile_${userId}`);
    if (!skipCache && cachedProfile) {
      const data = JSON.parse(cachedProfile);
      // Skip invalid cache
      if (
        !(data.email === "admin@example.com" && data.full_name === "Admin User")
      ) {
        return data;
      }
    }

    try {
      // 2. Fetch from Supabase with retry logic
      const data = await fetchWithRetry<UserProfile>(() =>
        supabase.from("profiles").select("*, staff_role:staff_roles(*)").eq("id", userId).maybeSingle(),
      );

      if (!data) {
        // If not found after retries (and maybeSingle returned null), try fallback
        throw new Error("Profile not found");
      }

      // Apply virtual verification for clients
      if (data && data.role === 'client') {
        data.kyc_status = 'verified';
      }

      // Cache the result
      localStorage.setItem(`user_profile_${userId}`, JSON.stringify(data));
      return data;
    } catch (error) {
      console.warn(
        "Error fetching profile, attempting fallback to metadata:",
        error,
      );

      // True Fallback: Get Auth Metadata
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.id === userId) {
        // Return what we know from Auth, don't invent data
        const fallbackProfile: UserProfile = {
          id: userId,
          email: user.email || "",
          full_name: user.user_metadata?.full_name || "User",
          role: user.user_metadata?.role || "client",
          avatar_url: user.user_metadata?.avatar_url,
          kyc_status: "verified",
          loyalty_points: 0,
          tier: "Bronze",
        };
        // Cache this temporary fallback
        localStorage.setItem(
          `user_profile_${userId}`,
          JSON.stringify(fallbackProfile),
        );
        return fallbackProfile;
      }
      return null;
    }
  },

  updateProfile: async (
    userId: string,
    updates: Partial<UserProfile>,
  ): Promise<void> => {
    // 1. Update localStorage
    const cachedProfileStr = localStorage.getItem(`user_profile_${userId}`);
    if (cachedProfileStr) {
      const cachedProfile = JSON.parse(cachedProfileStr);
      const updatedProfile = { ...cachedProfile, ...updates };
      localStorage.setItem(
        `user_profile_${userId}`,
        JSON.stringify(updatedProfile),
      );
    } else {
      localStorage.setItem(
        `user_profile_${userId}`,
        JSON.stringify({ id: userId, ...updates }),
      );
    }

    try {
      await fetchWithRetry(() =>
        supabase.from("profiles").update(updates).eq("id", userId),
      );

      // Audit Log
      await auditService.logAction(
        "profile_update",
        "profile",
        userId,
        { updates },
        { severity: "info" }
      );
    } catch (error) {
      console.error("Error updating profile:", error);
      // Re-throw to let caller handle generic errors, but we keep the optimistic update strategy
      // or we could swallow if we want "optimistic only" behavior, but better to alert
      throw error;
    }
  },

  updatePassword: async (password: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  uploadAvatar: async (_userId: string, file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  },

  getForwarderClients: async (): Promise<UserProfile[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    try {
      // Fetch from BOTH sources in parallel
      const [shipmentClients, explicitClients] = await Promise.all([
        // Source 1: Clients from Shipments
        fetchWithRetry<any[]>(() =>
          supabase
            .from("shipments")
            .select(`user:profiles!client_id(*)`)
            .eq("forwarder_id", user.id),
        ),
        // Source 2: Explicitly added clients
        fetchWithRetry<any[]>(() =>
          supabase
            .from("forwarder_clients")
            .select(`user:profiles!client_id(*)`)
            .eq("forwarder_id", user.id),
        ),
      ]);

      // Combine and Dedup
      const clientsMap = new Map<string, UserProfile>();

      // Process explicit clients first (priority?) - order in map doesn't matter much for dedup
      if (explicitClients) {
        explicitClients.forEach((item) => {
          if (item.user) clientsMap.set(item.user.id, item.user);
        });
      }

      // Process shipment clients
      if (shipmentClients) {
        shipmentClients.forEach((item) => {
          if (item.user && !clientsMap.has(item.user.id)) {
            clientsMap.set(item.user.id, item.user);
          }
        });
      }

      return Array.from(clientsMap.values());
    } catch (error) {
      console.error("Error fetching forwarder clients:", error);
      return [];
    }
  },

  addForwarderClient: async (clientId: string): Promise<void> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    try {
      await fetchWithRetry(() =>
        supabase.from("forwarder_clients").insert({
          forwarder_id: user.id,
          client_id: clientId,
        }),
      );
    } catch (error) {
      // Ignore duplicate key error safely
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code: string }).code === "23505") return;
      console.error("Error adding client:", error);
      throw error;
    }
  },

  searchProfiles: async (query: string, role?: string): Promise<UserProfile[]> => {
    if (!query || query.length < 2) return [];

    try {
      let builder = supabase
        .from("profiles")
        .select("*")
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (role) {
        builder = builder.eq("role", role);
      }

      const { data } = await builder;

      return data || [];
    } catch (error) {
      console.error("Error searching profiles:", error);
      return [];
    }
  },

  upgradeToForwarder: async (userId: string): Promise<void> => {
    try {
      await fetchWithRetry(() =>
        supabase
          .from("profiles")
          .update({
            role: "forwarder",
            subscription_status: "inactive", // Force subscription
            kyc_status: "pending", // Force KYC
          })
          .eq("id", userId),
      );

      await auditService.logAction(
        "role_upgrade",
        "profile",
        userId,
        { new_role: "forwarder" },
        { severity: "medium" }
      );

      // Also update local storage to reflect the change immediately
      const cachedProfileStr = localStorage.getItem(`user_profile_${userId}`);
      if (cachedProfileStr) {
        const cachedProfile = JSON.parse(cachedProfileStr);
        cachedProfile.role = "forwarder";
        localStorage.setItem(
          `user_profile_${userId}`,
          JSON.stringify(cachedProfile),
        );
      }
    } catch (error) {
      console.error("Error upgrading to forwarder:", error);
      throw error;
    }
  },

  getAllProfiles: async (): Promise<UserProfile[]> => {
    try {
      const data = await fetchWithRetry<UserProfile[]>(() =>
        supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false }),
      );

      if (!data) return [];

      // Map DB columns to interface
      return data.map((profile) => ({
        ...profile,
        kyc_status: profile.role === 'client' ? 'verified' : (profile.kyc_status || "pending"),
      }));
    } catch (error) {
      console.error("Error fetching all profiles:", error);
      return [];
    }
  },

  updateStatus: async (
    userId: string,
    status: "active" | "inactive" | "suspended",
  ): Promise<void> => {
    try {
      await fetchWithRetry(() =>
        supabase
          .from("profiles")
          .update({ account_status: status })
          .eq("id", userId),
      );

      await auditService.logAction(
        "status_change",
        "profile",
        userId,
        { new_status: status },
        { severity: "high" }
      );
    } catch (error) {
      console.error("Error updating status:", error);
      throw error;
    }
  },

  updateAutomationSettings: async (
    userId: string,
    settings: AutomationSettings,
  ): Promise<void> => {
    try {
      // Optimistic update
      const cachedProfileStr = localStorage.getItem(`user_profile_${userId}`);
      if (cachedProfileStr) {
        const cachedProfile = JSON.parse(cachedProfileStr);
        cachedProfile.automation_settings = settings;
        localStorage.setItem(`user_profile_${userId}`, JSON.stringify(cachedProfile));
      }

      await fetchWithRetry(() =>
        supabase
          .from("profiles")
          .update({ automation_settings: settings })
          .eq("id", userId)
      );
    } catch (error) {
      console.error("Error updating automation settings:", error);
      throw error;
    }
  },
};
