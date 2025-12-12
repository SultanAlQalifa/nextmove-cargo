import { supabase } from "../lib/supabase";

export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: "open" | "in_progress" | "closed";
  priority: "low" | "normal" | "high";
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export const ticketService = {
  async createTicket(
    userId: string,
    subject: string,
    priority: string = "normal",
  ) {
    const { data, error } = await supabase
      .from("tickets")
      .insert([{ user_id: userId, subject, priority }])
      .select()
      .single();

    if (error) throw error;
    return data as Ticket;
  },

  async getUserTickets(userId: string) {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Ticket[];
  },

  async getAllTickets() {
    const { data, error } = await supabase
      .from("tickets")
      .select("*, user:profiles(full_name, email)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },

  async getTicketMessages(ticketId: string) {
    const { data, error } = await supabase
      .from("ticket_messages")
      .select("*, sender:profiles(full_name)")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
  },

  async sendMessage(ticketId: string, senderId: string, message: string) {
    const { data, error } = await supabase
      .from("ticket_messages")
      .insert([{ ticket_id: ticketId, sender_id: senderId, message }])
      .select()
      .single();

    if (error) throw error;
    return data as TicketMessage;
  },

  async updateStatus(ticketId: string, status: string) {
    const { error } = await supabase
      .from("tickets")
      .update({ status })
      .eq("id", ticketId);

    if (error) throw error;
  },
};
