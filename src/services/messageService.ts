import { supabase } from "../lib/supabase";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender?: {
    full_name: string;
    email: string;
    company_name?: string;
  };
}

export interface Conversation {
  id: string;
  last_message: string;
  last_message_at: string;
  updated_at: string;
  participants: {
    user_id: string;
    user: {
      full_name: string;
      email: string;
      company_name?: string;
    };
  }[];
  unread_count?: number;
}

export const messageService = {
  /**
   * Get all conversations for the current user
   */
  getConversations: async (): Promise<Conversation[]> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    // Fetch conversations where user is a participant
    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
                *,
                participants:conversation_participants(
                    user_id,
                    user:profiles(full_name, email, company_name)
                )
            `,
      )
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching conversations:", error);
      return [];
    }

    // Filter out conversations where the user is not a participant (RLS should handle this, but just in case)
    // And format the data
    return data.map((conv: any) => ({
      ...conv,
      participants: conv.participants,
    }));
  },

  /**
   * Get messages for a specific conversation
   */
  getMessages: async (conversationId: string): Promise<Message[]> => {
    const { data, error } = await supabase
      .from("messages")
      .select(
        `
                *,
                sender:profiles(full_name, email, company_name)
            `,
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }

    return data || [];
  },

  /**
   * Send a message to a conversation
   */
  sendMessage: async (
    conversationId: string,
    content: string,
  ): Promise<Message | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content,
      })
      .select(
        `
                *,
                sender:profiles(full_name, email, company_name)
            `,
      )
      .single();

    if (error) {
      console.error("Error sending message:", error);
      throw error;
    }

    // Update conversation last_message
    await supabase
      .from("conversations")
      .update({
        last_message: content,
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    // 4. Check for External Integration (JavaScript-side trigger)
    try {
      const { data: participantData } = await supabase
        .from("conversation_participants")
        .select("user:profiles(id, phone, full_name, automation_settings)")
        .eq("conversation_id", conversationId)
        .neq("user_id", user.id)
        .single();

      const recipient = (participantData as any)?.user;

      if (recipient && recipient.phone && recipient.automation_settings?.whatsapp_enabled !== false) {
        await supabase.functions.invoke('send-whatsapp', {
          body: {
            to: recipient.phone,
            message: content,
          }
        });
      }
    } catch (err) {
      console.warn("Failed to trigger WhatsApp outbound:", err);
    }

    return message;
  },

  /**
   * Start a new conversation with a user
   */
  startConversation: async (
    otherUserId: string,
    initialMessage: string,
  ): Promise<Conversation | null> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // 1. Create Conversation
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .insert({
        last_message: initialMessage,
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (convError) throw convError;

    // 2. Add Participants
    const { error: partError } = await supabase
      .from("conversation_participants")
      .insert([
        { conversation_id: conv.id, user_id: user.id },
        { conversation_id: conv.id, user_id: otherUserId },
      ]);

    if (partError) throw partError;

    // 3. Send Initial Message
    await supabase.from("messages").insert({
      conversation_id: conv.id,
      sender_id: user.id,
      content: initialMessage,
    });

    return conv; // Should ideally return full conversation with participants
  },

  /**
   * Subscribe to new messages in a conversation
   */
  subscribeToMessages: (
    conversationId: string,
    callback: (payload: any) => void,
  ) => {
    return supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload);
        },
      )
      .subscribe();
  },
};
