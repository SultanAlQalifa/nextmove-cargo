import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { notificationService, Notification } from "../services/notificationService";
import { supabase } from "../lib/supabase";
import { useToast } from "./ToastContext";

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { info } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshNotifications = async () => {
        if (!user) return;
        const data = await notificationService.getNotifications();
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
    };

    useEffect(() => {
        if (user) {
            refreshNotifications();

            // Subscribe to real-time changes filtered by user_id
            const channel = supabase
                .channel(`user-notifications-${user.id}`)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "notifications",
                        filter: `user_id=eq.${user.id}`,
                    },
                    (payload) => {
                        // New notification received
                        const newNotification = payload.new as Notification;
                        setNotifications((prev) => [newNotification, ...prev]);
                        setUnreadCount((prev) => prev + 1);

                        // Optional: Show a toast or play a sound
                        // info(newNotification.title); 
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [user]);

    const markAsRead = async (id: string) => {
        await notificationService.markAsRead(id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const markAllAsRead = async () => {
        await notificationService.markAllAsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                markAsRead,
                markAllAsRead,
                refreshNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
}
