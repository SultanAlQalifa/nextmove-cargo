import { supabase } from "../lib/supabase";

export interface Chat {
  id: string;
  participants: string[];
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export const chatService = {
  async createChat(participants: string[]) {
    const { data, error } = await supabase
      .from("chats")
      .insert([{ participants }])
      .select()
      .single();

    if (error) throw error;
    return data as Chat;
  },

  async getUserChats(userId: string) {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .contains("participants", [userId])
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data as Chat[];
  },

  async getMessages(chatId: string) {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data as ChatMessage[];
  },

  async sendMessage(chatId: string, senderId: string, content: string) {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert([{ chat_id: chatId, sender_id: senderId, content }])
      .select()
      .single();

    if (error) throw error;

    // Update chat updated_at
    await supabase
      .from("chats")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", chatId);

    return data as ChatMessage;
  },

  subscribeToMessages(chatId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `chat_id=eq.${chatId}`,
        },
        callback,
      )
      .subscribe();
  },
};
