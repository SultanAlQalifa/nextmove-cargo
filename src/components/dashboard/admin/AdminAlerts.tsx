import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import {
    AlertTriangle,
    XOctagon,
    MessageSquare,
    CheckCircle2,
    Navigation,
    ArrowRight,
    Loader2
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface AlertItem {
    id: string;
    type: 'delay' | 'cancellation' | 'support' | 'arrival' | 'capacity';
    title: string;
    message: string;
    link: string;
    severity: 'critical' | 'warning' | 'info';
    timestamp: string;
}

export const AdminAlerts = () => {
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const now = new Date().toISOString();
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toISOString().split('T')[0];

            const newAlerts: AlertItem[] = [];

            // 1. Delays (Shipments)
            const { data: delayed } = await supabase
                .from('shipments')
                .select('id, tracking_number, arrival_estimated_date')
                .lt('arrival_estimated_date', now)
                .not('status', 'in', '("delivered","cancelled")')
                .limit(5);

            delayed?.forEach(s => {
                newAlerts.push({
                    id: `delay-${s.id}`,
                    type: 'delay',
                    title: 'Retard Détecté',
                    message: `Le colis ${s.tracking_number} a dépassé sa date estimée.`,
                    link: `/dashboard/admin/shipments?id=${s.id}`,
                    severity: 'critical',
                    timestamp: s.arrival_estimated_date
                });
            });

            // 2. Cancellations (Last 24h)
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            const { data: cancelled } = await supabase
                .from('shipments')
                .select('id, tracking_number, updated_at')
                .eq('status', 'cancelled')
                .gt('updated_at', yesterday)
                .limit(3);

            cancelled?.forEach(s => {
                newAlerts.push({
                    id: `cancel-${s.id}`,
                    type: 'cancellation',
                    title: 'Annulation Récente',
                    message: `L'expédition ${s.tracking_number} a été annulée.`,
                    link: `/dashboard/admin/shipments?id=${s.id}`,
                    severity: 'warning',
                    timestamp: s.updated_at
                });
            });

            // 3. Urgent Support Tickets
            const { data: tickets } = await supabase
                .from('tickets')
                .select('id, subject, priority')
                .eq('status', 'open')
                .eq('priority', 'urgent')
                .limit(3);

            tickets?.forEach(t => {
                newAlerts.push({
                    id: `ticket-${t.id}`,
                    type: 'support',
                    title: 'Support Urgent',
                    message: `Nouveau ticket urgent: ${t.subject}`,
                    link: `/dashboard/admin/support?id=${t.id}`,
                    severity: 'critical',
                    timestamp: new Date().toISOString()
                });
            });

            // 4. Today's Arrivals
            const { data: arrivals } = await supabase
                .from('shipments')
                .select('id, tracking_number')
                .eq('arrival_estimated_date', todayStr)
                .limit(5);

            arrivals?.forEach(s => {
                newAlerts.push({
                    id: `arrival-${s.id}`,
                    type: 'arrival',
                    title: 'Arrivée du Jour',
                    message: `Le colis ${s.tracking_number} est attendu aujourd'hui.`,
                    link: `/dashboard/admin/shipments?id=${s.id}`,
                    severity: 'info',
                    timestamp: todayStr
                });
            });

            // 5. Capacity Alerts (Consolidations > 80%)
            const { data: consolidations } = await supabase
                .from('consolidations')
                .select('id, title, current_load_cbm, total_capacity_cbm')
                .eq('status', 'open');

            consolidations?.forEach(c => {
                if (c.total_capacity_cbm > 0 && (c.current_load_cbm / c.total_capacity_cbm) > 0.8) {
                    newAlerts.push({
                        id: `capacity-${c.id}`,
                        type: 'capacity',
                        title: 'Capacité Critique',
                        message: `Le groupage "${c.title}" est rempli à ${Math.round((c.current_load_cbm / c.total_capacity_cbm) * 100)}%.`,
                        link: `/dashboard/admin/groupage?id=${c.id}`,
                        severity: 'warning',
                        timestamp: new Date().toISOString()
                    });
                }
            });

            setAlerts(newAlerts.sort((a, b) => b.severity === 'critical' ? 1 : -1));
        } catch (error) {
            console.error("Failed to fetch admin alerts:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    if (loading && alerts.length === 0) {
        return (
            <div className="flex items-center gap-3 p-4 bg-white/50 dark:bg-slate-900/50 rounded-2xl animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm font-medium text-slate-500">Scan du réseau en cours...</span>
            </div>
        );
    }

    if (alerts.length === 0) return null;

    const getIcon = (type: string, severity: string) => {
        const className = "w-5 h-5";
        if (severity === 'critical') return <XOctagon className={`${className} text-rose-500`} />;
        if (severity === 'warning') return <AlertTriangle className={`${className} text-amber-500`} />;

        switch (type) {
            case 'support': return <MessageSquare className={`${className} text-blue-500`} />;
            case 'arrival': return <CheckCircle2 className={`${className} text-emerald-500`} />;
            case 'capacity': return <Navigation className={`${className} text-purple-500`} />;
            default: return <AlertTriangle className={`${className} text-slate-500`} />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Alerte Réseau Live</h3>
                <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <AnimatePresence mode="popLayout">
                    {alerts.map((alert) => (
                        <motion.div
                            layout
                            key={alert.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`group p-4 bg-white dark:bg-slate-900 border ${alert.severity === 'critical' ? 'border-rose-100 dark:border-rose-900/30 bg-rose-50/50' :
                                    alert.severity === 'warning' ? 'border-amber-100 dark:border-amber-900/30 bg-amber-50/50' :
                                        'border-slate-100 dark:border-white/5'
                                } rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden`}
                        >
                            <div className="flex items-start gap-3 relative z-10">
                                <div className={`p-2 rounded-2xl ${alert.severity === 'critical' ? 'bg-rose-500/10' :
                                        alert.severity === 'warning' ? 'bg-amber-500/10' :
                                            'bg-slate-100 dark:bg-slate-800'
                                    }`}>
                                    {getIcon(alert.type, alert.severity)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-[10px] font-black uppercase tracking-tight ${alert.severity === 'critical' ? 'text-rose-600' :
                                            alert.severity === 'warning' ? 'text-amber-600' :
                                                'text-slate-500'
                                        }`}>
                                        {alert.title}
                                    </p>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                                        {alert.message}
                                    </p>
                                </div>
                                <Link
                                    to={alert.link}
                                    className="p-1.5 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all rounded-lg bg-white dark:bg-slate-800 shadow-sm"
                                >
                                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                                </Link>
                            </div>

                            {/* Decorative side accent */}
                            <div className={`absolute top-0 left-0 bottom-0 w-1 transition-all group-hover:w-1.5 ${alert.severity === 'critical' ? 'bg-rose-500' :
                                    alert.severity === 'warning' ? 'bg-amber-500' :
                                        'bg-slate-300'
                                }`} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
