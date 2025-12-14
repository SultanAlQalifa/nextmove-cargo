import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { notificationService, Notification } from "../services/notificationService";
import { useAuth } from "../contexts/AuthContext";

export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const data = await notificationService.getNotifications();
            const count = await notificationService.getUnreadCount();
            setNotifications(data);
            setUnreadCount(count);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!user) return;

        fetchNotifications();

        // Subscribe to Realtime Changes
        const subscription = supabase
            .channel("public:notifications")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "notifications",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    const newNotif = payload.new as Notification;
                    setNotifications((prev) => [newNotif, ...prev]);
                    setUnreadCount((prev) => prev + 1);

                    // Optional: Browser Notification API here if we wanted to push it
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [user]);

    const markAsRead = async (id: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));

            await notificationService.markAsRead(id);
        } catch (err) {
            console.error("Error marking read:", err);
            fetchNotifications(); // Revert on error
        }
    };

    const markAllRead = async () => {
        try {
            setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
            setUnreadCount(0);
            await notificationService.markAllAsRead();
        } catch (err) {
            console.error("Error marking all read:", err);
            fetchNotifications();
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllRead,
        refresh: fetchNotifications
    };
}
