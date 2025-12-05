import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCircle, XCircle, AlertCircle, Info, ArrowLeft, Trash2 } from 'lucide-react';
import { notificationService, Notification } from '../../services/notificationService';
import PageHeader from '../../components/common/PageHeader';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id: string) => {
        await notificationService.markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const handleMarkAllRead = async () => {
        await notificationService.markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            await handleMarkAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'offer_accepted': return <CheckCircle className="w-6 h-6 text-green-500" />;
            case 'offer_rejected': return <XCircle className="w-6 h-6 text-red-500" />;
            case 'offer_new': return <AlertCircle className="w-6 h-6 text-blue-500" />;
            case 'rfq_new': return <Info className="w-6 h-6 text-purple-500" />;
            default: return <Bell className="w-6 h-6 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <PageHeader
                    title="Notifications"
                    subtitle="Historique de vos alertes et messages"
                />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <span className="text-sm text-gray-500 font-medium">
                        {notifications.filter(n => !n.is_read).length} non lues
                    </span>
                    {notifications.length > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-2 px-3 py-1.5 hover:bg-primary/5 rounded-lg transition-colors"
                        >
                            <Check className="w-4 h-4" /> Tout marquer comme lu
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-gray-500">Chargement des notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">Aucune notification</h3>
                        <p className="text-gray-500">Vous n'avez pas encore reçu de notification.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer flex gap-4 ${!notification.is_read ? 'bg-blue-50/30' : ''}`}
                            >
                                <div className="flex-shrink-0 mt-1">
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`text-base ${!notification.is_read ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}>
                                            {notification.title}
                                        </h4>
                                        <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                                            {new Date(notification.created_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed">
                                        {notification.message}
                                    </p>
                                </div>
                                {!notification.is_read && (
                                    <div className="flex-shrink-0 self-center">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm shadow-blue-200"></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
