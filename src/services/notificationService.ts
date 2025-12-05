import { supabase } from '../lib/supabase';
import { emailService } from './emailService';

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: 'rfq_new' | 'offer_new' | 'offer_accepted' | 'offer_rejected' | 'system_info';
    link?: string;
    is_read: boolean;
    created_at: string;
}



export const notificationService = {
    /**
     * Récupère les notifications de l'utilisateur connecté
     */
    getNotifications: async (): Promise<Notification[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) {
            console.error('Error fetching notifications:', error);
            return [];
        }

        return data || [];
    },

    /**
     * Marque une notification comme lue
     */
    markAsRead: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (error) console.error('Error marking notification as read:', error);
    },

    /**
     * Marque toutes les notifications comme lues
     */
    markAllAsRead: async (): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', user.id)
            .eq('is_read', false);

        if (error) console.error('Error marking all notifications as read:', error);
    },

    /**
     * Souscrit aux notifications en temps réel
     */
    subscribeToNotifications: (callback: (payload: any) => void) => {
        return supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    callback(payload);
                }
            )
            .subscribe();
    },

    /**
     * Send a notification (and email) to a user
     */
    sendNotification: async (userId: string, title: string, message: string, type: Notification['type'], link?: string) => {
        // 1. Create in-app notification
        const { error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                title,
                message,
                type,
                link,
                is_read: false
            });

        if (error) console.error('Error creating notification:', error);

        // 2. Send Email (if applicable)
        try {
            // Fetch user email
            const { data: profile } = await supabase
                .from('profiles')
                .select('email, full_name')
                .eq('id', userId)
                .single();

            if (profile?.email) {
                if (type === 'rfq_new') {
                    await emailService.sendRFQNotification(profile.email, link || '');
                } else if (type === 'offer_new') {
                    await emailService.sendOfferNotification(profile.email, link || '');
                } else if (type === 'system_info' && title.includes('Bienvenue')) {
                    await emailService.sendWelcomeEmail(profile.email, profile.full_name || 'Utilisateur');
                }
            }
        } catch (emailError) {
            console.error('Error sending email notification:', emailError);
        }
    }
};

