import { supabase } from "../lib/supabase";

export interface UserConnection {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  requester?: {
    full_name: string;
    email: string;
    avatar_url: string;
    role: string;
  };
  recipient?: {
    full_name: string;
    email: string;
    avatar_url: string;
    role: string;
  };
}

export const connectionService = {
  /**
   * Send a connection request to a user.
   */
  sendRequest: async (recipientId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Check if connection already exists (any status)
    const { data: existing } = await supabase
      .from("user_connections")
      .select("*")
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .or(`requester_id.eq.${recipientId},recipient_id.eq.${recipientId}`)
      .maybeSingle(); // Use maybeSingle to avoid 406 if multiple rows (shouldn't happen due to constraints but safe)

    // Note: The OR logic above is a bit complex for single query,
    // simpler: (req=me AND rec=them) OR (req=them AND rec=me)

    const { data: check } = await supabase
      .from("user_connections")
      .select("*")
      .or(
        `and(requester_id.eq.${user.id},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${user.id})`,
      )
      .maybeSingle();

    if (check) {
      if (check.status === "accepted") return { status: "already_connected" };
      if (check.status === "pending") return { status: "pending" };
      // If rejected, maybe allow re-request? For now return status.
      return { status: check.status };
    }

    const { data, error } = await supabase
      .from("user_connections")
      .insert({
        requester_id: user.id,
        recipient_id: recipientId,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Approve a connection request.
   */
  approveRequest: async (connectionId: string) => {
    const { data, error } = await supabase
      .from("user_connections")
      .update({ status: "accepted" })
      .eq("id", connectionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Reject or Cancel a connection.
   */
  rejectRequest: async (connectionId: string) => {
    const { error } = await supabase
      .from("user_connections")
      .delete() // We delete for rejection to allow future re-requests? Or set status='rejected'?
      // Requirement says "Approve/Reject".
      // If we set rejected, they can't request again easily.
      // Let's DELETE for now so they can try again or it disappears.
      .eq("id", connectionId);

    if (error) throw error;
  },

  /**
   * Get all connections (Accepted) for current user.
   */
  getAcceptedConnections: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("user_connections")
      .select(
        `
                *,
                requester:profiles!requester_id(*),
                recipient:profiles!recipient_id(*)
            `,
      )
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

    if (error) throw error;

    // Map to friend profile
    return data.map((conn) => {
      const isMeRequester = conn.requester_id === user.id;
      const friend = isMeRequester ? conn.recipient : conn.requester;
      return {
        ...friend,
        connection_id: conn.id,
        connected_since: conn.updated_at,
      };
    });
  },

  /**
   * Get Pending Requests (Incoming).
   */
  getPendingRequests: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("user_connections")
      .select(
        `
                *,
                requester:profiles!requester_id(*)
            `,
      )
      .eq("status", "pending")
      .eq("recipient_id", user.id); // Only incoming requests

    if (error) throw error;
    return data;
  },

  /**
   * Ensure a connection exists between two users (Auto-Link logic).
   * If no connection exists, create an ACCEPTED one.
   * If pending, update to ACCEPTED.
   */
  ensureConnection: async (userA: string, userB: string) => {
    if (!userA || !userB || userA === userB) return;

    // Check existence
    const { data: existing } = await supabase
      .from("user_connections")
      .select("*")
      .or(
        `and(requester_id.eq.${userA},recipient_id.eq.${userB}),and(requester_id.eq.${userB},recipient_id.eq.${userA})`,
      )
      .maybeSingle();

    if (existing) {
      if (existing.status !== "accepted") {
        // Auto-accept if pending
        await supabase
          .from("user_connections")
          .update({ status: "accepted" })
          .eq("id", existing.id);
      }
      return;
    }

    // Create new accepted connection
    // We need to use UPSERT or simple Insert.
    // Determining requester/recipient arbitrarily (A is requester)
    const { error } = await supabase.from("user_connections").insert({
      requester_id: userA,
      recipient_id: userB,
      status: "accepted",
    });

    if (error) console.error("Error ensuring connection:", error);
  },
};
