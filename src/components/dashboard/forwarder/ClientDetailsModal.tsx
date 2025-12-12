import { useState, useEffect } from "react";
import {
    X,
    User,
    Mail,
    Phone,
    MapPin,
    Package,
    Calendar,
    DollarSign,
    TrendingUp,
    Clock,
    ExternalLink
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

interface ClientDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: any | null; // Profile object
}

export default function ClientDetailsModal({
    isOpen,
    onClose,
    client,
}: ClientDetailsModalProps) {
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        totalShipments: 0,
        totalRevenue: 0,
        lastShipmentDate: null as string | null,
        activeShipments: 0
    });
    const [recentShipments, setRecentShipments] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen && client) {
            fetchClientStats();
        }
    }, [isOpen, client]);

    const fetchClientStats = async () => {
        setLoading(true);
        try {
            // Fetch shipments for this client (where user_id = client.id)
            // Note: As a Forwarder, I can only see shipments I am assigned to? 
            // Or if I am a "partner" I might see more?
            // For now, let's assume we fetch shipments where `user_id` is the client 
            // AND `forwarder_id` is the current user (Forwarder).

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: shipments, error } = await supabase
                .from("shipments")
                .select("id, tracking_number, status, created_at, price, currency, transport_type")
                .eq("user_id", client.id)
                .eq("forwarder_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;

            if (shipments) {
                // Calculate Stats
                const totalShipments = shipments.length;
                const activeShipments = shipments.filter(s =>
                    ['pending', 'picked_up', 'transit', 'customs'].includes(s.status)
                ).length;

                // Revenue calculation (Basic sum of price)
                // Note: Currency conversion is ignored for simplicity here, assuming main currency or 1-to-1 visual
                const revenue = shipments.reduce((sum, s) => sum + (s.price || 0), 0);

                const lastDate = shipments.length > 0 ? shipments[0].created_at : null;

                setStats({
                    totalShipments,
                    totalRevenue: revenue,
                    lastShipmentDate: lastDate,
                    activeShipments
                });

                setRecentShipments(shipments.slice(0, 5));
            }

        } catch (err) {
            console.error("Error fetching client stats:", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !client) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="relative h-32 bg-gradient-to-r from-primary to-blue-600">
                    <button
                        onClick={onClose}
                        aria-label="Fermer"
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="absolute -bottom-12 left-8">
                        <div className="h-24 w-24 rounded-2xl bg-white dark:bg-slate-700 p-1 shadow-lg">
                            <div className="h-full w-full rounded-xl bg-gray-100 dark:bg-slate-600 flex items-center justify-center overflow-hidden">
                                {client.avatar_url ? (
                                    <img src={client.avatar_url} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-10 w-10 text-gray-400" />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-6 px-8 flex-1 overflow-y-auto custom-scrollbar">
                    {/* Basic Info */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {client.full_name || "Client Inconnu"}
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400">{client.company_name || "Particulier"}</p>

                        <div className="flex flex-wrap gap-4 mt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-600">
                                <Mail className="w-4 h-4 text-primary" />
                                {client.email}
                            </div>
                            {client.phone && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-600">
                                    <Phone className="w-4 h-4 text-primary" />
                                    {client.phone}
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-slate-600">
                                <MapPin className="w-4 h-4 text-primary" />
                                {client.address || client.country || "Localisation inconnue"}
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-300">
                                    <Package className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expéditions</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? "-" : stats.totalShipments}</p>
                        </div>

                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg text-emerald-600 dark:text-emerald-300">
                                    <DollarSign className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Chiffre d'Affaires</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {loading ? "-" : stats.totalRevenue.toLocaleString()}
                                <span className="text-sm font-normal text-gray-500 ml-1">FCFA</span>
                            </p>
                        </div>

                        <div className="bg-violet-50 dark:bg-violet-900/10 p-4 rounded-2xl border border-violet-100 dark:border-violet-800">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-violet-100 dark:bg-violet-800 rounded-lg text-violet-600 dark:text-violet-300">
                                    <TrendingUp className="w-5 h-5" />
                                </div>
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">En cours</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? "-" : stats.activeShipments}</p>
                        </div>
                    </div>

                    {/* Recent Shipments */}
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-400" /> Activité Récente
                        </h3>

                        <div className="bg-gray-50 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                            {loading ? (
                                <div className="p-8 flex justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                </div>
                            ) : recentShipments.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    Aucune expédition récente trouvée pour ce client.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {recentShipments.map((shipment) => (
                                        <div key={shipment.id} className="p-4 flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${shipment.transport_type === 'air' ? 'bg-sky-100 text-sky-600' : 'bg-indigo-100 text-indigo-600'
                                                    }`}>
                                                    <Package className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{shipment.tracking_number}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(shipment.created_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${shipment.status === 'delivered'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {shipment.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
}
