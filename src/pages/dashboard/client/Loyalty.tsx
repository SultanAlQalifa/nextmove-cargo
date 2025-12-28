import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Crown, Star, Gift, TrendingUp, History, X, Send,
    ArrowUpRight, ArrowDownLeft, Users, Copy, Share2, Check, Linkedin, ArrowRightLeft
} from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { useSettings } from "../../../contexts/SettingsContext";
import { useDataSync } from "../../../contexts/DataSyncContext";
import { loyaltyService, PointTransaction } from "../../../services/loyaltyService";
import { referralService, Referral } from "../../../services/referralService";

export default function LoyaltyDashboard() {
    const { user, profile, refreshProfile } = useAuth();
    const { settings } = useSettings();
    const { success, error: toastError } = useToast();

    useDataSync("profiles", () => refreshProfile());
    useDataSync("point_history", () => {
        // Small delay to ensure DB propagation before fetching
        setTimeout(() => {
            fetchHistory();
            refreshProfile();
        }, 500);
    });
    useDataSync("referrals", () => fetchReferrals());

    const [searchParams] = useSearchParams();
    const initialTab = searchParams.get("tab") as 'overview' | 'referrals' | 'history' | null;
    const [activeTab, setActiveTab] = useState<'overview' | 'referrals' | 'history'>(initialTab || 'overview');

    // Modals
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

    // Forms
    const [convertAmount, setConvertAmount] = useState("");
    const [transferEmail, setTransferEmail] = useState("");
    const [transferAmount, setTransferAmount] = useState("");

    // Data
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<PointTransaction[]>([]);

    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [referralStats, setReferralStats] = useState({ total: 0, pending: 0, completed: 0 });

    // Referral Code
    const [copied, setCopied] = useState(false);
    const [localCode, setLocalCode] = useState<string | null>(null);

    const pointValue = settings?.loyalty?.point_value || 10;
    const points = profile?.loyalty_points || 0;

    useEffect(() => {
        fetchHistory();
        if (user) fetchReferrals();
    }, [user]);

    useEffect(() => {
        if (profile?.referral_code) {
            setLocalCode(profile.referral_code);
        }
    }, [profile]);

    const fetchHistory = async () => {
        try {
            const data = await loyaltyService.getHistory();
            setHistory(data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchReferrals = async () => {
        if (!user) return;
        try {
            // Self-Healing: Generate code if missing
            if (!profile?.referral_code && !localCode) {
                const newCode = await referralService.generateReferralCode(user.id, profile?.full_name || "Utilisateur");
                setLocalCode(newCode);
            }

            const [stats, list] = await Promise.all([
                referralService.getStats(user.id),
                referralService.getReferrals(user.id)
            ]);
            setReferralStats(stats as any);
            setReferrals(list);
        } catch (error) {
            console.error(error);
        }
    };

    const handleConvert = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!convertAmount) return;
        setLoading(true);
        try {
            await loyaltyService.convertPoints(parseInt(convertAmount));
            success(`Succès! ${convertAmount} points convertis.`);
            setIsConvertModalOpen(false);
            setConvertAmount("");
            refreshProfile();
            fetchHistory();
        } catch (error: any) {
            toastError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!transferEmail || !transferAmount) return;
        setLoading(true);
        try {
            await loyaltyService.transferPoints(transferEmail, parseInt(transferAmount));
            success(`Transfert de ${transferAmount} points envoyé à ${transferEmail} !`);
            setIsTransferModalOpen(false);
            setTransferEmail("");
            setTransferAmount("");
            refreshProfile();
            fetchHistory();
        } catch (error: any) {
            toastError("Echec du transfert : " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const copyCode = () => {
        const codeToUse = localCode || profile?.referral_code;
        if (codeToUse) {
            navigator.clipboard.writeText(codeToUse);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            success("Code copié !");
        }
    };

    const shareReferral = async () => {
        const codeToUse = localCode || profile?.referral_code;
        if (navigator.share && codeToUse) {
            try {
                await navigator.share({
                    title: "Rejoignez NextMove Cargo",
                    text: `Rejoignez - moi sur NextMove Cargo! Utilisez mon code ${codeToUse} pour obtenir des avantages.`,
                    url: `${window.location.origin}/register?referral=${codeToUse}`,
                });
            } catch (err) {
                // ignore
            }
        } else {
            copyCode();
        }
    };

    const getReasonLabel = (reason: string) => {
        switch (reason) {
            case 'shipment_reward': return "Récompense Livraison";
            case 'referral_bonus': return "Bonus Parrainage";
            case 'wallet_conversion': return "Conversion en Portefeuille";
            case 'transfer_sent': return "Transfert Envoyé";
            case 'transfer_received': return "Transfert Reçu";
            default: return reason;
        }
    };

    const getReasonIcon = (reason: string) => {
        switch (reason) {
            case 'wallet_conversion': return <ArrowRightLeft className="text-orange-500" />;
            case 'transfer_sent': return <ArrowUpRight className="text-red-500" />;
            case 'transfer_received': return <ArrowDownLeft className="text-green-500" />;
            default: return <Gift className="text-purple-500" />;
        }
    };

    return (
        <div className="space-y-8 pb-12">
            <PageHeader
                title="Club Fidélité & Parrainage"
                subtitle="Un seul endroit pour gérer vos points, vos amis et vos récompenses."
            />

            {/* Hero Card */}
            <div className="bg-gradient-to-r from-indigo-900 to-purple-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center mb-8 relative group">
                        <div className="inline-flex items-center justify-center bg-yellow-100 text-yellow-700 rounded-full px-4 py-1.5 text-sm font-bold mb-4 shadow-sm border border-yellow-200">
                            <Crown className="w-4 h-4 mr-2" />
                            {profile?.tier || 'Bronze'} Member
                        </div>

                        <div className="relative inline-block">
                            <h2 className="text-6xl font-black text-white drop-shadow-sm tracking-tighter flex items-center gap-4 justify-center">
                                {points}
                            </h2>
                            <p className="text-indigo-100 font-medium mt-1">points</p>
                        </div>

                        <div className="mt-4 inline-flex items-center bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 text-sm text-indigo-50 border border-white/10">
                            <Gift className="w-4 h-4 mr-2 text-yellow-300" />
                            <span>Valeur estimée : </span>
                            <span className="font-bold ml-1 text-white">
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(points * pointValue)}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        <button
                            onClick={() => setIsConvertModalOpen(true)}
                            className="px-6 py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg flex items-center justify-center gap-2"
                        >
                            <ArrowRightLeft size={20} /> Convertir en Crédit
                        </button>
                        <button
                            onClick={() => setIsTransferModalOpen(true)}
                            className="px-6 py-3 bg-indigo-700/50 text-white font-bold rounded-xl hover:bg-indigo-700/70 border border-white/20 transition-colors flex items-center justify-center gap-2"
                        >
                            <Send size={20} /> Envoyer à un ami
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap flex items-center gap-2
                        ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                    <Star size={18} /> Aperçu
                </button>
                <button
                    onClick={() => setActiveTab('referrals')}
                    className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap flex items-center gap-2
                        ${activeTab === 'referrals' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                    <Users size={18} /> Mon Parrainage
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 rounded-xl font-medium transition-all whitespace-nowrap flex items-center gap-2
                        ${activeTab === 'history' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                    <History size={18} /> Historique
                </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                                    <Gift className="w-6 h-6 text-purple-600" />
                                </div>
                                <h3 className="font-bold text-lg mb-2 text-slate-900">Gagnez des points</h3>
                                <p className="text-slate-500 text-sm">
                                    50 points par colis livré + 500 points pour chaque ami parrainé (dès son 1er colis).
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4">
                                    <Star className="w-6 h-6 text-amber-600" />
                                </div>
                                <h3 className="font-bold text-lg mb-2 text-slate-900">Bonus Status</h3>
                                <p className="text-slate-500 text-sm">
                                    Progressez vers le statut Gold pour gagner x1.5 points sur chaque expédition.
                                </p>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                                    <TrendingUp className="w-6 h-6 text-emerald-600" />
                                </div>
                                <h3 className="font-bold text-lg mb-2 text-slate-900">Utilisez vos points</h3>
                                <p className="text-slate-500 text-sm">
                                    Convertissez vos points en crédit d'expédition ou offrez-les à vos proches.
                                </p>
                            </div>
                        </div>

                        {/* Recent Activity Preview */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <History size={20} className="text-slate-400" /> Activité Récente
                            </h3>
                            {history.slice(0, 5).map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-gray-50 rounded-lg">{getReasonIcon(tx.reason)}</div>
                                        <div>
                                            <p className="font-medium text-sm text-gray-900">{getReasonLabel(tx.reason)}</p>
                                            <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className={`font-bold ${tx.amount > 0 ? "text-emerald-600" : "text-slate-600"}`}>
                                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                                    </span>
                                </div>
                            ))}
                            {history.length === 0 && <p className="text-sm text-slate-400 italic">Aucune activité récente.</p>}
                        </div>
                    </motion.div>
                )}

                {/* REFERRALS TAB */}
                {activeTab === 'referrals' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="bg-white rounded-2xl p-8 border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30">
                            <div className="text-center max-w-lg mx-auto">
                                <h3 className="text-2xl font-bold text-indigo-900 mb-2">Invitez vos amis</h3>
                                <p className="text-indigo-600/80 mb-6">Partagez votre code unique. Vous gagnez 500 points dès qu'ils expédient leur premier colis !</p>

                                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-indigo-100 shadow-sm max-w-md mx-auto">
                                    <code className="flex-1 text-center text-xl font-mono font-bold text-indigo-900 tracking-wider">
                                        {localCode || profile?.referral_code || "---"}
                                    </code>
                                    <button
                                        onClick={copyCode}
                                        className="p-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors"
                                        aria-label="Copier votre code de parrainage"
                                    >
                                        {copied ? <Check size={20} /> : <Copy size={20} />}
                                    </button>
                                </div>

                                <div className="flex justify-center gap-3 mt-4">
                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent(`Rejoignez-moi sur NextMove Cargo! Utilisez mon code ${localCode || profile?.referral_code} pour obtenir des avantages. ${window.location.origin}/register?referral=${localCode || profile?.referral_code}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#128C7E] transition-colors"
                                    >
                                        <Send size={18} /> WhatsApp
                                    </a>
                                    <a
                                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}/register?referral=${localCode || profile?.referral_code}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-[#0077b5] text-white font-bold rounded-xl hover:bg-[#005582] transition-colors"
                                    >
                                        <Linkedin size={18} /> LinkedIn
                                    </a>
                                    <button
                                        onClick={shareReferral}
                                        className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                        title="Plus d'options de partage"
                                    >
                                        <Share2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
                                <p className="text-slate-500 text-sm mb-1">Total Filleuls</p>
                                <p className="text-3xl font-bold text-slate-900">{referralStats.total || 0}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
                                <p className="text-slate-500 text-sm mb-1">En Attente</p>
                                <p className="text-3xl font-bold text-amber-500">{referrals.filter(r => r.status === 'pending').length}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
                                <p className="text-slate-500 text-sm mb-1">Récompensés</p>
                                <p className="text-3xl font-bold text-emerald-500">{referrals.filter(r => ['completed', 'rewarded'].includes(r.status)).length}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="font-bold text-gray-900">Mes Filleuls</h3>
                            </div>
                            {referrals.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">
                                    Vous n'avez parrainé personne pour le moment.
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                                        <tr>
                                            <th className="px-6 py-3 text-left">Nom</th>
                                            <th className="px-6 py-3 text-left">Date</th>
                                            <th className="px-6 py-3 text-left">Statut</th>
                                            <th className="px-6 py-3 text-right">Points</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {referrals.map(ref => (
                                            <tr key={ref.id} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {ref.referred_profile?.full_name || "Utilisateur"}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {new Date(ref.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                        ${['completed', 'rewarded'].includes(ref.status) ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                                        {ref.status === 'pending' ? 'En attente' : 'Validé'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-emerald-600">
                                                    {ref.points_earned > 0 ? `+${ref.points_earned}` : "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        {history.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">
                                Aucun historique disponible.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                        <tr>
                                            <th className="px-6 py-4 text-left">Type</th>
                                            <th className="px-6 py-4 text-left">Date</th>
                                            <th className="px-6 py-4 text-right">Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {history.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-slate-50 rounded-full">
                                                            {getReasonIcon(tx.reason)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-900">{getReasonLabel(tx.reason)}</p>
                                                            {tx.metadata?.recipient_email && (
                                                                <p className="text-xs text-slate-500">Vers {tx.metadata.recipient_email}</p>
                                                            )}
                                                            {tx.metadata?.sender_email && (
                                                                <p className="text-xs text-slate-500">De {tx.metadata.sender_email}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {new Date(tx.created_at).toLocaleDateString("fr-FR", {
                                                        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </td>
                                                <td className={`px-6 py-4 text-right font-bold ${tx.amount > 0 ? "text-emerald-600" : "text-slate-600"}`}>
                                                    {tx.amount > 0 ? "+" : ""}{tx.amount}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Convert Modal */}
            {isConvertModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative shadow-xl">
                        <button onClick={() => setIsConvertModalOpen(false)} aria-label="Fermer" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                        <h3 className="text-xl font-bold mb-1">Convertir mes points</h3>
                        <p className="text-sm text-gray-500 mb-6">Solde actuel: <span className="font-bold text-indigo-600">{points} pts</span></p>

                        <form onSubmit={handleConvert} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Points à convertir</label>
                                <input
                                    type="number"
                                    value={convertAmount}
                                    onChange={(e) => setConvertAmount(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="Ex: 500"
                                    max={points}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="bg-indigo-50 p-4 rounded-xl flex justify-between items-center text-indigo-900">
                                <span className="text-sm font-medium">Vous recevrez :</span>
                                <span className="text-lg font-bold">{(parseInt(convertAmount || "0") * pointValue).toLocaleString()} FCFA</span>
                            </div>
                            <button disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50">
                                {loading ? "Conversion..." : "Valider la conversion"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Transfer Modal */}
            {isTransferModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative shadow-xl">
                        <button onClick={() => setIsTransferModalOpen(false)} aria-label="Fermer" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                        <h3 className="text-xl font-bold mb-1">Envoyer des points</h3>
                        <p className="text-sm text-gray-500 mb-6">Offrez vos points à un ami ou un proche.</p>

                        <form onSubmit={handleTransfer} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email du destinataire</label>
                                <input
                                    type="email"
                                    value={transferEmail}
                                    onChange={(e) => setTransferEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="ami@exemple.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Montant à envoyer</label>
                                <input
                                    type="number"
                                    value={transferAmount}
                                    onChange={(e) => setTransferAmount(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    placeholder="Ex: 1000"
                                    max={points}
                                    min="1"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1 text-right">Max: {points} pts</p>
                            </div>
                            <button disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg disabled:opacity-50">
                                {loading ? "Envoi en cours..." : "Confirmer l'envoi"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
