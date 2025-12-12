import { supabase } from "../lib/supabase";

export interface TicketMessage {
  id: string;
  sender: "user" | "support";
  content: string;
  timestamp: string;
  attachments?: string[];
}

export interface Ticket {
  id: string;
  subject: string;
  category: "technical" | "billing" | "shipment" | "other";
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  updated_at: string;
  messages: TicketMessage[];
  shipment_ref?: string;
  is_escalated?: boolean;
  assigned_to?: string; // Staff ID
}

export interface GlobalSearchResult {
  entity_type: "user" | "shipment" | "rfq" | "groupage" | "ticket";
  id: string;
  title: string;
  subtitle: string;
  status: string;
  created_at: string;
}

export const supportService = {
  globalSearch: async (query: string): Promise<GlobalSearchResult[]> => {
    if (!query || query.length < 2) return [];

    const { data, error } = await supabase.rpc("admin_global_search", {
      query_text: query,
    });

    if (error) {
      console.error("Global search error:", error);
      return [];
    }
    return data || [];
  },

  getClientTickets: async (): Promise<Ticket[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("tickets")
      .select(
        `
                *,
                messages:ticket_messages(*)
            `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDbTicketToApp);
  },

  getAllTickets: async (): Promise<Ticket[]> => {
    const { data, error } = await supabase
      .from("tickets")
      .select(
        `
                *,
                messages:ticket_messages(*)
            `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDbTicketToApp);
  },

  getForwarderTickets: async (): Promise<Ticket[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("tickets")
      .select(
        `
                *,
                messages:ticket_messages(*)
            `,
      )
      .or(`user_id.eq.${user.id},assigned_to.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapDbTicketToApp);
  },

  createTicket: async (ticket: Partial<Ticket>): Promise<Ticket> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("tickets")
      .insert({
        user_id: user.id,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        shipment_ref: ticket.shipment_ref,
        status: "open",
      })
      .select(
        `
                *,
                messages:ticket_messages(*)
            `,
      )
      .single();

    if (error) throw error;

    // If there's an initial message, create it
    if (ticket.messages && ticket.messages.length > 0) {
      const initialMsg = ticket.messages[0];
      await supportService.replyToTicket(data.id, initialMsg.content);
      // Re-fetch or manually add to result
      data.messages = [
        { ...initialMsg, id: "temp", timestamp: new Date().toISOString() },
      ];
    }

    return mapDbTicketToApp(data);
  },

  updateTicketStatus: async (
    ticketId: string,
    status: Ticket["status"],
  ): Promise<void> => {
    const { error } = await supabase
      .from("tickets")
      .update({ status })
      .eq("id", ticketId);

    if (error) throw error;
  },

  escalateTicket: async (ticketId: string): Promise<void> => {
    const { error } = await supabase
      .from("tickets")
      .update({
        is_escalated: true,
        priority: "urgent",
      })
      .eq("id", ticketId);

    if (error) throw error;
  },

  assignTicket: async (ticketId: string, staffId: string): Promise<void> => {
    const { error } = await supabase
      .from("tickets")
      .update({ assigned_to: staffId })
      .eq("id", ticketId);

    if (error) throw error;
  },

  replyToTicket: async (
    ticketId: string,
    content: string,
  ): Promise<TicketMessage> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        content,
      })
      .select()
      .single();

    if (error) throw error;

    // We need to determine sender type for the UI
    // In a real app we might join profiles, but here we can infer or fetch
    // For now, assume 'user' if it matches ticket owner, else 'support'
    // But simpler: just return what we have and let UI handle or map it
    return {
      id: data.id,
      sender: "user", // This is a simplification. Ideally we check the role.
      content: data.content,
      timestamp: data.created_at,
      attachments: data.attachments,
    };
  },

  deleteTicket: async (ticketId: string): Promise<void> => {
    const { error } = await supabase
      .from("tickets")
      .delete()
      .eq("id", ticketId);

    if (error) throw error;
  },
};

function mapDbTicketToApp(dbRecord: any): Ticket {
  return {
    id: dbRecord.id,
    subject: dbRecord.subject,
    category: dbRecord.category,
    status: dbRecord.status,
    priority: dbRecord.priority,
    created_at: dbRecord.created_at,
    updated_at: dbRecord.updated_at,
    messages: (dbRecord.messages || []).map(mapDbMessageToApp),
    shipment_ref: dbRecord.shipment_ref,
    is_escalated: dbRecord.is_escalated,
    assigned_to: dbRecord.assigned_to,
  };
}

function mapDbMessageToApp(dbRecord: any): TicketMessage {
  // Logic to determine sender type 'user' or 'support'
  // This is imperfect without joining profiles and checking roles
  // But for now, let's assume if it's the current user it's 'user', else 'support'?
  // Or better, the UI should handle this based on sender_id.
  // For this migration, we'll default to 'user' but this might need refinement.
  return {
    id: dbRecord.id,
    sender: "user", // Placeholder, UI should check sender_id vs current user_id
    content: dbRecord.content,
    timestamp: dbRecord.created_at,
    attachments: dbRecord.attachments,
  };
}
