import { useState, useEffect } from "react";
import { X, Wallet, ArrowUpRight, ArrowDownLeft, Clock, RefreshCw, Loader2, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { useToast } from "../../contexts/ToastContext";
import { paymentService } from "../../services/paymentService";

interface WalletManagementModalProps {
    user: any;
    onClose: () => void;
}

export default function WalletManagementModal({ user, onClose }: WalletManagementModalProps) {
    const { success, error: toastError } = useToast();
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [actionTab, setActionTab] = useState<"history" | "credit" | "debit">("history");

    // Action State
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");

    const fetchWalletData = async () => {
        setLoading(true);
        try {
            // 1. Get Wallet
            const { data: wallet } = await supabase
                .from("wallets")
                .select("id, balance")
                .eq("user_id", user.id)
                .maybeSingle();

            if (wallet) {
                setBalance(Number(wallet.balance));

                // 2. Get Transactions
                const { data: txs } = await supabase
                    .from("transactions")
                    .select("*")
                    .eq("wallet_id", wallet.id)
                    .order("created_at", { ascending: false })
                    .limit(10);

                setTransactions(txs || []);
            } else {
                // No wallet found - implies 0 balance, empty history
                setBalance(0);
                setTransactions([]);
            }
        } catch (err) {
            console.error("Error fetching wallet data:", err);
            toastError("Erreur lors du chargement du portefeuille.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWalletData();
    }, [user]);

    const handleAction = async () => {
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toastError("Veuillez entrer un montant valide.");
            return;
        }
        if (!description) {
            toastError("Une description est requise.");
            return;
        }

        setProcessing(true);
        try {
            // Use the new service method
            await paymentService.adminAdjustWallet(
                user.id,
                Number(amount),
                actionTab === "credit" ? "deposit" : "withdrawal",
                description
            );

            success(`Portefeuille ${actionTab === "credit" ? "crédité" : "débité"} avec succès.`);
            setAmount("");
            setDescription("");
            setActionTab("history"); // Go back to history to show new tx
            await fetchWalletData(); // Refresh data
        } catch (err: any) {
            console.error("Wallet action error:", err);
            toastError(err.message || "Une erreur est survenue.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-slate-900/20 dark:shadow-none flex flex-col max-h-[90vh] border border-slate-200/50 dark:border-white/10"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white/50 dark:bg-slate-800/50 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-inner">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 dark:text-white tracking-tight text-lg">Portefeuille Client</h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{user.name} ({user.email})</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors shadow-sm"
                        aria-label="Fermer"
                        title="Fermer"
                    >
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">

                    {/* Balance Holographic Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-indigo-900 via-slate-900 to-black rounded-3xl p-8 text-white shadow-2xl shadow-indigo-500/20 mb-8 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0"></div>
                        <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/30 rounded-full blur-3xl group-hover:bg-primary/40 transition-colors z-0 duration-700"></div>

                        <div className="relative z-10 flex justify-between items-end">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <CreditCard className="w-5 h-5 text-indigo-300" />
                                    <p className="text-indigo-200 font-medium uppercase tracking-widest text-xs">Informations Compte</p>
                                </div>
                                <p className="text-slate-400 font-medium mb-1">Solde Actuel</p>
                                <h2 className="text-4xl font-black tracking-tight [text-shadow:0_2px_10px_rgba(0,0,0,0.5)]">
                                    {loading ? "..." : balance.toLocaleString()} <span className="text-xl font-medium text-slate-400">FCFA</span>
                                </h2>
                            </div>
                            <button
                                onClick={fetchWalletData}
                                className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl backdrop-blur-md shadow-lg transition-all border border-white/5 group"
                                title="Actualiser"
                            >
                                <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                            </button>
                        </div>
                    </motion.div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200/50 dark:border-white/5">
                        <button
                            onClick={() => setActionTab("history")}
                            className={`flex-1 px-4 py-2.5 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${actionTab === "history"
                                ? "text-indigo-700 bg-white dark:bg-slate-700 dark:text-indigo-400 shadow-sm"
                                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                }`}
                        >
                            Historique
                        </button>
                        <button
                            onClick={() => setActionTab("credit")}
                            className={`flex-1 px-4 py-2.5 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${actionTab === "credit"
                                ? "text-emerald-700 bg-white dark:bg-slate-700 dark:text-emerald-400 shadow-sm"
                                : "text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400"
                                }`}
                        >
                            Créditer
                        </button>
                        <button
                            onClick={() => setActionTab("debit")}
                            className={`flex-1 px-4 py-2.5 text-sm font-black uppercase tracking-widest rounded-xl transition-all ${actionTab === "debit"
                                ? "text-rose-700 bg-white dark:bg-slate-700 dark:text-rose-400 shadow-sm"
                                : "text-slate-500 hover:text-rose-600 dark:hover:text-rose-400"
                                }`}
                        >
                            Débiter
                        </button>
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        {actionTab === "history" ? (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-4"
                            >
                                {transactions.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-white/5 font-medium">
                                        Aucune transaction récente.
                                    </div>
                                ) : (
                                    transactions.map((tx, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            key={tx.id}
                                            className="flex items-center justify-between p-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200/50 dark:border-white/5 rounded-2xl shadow-sm hover:shadow-md transition-shadow backdrop-blur-md"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3.5 rounded-2xl shadow-inner ${tx.amount > 0 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                                                    {tx.amount > 0 ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white leading-tight">{tx.description || "Transaction"}</p>
                                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        {new Date(tx.created_at).toLocaleString()}
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                        <span className="capitalize">{tx.type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`text-lg font-black tracking-tight ${tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                                                {tx.amount > 0 ? '+' : ''}{Number(tx.amount).toLocaleString()} <span className="text-xs text-slate-400 font-bold tracking-normal">FCFA</span>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="action"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-slate-50/80 dark:bg-slate-800/80 p-6 rounded-3xl border border-slate-200/50 dark:border-white/5 backdrop-blur-md"
                            >
                                <h4 className={`font-black tracking-tight mb-6 flex items-center gap-2 text-lg ${actionTab === "credit" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
                                    {actionTab === "credit" ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                                    {actionTab === "credit" ? "Créditer le compte (Dépôt)" : "Débiter le compte (Retrait)"}
                                </h4>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">Montant (FCFA)</label>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0"
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none text-2xl font-black shadow-inner transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">Description / Motif</label>
                                        <input
                                            type="text"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Ex: Remboursement, Dépôt manuel..."
                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none font-medium shadow-inner transition-all"
                                        />
                                    </div>

                                    <button
                                        onClick={handleAction}
                                        disabled={processing}
                                        className={`w-full py-4 mt-2 rounded-2xl font-black uppercase tracking-widest text-white shadow-xl transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]
                                            ${actionTab === "credit" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30" : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/30"}
                                            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                                        `}
                                    >
                                        {processing && <Loader2 className="w-5 h-5 animate-spin" />}
                                        Confirmer {actionTab === "credit" ? "le crédit" : "le débit"}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </motion.div>
        </div>
    );
}
