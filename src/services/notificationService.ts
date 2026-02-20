import { supabase } from "../lib/supabase";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";

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
  // --- Push Notifications Logic ---
  initPushNotifications: async () => {
    if (Capacitor.getPlatform() === 'web') {
      console.log('Push notifications not available on web');
      return;
    }

    // Request permissions
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      throw new Error('Push notification permission denied');
    }

    // Register with Apple / Google
    await PushNotifications.register();

    // Listeners
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value);
      await notificationService.savePushToken(token.value);
    });

    PushNotifications.addListener('registrationError', (error: any) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push received: ' + JSON.stringify(notification));
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push action performed: ' + JSON.stringify(notification));
      if (notification.notification.data?.link) {
        window.location.href = notification.notification.data.link;
      }
    });
  },

  savePushToken: async (token: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("user_push_tokens")
      .upsert({
        user_id: user.id,
        token: token,
        platform: Capacitor.getPlatform(),
        last_seen_at: new Date().toISOString()
      }, { onConflict: 'token' });

    if (error) console.error("Error saving push token:", error);
  },

  // --- Existing Notifications Logic ---
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

  // Method to simulate manual trigger for testing
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
  },

  sendNotification: async (userId: string, title: string, message: string, type: string = "info", link?: string) => {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      title,
      message,
      type,
      link,
      read_at: null
    });

    if (error) throw error;
  }
};
