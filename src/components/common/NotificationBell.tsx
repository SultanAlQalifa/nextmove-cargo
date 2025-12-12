import { useState, useEffect, useRef } from "react";
import { Bell, Check, Trash2, ExternalLink } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { notificationService, Notification } from "../../services/notificationService";
import { useNavigate } from "react-router-dom";

export default function NotificationBell() {
  const { success, info } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications & Subscribe
  useEffect(() => {
    fetchNotifications();

    // Subscribe to Realtime
    const subscription = notificationService.subscribeToNotifications((payload) => {
      // New notification received!
      if (payload.eventType === 'INSERT') {
        const newNotif = payload.new as Notification;
        setNotifications((prev) => [newNotif, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Show Toast
        info(`🔔 ${newNotif.title}: ${newNotif.message}`);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getNotifications();
      setNotifications(data);
      const unread = data.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error fetching notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      success("Toutes les notifications marquées comme lues");
    } catch (error) {
      console.error("Error marking all as read", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    setIsOpen(false);
    if (notification.link) {
      if (notification.link.startsWith('http')) {
        window.open(notification.link, '_blank');
      } else {
        navigate(notification.link);
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all duration-300 hover:shadow-sm"
        aria-label="Notifications"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? "animate-swing" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
          <div className="p-4 border-b border-gray-50 dark:border-slate-700 flex items-center justify-between bg-gray-50/50 dark:bg-slate-800/50 backdrop-blur-sm">
            <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 px-2 py-1 hover:bg-white rounded-lg transition-colors"
              >
                <Check className="w-3 h-3" />
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Aucune notification récente</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-slate-700">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group relative ${!notif.is_read ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}
                    onClick={() => handleNotificationClick(notif)}
                  >

                    <div className="flex gap-3">
                      <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notif.is_read ? 'bg-primary' : 'bg-transparent'}`}></div>
                      <div className="flex-1">
                        <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-50 dark:border-slate-700 bg-gray-50/50 text-center">
            <button onClick={() => {
              navigate('/dashboard/notifications');
              setIsOpen(false);
            }} className="text-xs font-medium text-gray-500 hover:text-primary w-full py-2">
              Voir tout l'historique
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
