import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import PageHeader from "../../../components/common/PageHeader";
import {
    Wallet,
    Search,
    Wallet,
    Search,
    MoreVertical,
    ArrowUpRight,
    ArrowDownRight,
    CreditCard,
    User,
    Download,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";
import { paymentService } from "../../../services/paymentService";

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
                    label: "Exporter",
                    onClick: () => success("Export non implémenté"),
                    icon: Download,
                }}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Wallet className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Solde Total Système</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {new Intl.NumberFormat("fr-XO", { style: "currency", currency: "XOF" }).format(totalSystemBalance)}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <User className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Portefeuilles Actifs</p>
                            <h3 className="text-2xl font-bold text-gray-900">{wallets.length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un utilisateur..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        />
                    </div>

                    <select
                        aria-label="Filter by Role"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 border rounded-xl bg-gray-50 focus:bg-white transition-all cursor-pointer"
                    >
                        <option value="all">Tous les rôles</option>
                        <option value="client">Clients</option>
                        <option value="forwarder">Prestataires</option>
                        <option value="driver">Chauffeurs</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Utilisateur</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Rôle</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Solde Actuel</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Dernière MAJ</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Chargement...</td>
                                </tr>
                            ) : filteredWallets.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Aucun portefeuille trouvé</td>
                                </tr>
                            ) : (
                                filteredWallets.map((wallet) => (
                                    <tr key={wallet.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                                    {wallet.profiles?.full_name?.charAt(0) || wallet.profiles?.email?.charAt(0) || "?"}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{wallet.profiles?.full_name || "Sans nom"}</p>
                                                    <p className="text-xs text-gray-500">{wallet.profiles?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium uppercase">
                                                {wallet.profiles?.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="font-bold text-gray-900">
                                                {new Intl.NumberFormat("fr-XO", { style: "currency", currency: wallet.currency || "XOF" }).format(wallet.balance)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(wallet.updated_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => {
                                                    setSelectedWallet(wallet);
                                                    setIsModalOpen(true);
                                                }}
                                                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-indigo-600 transition-colors"
                                                title="Ajuster le solde"
                                            >
                                                <CreditCard className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
