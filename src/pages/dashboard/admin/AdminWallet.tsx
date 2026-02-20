import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import PageHeader from "../../../components/common/PageHeader";
import {
    Wallet,
    Search,
    MoreVertical,
    ArrowUpRight,
    ArrowDownRight,
    CreditCard,
    User,
    Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../../contexts/ToastContext";
import { paymentService } from "../../../services/paymentService";
import { exportToExcel } from "../../../utils/exportUtils";

interface WalletData {
    id: string;
    user_id: string;
    balance: number;
    currency: string;
    updated_at: string;
    profiles: {
        full_name: string;
        email: string;
        avatar_url?: string;
        role: string;
    };
}

export default function AdminWallet() {
    const { success, error: showError } = useToast();
    const [wallets, setWallets] = useState<WalletData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    // Modal State for Adjustments
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
    const [adjustmentAmount, setAdjustmentAmount] = useState("");
    const [adjustmentType, setAdjustmentType] = useState<"deposit" | "withdrawal">("deposit");
    const [adjustmentReason, setAdjustmentReason] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchWallets();
    }, []);

    const fetchWallets = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("wallets")
                .select(`
          *,
          profiles (
            full_name,
            email,
            avatar_url,
            role
          )
        `)
                .order("balance", { ascending: false });

            if (error) throw error;
            setWallets(data || []);
        } catch (err) {
            console.error("Error fetching wallets:", err);
            showError("Erreur lors du chargement des portefeuilles");
        } finally {
            setLoading(false);
        }
    };

    const handleAdjustment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWallet) return;

        const amount = parseFloat(adjustmentAmount);
        if (!amount || amount <= 0) {
            showError("Montant invalide");
            return;
        }

        setProcessing(true);
        try {
            await paymentService.adminAdjustWallet(
                selectedWallet.user_id,
                amount,
                adjustmentType,
                adjustmentReason || "Ajustement manuel admin"
            );

            success("Portefeuille mis à jour avec succès");
            setIsModalOpen(false);
            fetchWallets(); // Refresh list

            // Reset form
            setAdjustmentAmount("");
            setAdjustmentReason("");
        } catch (err) {
            console.error("Error adjusting wallet:", err);
            showError("Erreur lors de la mise à jour du portefeuille");
        } finally {
            setProcessing(false);
        }
    };

    const filteredWallets = wallets.filter((wallet) => {
        const matchesSearch =
            wallet.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            wallet.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesRole = roleFilter === "all" || wallet.profiles?.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    const totalSystemBalance = wallets.reduce((acc, curr) => acc + curr.balance, 0);

    return (
        <div className="space-y-6 p-6">
            <PageHeader
                title="Gestion des Portefeuilles"
                subtitle="Vue d'ensemble et gestion des soldes utilisateurs"
                action={{
                    label: "Exporter (Excel)",
                    onClick: () => {
                        const exportData = filteredWallets.map(w => ({
                            "Nom d'Utilisateur": w.profiles?.full_name || "Sans nom",
                            "Email": w.profiles?.email || "",
                            "Rôle": w.profiles?.role || "",
                            "Solde": w.balance,
                            "Devise": w.currency,
                            "Dernière MAJ": new Date(w.updated_at).toLocaleDateString()
                        }));
                        exportToExcel(exportData, "Rapport_Portefeuilles_NextMove");
                        success("Fichier Excel généré avec succès !");
                    },
                    icon: Download,
                }}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-indigo-500/10 dark:shadow-none border border-indigo-100 dark:border-indigo-500/20 relative overflow-hidden group"
                >
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                            <Wallet className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Solde Total Système</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                                {new Intl.NumberFormat("fr-XO", { style: "currency", currency: "XOF" }).format(totalSystemBalance)}
                            </h3>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-emerald-500/10 dark:shadow-none border border-emerald-100 dark:border-emerald-500/20 relative overflow-hidden group"
                >
                    <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Portefeuilles Actifs</p>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">{wallets.length}</h3>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-3 rounded-2xl shadow-lg shadow-slate-200/40 dark:shadow-none border border-slate-200/50 dark:border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between relative z-10"
            >
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un utilisateur..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all font-medium"
                        />
                    </div>

                    <div className="relative w-full sm:w-auto">
                        <select
                            aria-label="Filter by Role"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="w-full sm:w-auto appearance-none pl-4 pr-10 py-3 border border-slate-200 dark:border-white/5 rounded-xl bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-800 transition-all cursor-pointer font-bold text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/50"
                        >
                            <option value="all">Tous les rôles</option>
                            <option value="client">Clients</option>
                            <option value="forwarder">Prestataires</option>
                            <option value="driver">Chauffeurs</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/90 dark:bg-slate-900/90 rounded-3xl backdrop-blur-xl shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200/50 dark:border-white/5 overflow-visible"
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200/50 dark:divide-white/5 text-left">
                        <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md rounded-t-3xl">
                            <tr>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest rounded-tl-3xl">Utilisateur</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Rôle</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-right">Solde Actuel</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Dernière MAJ</th>
                                <th className="relative px-6 py-4 rounded-tr-3xl"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            <AnimatePresence>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-bold">Chargement centralisé...</td>
                                    </tr>
                                ) : filteredWallets.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">Aucun portefeuille trouvé</td>
                                    </tr>
                                ) : (
                                    filteredWallets.map((wallet, idx) => (
                                        <motion.tr
                                            key={wallet.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/40 dark:to-indigo-800/40 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold shadow-inner group-hover:scale-105 transition-transform shrink-0">
                                                        {wallet.profiles?.full_name?.charAt(0) || wallet.profiles?.email?.charAt(0) || "?"}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white">{wallet.profiles?.full_name || "Sans nom"}</p>
                                                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{wallet.profiles?.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm">
                                                    {wallet.profiles?.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                                    {new Intl.NumberFormat("fr-XO", { style: "currency", currency: wallet.currency || "XOF" }).format(wallet.balance)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                {new Date(wallet.updated_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <button
                                                    onClick={() => {
                                                        setSelectedWallet(wallet);
                                                        setIsModalOpen(true);
                                                    }}
                                                    className="p-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400 transition-colors shadow-sm"
                                                    title="Ajuster le solde"
                                                >
                                                    <CreditCard className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Adjustment Modal */}
            {isModalOpen && selectedWallet && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in hover:scale-[1.01] transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Ajustement de Solde</h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <MoreVertical className="w-5 h-5 rotate-90" /> {/* Using as close icon fallback if X not imported, though X is usually better */}
                            </button>
                        </div>

                        <div className="mb-6 p-4 bg-gray-50 rounded-xl flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-xl font-bold text-indigo-600">
                                {selectedWallet.profiles?.full_name?.charAt(0)}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{selectedWallet.profiles?.full_name}</p>
                                <p className="text-sm text-gray-500">Solde actuel: {new Intl.NumberFormat("fr-XO", { style: "currency", currency: selectedWallet.currency }).format(selectedWallet.balance)}</p>
                            </div>
                        </div>

                        <form onSubmit={handleAdjustment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type d'opération</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setAdjustmentType("deposit")}
                                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${adjustmentType === "deposit"
                                            ? "bg-green-50 border-green-200 text-green-700 ring-2 ring-green-500/20"
                                            : "bg-white border-gray-200 hover:bg-gray-50 text-gray-600"
                                            }`}
                                    >
                                        <ArrowUpRight className="w-4 h-4" /> Créditer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdjustmentType("withdrawal")}
                                        className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${adjustmentType === "withdrawal"
                                            ? "bg-red-50 border-red-200 text-red-700 ring-2 ring-red-500/20"
                                            : "bg-white border-gray-200 hover:bg-gray-50 text-gray-600"
                                            }`}
                                    >
                                        <ArrowDownRight className="w-4 h-4" /> Débiter
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        value={adjustmentAmount}
                                        onChange={(e) => setAdjustmentAmount(e.target.value)}
                                        className="w-full pl-4 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-lg font-medium"
                                        placeholder="0.00"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                                        {selectedWallet.currency}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Motif</label>
                                <input
                                    type="text"
                                    required
                                    value={adjustmentReason}
                                    onChange={(e) => setAdjustmentReason(e.target.value)}
                                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                    placeholder="Ex: Correction, Bonus, Remboursement..."
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                    disabled={processing}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {processing ? "Traitement..." : "Confirmer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
