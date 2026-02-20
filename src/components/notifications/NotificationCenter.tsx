import React, { useState, useRef, useEffect } from "react";
import { Bell, Check, ExternalLink, Info, CheckCircle, AlertTriangle, XCircle, Trash2 } from "lucide-react";
import { useNotifications } from "../../contexts/NotificationContext";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export default function NotificationCenter() {
    const { notifications, unreadCount, markAsRead, markAllRead, loading } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case "success": return <CheckCircle className="w-5 h-5 text-green-500" />;
            case "warning": return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
            case "error": return <XCircle className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 rounded-2xl transition-all focus:outline-none group"
            >
                <Bell className="w-6 h-6 group-hover:animate-wiggle" />
                {unreadCount > 0 && (
                    <>
                        <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm z-10" />
                        <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75" />
                    </>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-0 mt-3 w-80 sm:w-96 glass-card-premium bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10 z-50 overflow-hidden transform-gpu"
                    >
                        <div className="grain-overlay opacity-[0.03]" />
                        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between relative z-10">
                            <h3 className="text-sm font-black tracking-wide uppercase text-slate-900 dark:text-white flex items-center gap-2">
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 py-0.5 px-2 rounded-full text-[10px] font-bold">
                                        {unreadCount}
                                    </span>
                                )}
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={() => markAllRead()}
                                    className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-2 py-1 rounded-lg transition-all flex items-center gap-1"
                                >
                                    <Check className="w-3 h-3" /> Tout lu
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto hide-scrollbar relative z-10">
                            {loading ? (
                                <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                                    <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-3"></div>
                                    <span className="text-xs uppercase tracking-widest font-bold">Chargement...</span>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                                        <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Aucune notification pour le moment.</p>
                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Vous êtes à jour !</p>
                                </div>
                            ) : (
                                <motion.div
                                    className="divide-y divide-slate-100/50 dark:divide-white/5"
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        visible: { transition: { staggerChildren: 0.05 } }
                                    }}
                                >
                                    {notifications.map((notification) => (
                                        <motion.div
                                            key={notification.id}
                                            variants={{
                                                hidden: { opacity: 0, x: 20 },
                                                visible: { opacity: 1, x: 0 }
                                            }}
                                            className={`p-4 transition-all cursor-pointer group ${!notification.read_at
                                                ? 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                                            `}
                                            onClick={() => !notification.read_at && markAsRead(notification.id)}
                                        >
                                            <div className="flex gap-4">
                                                <div className="flex-shrink-0 mt-1 relative">
                                                    {getIcon(notification.type)}
                                                    {!notification.read_at && (
                                                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-500 rounded-full border border-white dark:border-slate-900" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <p className={`text-sm tracking-tight pr-4 ${!notification.read_at ? 'font-black text-slate-900 dark:text-white' : 'font-semibold text-slate-600 dark:text-slate-300'}`}>
                                                            {notification.title}
                                                        </p>
                                                    </div>
                                                    <p className={`text-xs mt-1 line-clamp-2 ${!notification.read_at ? 'text-slate-600 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500/80'}`}>
                                                        {notification.message}
                                                    </p>

                                                    <div className="flex items-center justify-between mt-3">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: fr })}
                                                        </span>
                                                        {notification.link && (
                                                            <Link
                                                                to={notification.link}
                                                                className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 opacity-0 group-hover:opacity-100"
                                                                onClick={() => setIsOpen(false)}
                                                            >
                                                                Voir <ExternalLink className="w-3 h-3" />
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </div>

                        <div className="p-3 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-white/5 text-center relative z-10 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Link
                                to="/dashboard/notifications"
                                className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors block p-2"
                                onClick={() => setIsOpen(false)}
                            >
                                Voir toutes les notifications
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
