import { supabase } from "../lib/supabase";

export interface Notification {
  id: string;
  user_id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  link?: string;
  read_at: string | null;
  created_at: string;
  data?: any;
}

export const notificationService = {
  getNotifications: async (limit = 20) => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Notification[];
  },

  getUnreadCount: async () => {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .is("read_at", null);

    if (error) throw error;
    return count || 0;
  },

  markAsRead: async (notificationId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId);

    if (error) throw error;
  },

  markAllAsRead: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .is("read_at", null);

    if (error) throw error;
  },

  // Method to simulate manual trigger for testing (usually admin only, but useful for verificaiton)
  testTrigger: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Test Notification",
      message: "Ceci est une notification de test générée manuellement.",
      type: "info",
      link: "/dashboard"
    });
  },

  subscribeToNotifications: (callback: (payload: any) => void) => {
    return supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        callback
      )
      .subscribe();
  }
};
