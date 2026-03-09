import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import {
    Clock, CheckCircle, RefreshCw,
    Banknote, User, FileText, Check, X
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";

interface CashOperation {
    id: string;
    session_id: string;
    type: "in" | "out";
    amount: number;
    reason: string;
    status: "pending" | "approved" | "rejected";
    created_at: string;
    created_by: string;
    agent?: { full_name: string; email: string };
}

export default function AdminPOSCashApprovals() {
    const { success, error: toastError, info } = useToast();
    const [operations, setOperations] = useState<CashOperation[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchPendingOperations = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("pos_cash_operations")
                .select(`
                    *,
                    agent:profiles!pos_cash_operations_created_by_fkey(full_name, email)
                `)
                .eq("status", "pending")
                .eq("type", "out")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setOperations(data || []);
        } catch (err: any) {
            toastError(err.message || "Erreur lors du chargement des opérations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingOperations();

        // Real-time subscription
        const channel = supabase.channel('pos_approvals')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'pos_cash_operations', filter: "status=eq.pending" },
                () => {
                    fetchPendingOperations();
                    if (info) info("Nouvelle demande de retrait en attente !");
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleApproveReject = async (id: string, newStatus: "approved" | "rejected") => {
        setProcessingId(id);
        try {
            const { error } = await supabase
                .from("pos_cash_operations")
                .update({
                    status: newStatus,
                    approved_at: new Date().toISOString(),
                    // approved_by is handled by RLS/Trigger via auth.uid() if not passed directly, but we can rely on user token.
                })
                .eq("id", id);

            if (error) throw error;

            success(`Demande ${newStatus === 'approved' ? 'approuvée' : 'rejetée'} avec succès`);
            setOperations(prev => prev.filter(op => op.id !== id));
        } catch (err: any) {
            toastError(err.message || "Erreur de mise à jour");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Banknote className="w-8 h-8 text-indigo-600" />
                        Approbations de Caisse (POS)
                    </h1>
                    <p className="text-slate-500 mt-2 font-medium">Gérez les demandes de sorties de caisse des agences</p>
                </div>
                <button
                    onClick={fetchPendingOperations}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold shadow-sm hover:border-slate-300 hover:shadow transition-all group"
                >
                    <RefreshCw className={`w-4 h-4 text-indigo-500 ${loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"}`} />
                    Rafraîchir
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl">
                    <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
                    <p className="text-slate-500 font-medium tracking-wide">Vérification des demandes...</p>
                </div>
            ) : operations.length === 0 ? (
                <div className="bg-white/70 backdrop-blur-xl border border-slate-100 rounded-3xl p-16 text-center shadow-xl shadow-slate-200/50">
                    <div className="w-24 h-24 mx-auto bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-2">Aucune demande en attente</h3>
                    <p className="text-slate-500 font-medium">Toutes les opérations de caisse ont été traitées.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {operations.map((op) => (
                        <div key={op.id} className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-10 group-hover:bg-amber-100 transition-colors"></div>

                            <div className="flex justify-between items-start mb-6">
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" /> En attente
                                </span>
                                <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                                    {new Date(op.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div className="mb-6">
                                <p className="text-3xl font-black text-slate-900 mb-1">
                                    {op.amount.toLocaleString()} <span className="text-lg text-slate-400 font-bold">XOF</span>
                                </p>
                                <p className="text-sm font-semibold text-rose-500 uppercase tracking-widest">Demande de Retrait</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5" /> Agent
                                    </label>
                                    <p className="text-slate-800 font-semibold">{op.agent?.full_name || "Agent Inconnu"}</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5" /> Motif
                                    </label>
                                    <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 text-sm leading-relaxed">
                                        "{op.reason}"
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                <button
                                    onClick={() => handleApproveReject(op.id, "rejected")}
                                    disabled={processingId !== null}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
                                >
                                    {processingId === op.id ? <RefreshCw className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                                    Rejeter
                                </button>
                                <button
                                    onClick={() => handleApproveReject(op.id, "approved")}
                                    disabled={processingId !== null}
                                    className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                                >
                                    {processingId === op.id ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                    Approuver
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
