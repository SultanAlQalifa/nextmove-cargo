import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import PageHeader from "../../../components/common/PageHeader";
import {
    Wallet,
    Search,
    ArrowUpRight,
    ArrowDownRight,
    CreditCard,
    User,
    Download,
    XCircle,
    CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../../../contexts/ToastContext";
import { paymentService } from "../../../services/paymentService";
import { exportToExcel } from "../../../utils/exportUtils";
import { useSettings } from "../../../contexts/SettingsContext";

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
    const { settings } = useSettings();
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

    // Improved Error & Success Modal State
    const [errorModalMessage, setErrorModalMessage] = useState<string | null>(null);
    const [successModalMessage, setSuccessModalMessage] = useState<string | null>(null);

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
            setErrorModalMessage("Montant invalide");
            return;
        }

        const limits = settings?.wallet || {
            admin_min_deposit: 1000,
            admin_max_deposit: 5000000,
            admin_min_withdrawal: 1000,
            admin_max_withdrawal: 5000000,
        };

        if (adjustmentType === 'deposit') {
            if (amount < limits.admin_min_deposit) {
                setErrorModalMessage(`Le montant minimum de dépôt est de ${new Intl.NumberFormat("fr-XO").format(limits.admin_min_deposit)} FCFA`);
                return;
            }
            if (amount > limits.admin_max_deposit) {
                setErrorModalMessage(`Le montant maximum de dépôt est de ${new Intl.NumberFormat("fr-XO").format(limits.admin_max_deposit)} FCFA`);
                return;
            }
        } else {
            if (amount < limits.admin_min_withdrawal) {
                setErrorModalMessage(`Le montant minimum de retrait est de ${new Intl.NumberFormat("fr-XO").format(limits.admin_min_withdrawal)} FCFA`);
                return;
            }
            if (amount > limits.admin_max_withdrawal) {
                setErrorModalMessage(`Le montant maximum de retrait est de ${new Intl.NumberFormat("fr-XO").format(limits.admin_max_withdrawal)} FCFA`);
                return;
            }
        }

        setProcessing(true);
        try {
            await paymentService.adminAdjustWallet(
                selectedWallet.user_id,
                amount,
                adjustmentType,
                adjustmentReason || "Ajustement manuel admin"
            );

            setSuccessModalMessage("Le portefeuille a été mis à jour avec succès.");
            setIsModalOpen(false);
            fetchWallets(); // Refresh list

            // Reset form
            setAdjustmentAmount("");
            setAdjustmentReason("");
        } catch (err: any) {
            console.error("Error adjusting wallet:", err);
            // Parse explicit exception messages from the database
            const errorMessage = err?.message || err?.details || "Erreur lors de la mise à jour du portefeuille";

            // Show custom aesthetic popup instead of standard toast for DB logical errors
            setErrorModalMessage(errorMessage);
            // We intentionally do not close the adjustment modal here, so the user can see the error,
            // dismiss it, and correct their input without starting over.
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
            <AnimatePresence>
                {isModalOpen && selectedWallet && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative overflow-hidden text-center border border-indigo-100 dark:border-indigo-900/30"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

                            {/* Close Button Top Right */}
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                title="Fermer"
                                aria-label="Fermer"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>

                            <div className="mx-auto w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-4 mt-2">
                                <Wallet className="w-8 h-8 text-indigo-500" />
                            </div>

                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Recharge / Débit</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6 font-medium text-sm">
                                Portefeuille de <span className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedWallet.profiles?.full_name}</span>
                                <br />Solde actuel: <span className="font-bold">{new Intl.NumberFormat("fr-XO", { style: "currency", currency: selectedWallet.currency }).format(selectedWallet.balance)}</span>
                            </p>

                            <form onSubmit={handleAdjustment} className="space-y-4 text-left">
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setAdjustmentType("deposit")}
                                        className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all font-bold ${adjustmentType === "deposit"
                                            ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/50 dark:text-emerald-400 ring-2 ring-emerald-500/20 shadow-sm"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
                                            }`}
                                    >
                                        <ArrowUpRight className="w-5 h-5" /> Créditer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAdjustmentType("withdrawal")}
                                        className={`py-3 rounded-xl border flex flex-col items-center gap-1 transition-all font-bold ${adjustmentType === "withdrawal"
                                            ? "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/50 dark:text-rose-400 ring-2 ring-rose-500/20 shadow-sm"
                                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700"
                                            }`}
                                    >
                                        <ArrowDownRight className="w-5 h-5" /> Débiter
                                    </button>
                                </div>

                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        value={adjustmentAmount}
                                        onChange={(e) => setAdjustmentAmount(e.target.value)}
                                        className="w-full pl-4 pr-16 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-center text-xl font-black text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-bold">
                                        {selectedWallet.currency || "XOF"}
                                    </span>
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        required
                                        value={adjustmentReason}
                                        onChange={(e) => setAdjustmentReason(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 font-medium text-center text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                        placeholder="Motif (ex: Correction)"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-indigo-500 hover:from-indigo-600 to-purple-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 transition-all outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Traitement...</span>
                                        </>
                                    ) : (
                                        "Confirmer l'opération"
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Error Popup Modal */}
            <AnimatePresence>
                {errorModalMessage && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative overflow-hidden text-center border border-red-100 dark:border-red-900/30"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-rose-500"></div>
                            <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-4 mt-2">
                                <XCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Opération Refusée</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                {errorModalMessage}
                            </p>
                            <button
                                onClick={() => setErrorModalMessage(null)}
                                className="w-full py-3 px-4 bg-gradient-to-r from-red-500 hover:from-red-600 to-rose-500 hover:to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/25 transition-all outline-none focus:ring-2 focus:ring-red-500/50"
                            >
                                J'ai compris
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Success Popup Modal */}
            <AnimatePresence>
                {successModalMessage && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 relative overflow-hidden text-center border border-emerald-100 dark:border-emerald-900/30"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                            <div className="mx-auto w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 mt-2">
                                <CheckCircle className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Opération Réussie</h3>
                            <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                                {successModalMessage}
                            </p>
                            <button
                                onClick={() => setSuccessModalMessage(null)}
                                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 hover:from-emerald-600 to-teal-500 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all outline-none focus:ring-2 focus:ring-emerald-500/50"
                            >
                                Continuer
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
