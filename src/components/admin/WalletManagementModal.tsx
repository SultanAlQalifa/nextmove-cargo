import { useState, useEffect } from "react";
import { X, Wallet, ArrowUpRight, ArrowDownLeft, Clock, RefreshCw, Loader2, DollarSign } from "lucide-react";
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Wallet className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Portefeuille Client</h3>
                            <p className="text-sm text-gray-500">{user.name} ({user.email})</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        aria-label="Fermer"
                        title="Fermer"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* Balance Card */}
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <DollarSign size={100} />
                        </div>
                        <div className="relative z-10 flex justify-between items-end">
                            <div>
                                <p className="text-gray-400 font-medium mb-1">Solde Actuel</p>
                                <h2 className="text-4xl font-bold">{loading ? "..." : balance.toLocaleString()} <span className="text-xl font-medium text-gray-400">FCFA</span></h2>
                            </div>
                            <button
                                onClick={fetchWalletData}
                                className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-sm transition-colors"
                                title="Actualiser"
                            >
                                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-gray-100 pb-1">
                        <button
                            onClick={() => setActionTab("history")}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors relative ${actionTab === "history"
                                ? "text-indigo-600 bg-indigo-50"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                                }`}
                        >
                            Historique
                            {actionTab === "history" && <div className="absolute bottom-[-5px] left-0 right-0 h-0.5 bg-indigo-600 rounded-full" />}
                        </button>
                        <button
                            onClick={() => setActionTab("credit")}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors relative ${actionTab === "credit"
                                ? "text-green-600 bg-green-50"
                                : "text-gray-500 hover:text-green-600 hover:bg-green-50"
                                }`}
                        >
                            Créditer (Dépôt)
                            {actionTab === "credit" && <div className="absolute bottom-[-5px] left-0 right-0 h-0.5 bg-green-600 rounded-full" />}
                        </button>
                        <button
                            onClick={() => setActionTab("debit")}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors relative ${actionTab === "debit"
                                ? "text-red-600 bg-red-50"
                                : "text-gray-500 hover:text-red-600 hover:bg-red-50"
                                }`}
                        >
                            Débiter (Retrait)
                            {actionTab === "debit" && <div className="absolute bottom-[-5px] left-0 right-0 h-0.5 bg-red-600 rounded-full" />}
                        </button>
                    </div>

                    {/* Tab Content */}
                    {actionTab === "history" ? (
                        <div className="space-y-4">
                            {transactions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl">
                                    Aucune transaction récente.
                                </div>
                            ) : (
                                transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-full ${tx.type === 'deposit' || tx.type === 'referral_conversion' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                {tx.type === 'deposit' || tx.type === 'referral_conversion' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{tx.description || "Transaction"}</p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(tx.created_at).toLocaleString()}
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded-full capitalize">{tx.type}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                            {tx.amount > 0 ? '+' : ''}{Number(tx.amount).toLocaleString()} FCFA
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 animate-in slide-in-from-bottom-2 duration-200">
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                {actionTab === "credit" ? <ArrowDownLeft className="w-5 h-5 text-green-600" /> : <ArrowUpRight className="w-5 h-5 text-red-600" />}
                                {actionTab === "credit" ? "Créditer le compte" : "Débiter le compte"}
                            </h4>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-lg font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description / Motif</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Ex: Remboursement, Dépôt manuel..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                                    />
                                </div>

                                <button
                                    onClick={handleAction}
                                    disabled={processing}
                                    className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2
                                ${actionTab === "credit" ? "bg-green-600 hover:bg-green-700 shadow-green-200" : "bg-red-600 hover:bg-red-700 shadow-red-200"}
                                disabled:opacity-50 disabled:cursor-not-allowed
                            `}
                                >
                                    {processing && <Loader2 className="w-5 h-5 animate-spin" />}
                                    Confirmer {actionTab === "credit" ? "le crédit" : "le débit"}
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
