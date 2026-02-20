import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
import LoyaltyCenter from "../../../components/dashboard/LoyaltyCenter";

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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12 relative"
        >
            <div className="grain-overlay opacity-[0.02]" />
            <PageHeader
                title="Club Fidélité & Parrainage"
                subtitle="Gérez vos points, votre réseau et vos privilèges exclusifs."
            />

            {/* Premium Loyalty Center Component */}
            <LoyaltyCenter
                points={points}
                tier={profile?.tier || 'Bronze'}
                pointValue={pointValue}
                onConvert={() => setIsConvertModalOpen(true)}
                onTransfer={() => setIsTransferModalOpen(true)}
            />

            {/* Navigation Tabs - Elite Design */}
            <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar">
                {[
                    { id: 'overview', icon: Star, label: 'Aperçu' },
                    { id: 'referrals', icon: Users, label: 'Parrainage' },
                    { id: 'history', icon: History, label: 'Historique' }
                ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-3 relative whitespace-nowrap
                                ${isActive
                                    ? 'text-white shadow-xl shadow-blue-500/20'
                                    : 'bg-white/50 dark:bg-slate-900/50 text-slate-500 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-white/10'}`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-blue-600 rounded-2xl -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <Icon size={16} className={isActive ? "animate-pulse" : ""} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { title: "Gagnez des points", content: "50 pts par colis + 500 pts par parrainage validé.", icon: Gift, color: "blue" },
                                { title: "Bonus Status", content: "Passez Gold pour multiplier vos gains par x1.5.", icon: Star, color: "amber" },
                                { title: "Utilisez vos points", content: "Convertissez en crédit ou offrez vos points.", icon: TrendingUp, color: "emerald" }
                            ].map((card, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="glass-card-premium p-8 rounded-[2rem] border-white/10 relative overflow-hidden group hover:shadow-2xl transition-all"
                                >
                                    <div className="grain-overlay opacity-[0.02]" />
                                    <div className={`w-14 h-14 bg-${card.color}-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                                        <card.icon className={`w-7 h-7 text-${card.color}-500`} />
                                    </div>
                                    <h3 className="font-black text-xl mb-3 text-slate-800 dark:text-white uppercase tracking-tight">{card.title}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                        {card.content}
                                    </p>
                                </motion.div>
                            ))}
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
                        <div className="glass-card-premium p-10 rounded-[2.5rem] border-white/10 relative overflow-hidden bg-gradient-to-br from-white/80 to-blue-50/50 dark:from-slate-900/80 dark:to-blue-900/20 shadow-2xl">
                            <div className="grain-overlay opacity-[0.03]" />
                            <div className="text-center max-w-lg mx-auto relative z-10">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 animate-bounce-slow">
                                    <Users size={32} />
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight">Étendez votre réseau</h3>
                                <p className="text-slate-500 dark:text-slate-400 mb-10 text-sm leading-relaxed">
                                    Partagez l'excellence NextMove. Vous gagnez <span className="text-blue-600 font-black">500 points</span> dès qu'un proche valide son premier colis.
                                </p>

                                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-white/10 shadow-inner max-w-sm mx-auto group">
                                    <code className="flex-1 text-center text-2xl font-black text-blue-600 dark:text-blue-400 tracking-[0.2em] py-2 px-4 select-all">
                                        {localCode || profile?.referral_code || "---"}
                                    </code>
                                    <button
                                        onClick={copyCode}
                                        className="p-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95"
                                        aria-label="Copier le code"
                                    >
                                        {copied ? <Check size={20} /> : <Copy size={20} />}
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                                    <a
                                        href={`https://wa.me/?text=${encodeURIComponent(`🚀 Tu veux économiser sur tes envois colis ? Rejoins NextMove Cargo avec mon code ${localCode || profile?.referral_code} et gagne des récompenses dès ton premier envoi ! \n\nInscris-toi ici : ${window.location.origin}/register?referral=${localCode || profile?.referral_code}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-[#25D366]/10 text-[#128C7E] rounded-2xl hover:bg-[#25D366]/20 transition-all border border-[#25D366]/20 group"
                                    >
                                        <div className="w-10 h-10 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <Send size={18} />
                                        </div>
                                        <span className="text-xs font-bold">WhatsApp</span>
                                    </a>

                                    <a
                                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}/register?referral=${localCode || profile?.referral_code}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-[#1877F2]/10 text-[#1877F2] rounded-2xl hover:bg-[#1877F2]/20 transition-all border border-[#1877F2]/20 group"
                                    >
                                        <div className="w-10 h-10 bg-[#1877F2] text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <Share2 size={18} />
                                        </div>
                                        <span className="text-xs font-bold">Facebook</span>
                                    </a>

                                    <a
                                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${window.location.origin}/register?referral=${localCode || profile?.referral_code}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-[#0077b5]/10 text-[#0077b5] rounded-2xl hover:bg-[#0077b5]/20 transition-all border border-[#0077b5]/20 group"
                                    >
                                        <div className="w-10 h-10 bg-[#0077b5] text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <Linkedin size={18} />
                                        </div>
                                        <span className="text-xs font-bold">LinkedIn</span>
                                    </a>

                                    <button
                                        onClick={shareReferral}
                                        className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all border border-slate-200 group"
                                    >
                                        <div className="w-10 h-10 bg-slate-600 text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            <Share2 size={18} />
                                        </div>
                                        <span className="text-xs font-bold">Autre</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                            {[
                                { label: "Total Filleuls", value: referralStats.total || 0, color: "slate" },
                                { label: "En Attente", value: referrals.filter(r => r.status === 'pending').length, color: "amber" },
                                { label: "Validés", value: referrals.filter(r => ['completed', 'rewarded'].includes(r.status)).length, color: "emerald" }
                            ].map((stat, i) => (
                                <div key={i} className="glass-card-premium p-6 rounded-[2rem] border-white/10 text-center relative overflow-hidden group">
                                    <div className="grain-overlay opacity-[0.02]" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{stat.label}</p>
                                    <p className={`text-4xl font-black text-${stat.color}-500 transition-transform group-hover:scale-110`}>{stat.value}</p>
                                </div>
                            ))}
                        </div>

                        <div className="glass-card-premium rounded-[2.5rem] border-white/10 overflow-hidden shadow-2xl">
                            <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <History size={14} className="text-blue-500" /> Mon Réseau Actif
                                </h3>
                            </div>
                            {referrals.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">
                                    Vous n'avez parrainé personne pour le moment.
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-slate-50/50 dark:bg-white/5 text-[10px] uppercase text-slate-400 font-black tracking-widest">
                                        <tr>
                                            <th className="px-8 py-5 text-left">Filleul</th>
                                            <th className="px-8 py-5 text-left">Date</th>
                                            <th className="px-8 py-5 text-left">Statut</th>
                                            <th className="px-8 py-5 text-right">Gains</th>
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
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card-premium rounded-[2.5rem] border-white/10 shadow-2xl overflow-hidden"
                    >
                        <div className="grain-overlay opacity-[0.02]" />
                        {history.length === 0 ? (
                            <div className="p-20 text-center text-slate-500 italic">
                                Aucun historique disponible. Expédiez votre premier colis pour gagner des points !
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50/50 dark:bg-white/5 text-[10px] uppercase text-slate-400 font-black tracking-widest">
                                        <tr>
                                            <th className="px-8 py-5 text-left">Type de Transaction</th>
                                            <th className="px-8 py-5 text-left">Date</th>
                                            <th className="px-8 py-5 text-right">Points</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                        {history.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
                                                <td className="px-8 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                                            {getReasonIcon(tx.reason)}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-800 dark:text-white uppercase text-[10px] tracking-widest">{getReasonLabel(tx.reason)}</p>
                                                            {tx.metadata?.recipient_email && (
                                                                <p className="text-[10px] text-slate-500 font-bold">Destinataire: {tx.metadata.recipient_email}</p>
                                                            )}
                                                            {tx.metadata?.sender_email && (
                                                                <p className="text-[10px] text-slate-500 font-bold">Expéditeur: {tx.metadata.sender_email}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase">
                                                    {new Date(tx.created_at).toLocaleDateString("fr-FR", {
                                                        day: 'numeric', month: 'long', year: 'numeric'
                                                    })}
                                                </td>
                                                <td className={`px-8 py-5 text-right font-black text-lg ${tx.amount > 0 ? "text-emerald-500" : "text-slate-400"}`}>
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
            <AnimatePresence>
                {isConvertModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="glass-card-premium rounded-[2.5rem] w-full max-w-md p-10 relative shadow-2xl border-white/20"
                        >
                            <div className="grain-overlay opacity-[0.03]" />
                            <button onClick={() => setIsConvertModalOpen(false)} aria-label="Fermer" className="absolute top-6 right-6 text-slate-400 hover:text-blue-500 transition-colors">
                                <X size={24} />
                            </button>
                            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-600">
                                <ArrowRightLeft size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight">Convertir mes points</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 italic">Solde de confiance: <span className="text-blue-600">{points} PTS</span></p>

                            <form onSubmit={handleConvert} className="space-y-6 relative z-10">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Points à échanger</label>
                                    <input
                                        type="number"
                                        value={convertAmount}
                                        onChange={(e) => setConvertAmount(e.target.value)}
                                        className="w-full px-6 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 rounded-2xl focus:border-blue-500 outline-none transition-all font-black text-lg"
                                        placeholder="Min. 100"
                                        max={points}
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="bg-blue-600/5 p-6 rounded-[1.5rem] border border-blue-500/20 flex justify-between items-center group">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valeur Crédit</span>
                                    <span className="text-2xl font-black text-blue-600 group-hover:scale-110 transition-transform">{(parseInt(convertAmount || "0") * pointValue).toLocaleString()} <span className="text-xs">FCFA</span></span>
                                </div>
                                <button disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 active:scale-95 uppercase tracking-widest text-xs">
                                    {loading ? "Traitement..." : "Finaliser la conversion"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Transfer Modal */}
            <AnimatePresence>
                {isTransferModalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="glass-card-premium rounded-[2.5rem] w-full max-w-md p-10 relative shadow-2xl border-white/20"
                        >
                            <div className="grain-overlay opacity-[0.03]" />
                            <button onClick={() => setIsTransferModalOpen(false)} aria-label="Fermer" className="absolute top-6 right-6 text-slate-400 hover:text-blue-500 transition-colors">
                                <X size={24} />
                            </button>
                            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 text-amber-600">
                                <Send size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-1 uppercase tracking-tight">Envoyer des points</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 italic">Partagez l'excellence avec vos proches.</p>

                            <form onSubmit={handleTransfer} className="space-y-6 relative z-10">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Email du bénéficiaire</label>
                                    <input
                                        type="email"
                                        value={transferEmail}
                                        onChange={(e) => setTransferEmail(e.target.value)}
                                        className="w-full px-6 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 rounded-2xl focus:border-blue-500 outline-none transition-all font-bold"
                                        placeholder="partenaire@exemple.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2 px-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Montant à transférer</label>
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Max: {points}</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={transferAmount}
                                        onChange={(e) => setTransferAmount(e.target.value)}
                                        className="w-full px-6 py-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-white/5 rounded-2xl focus:border-blue-500 outline-none transition-all font-black text-lg"
                                        placeholder="Ex: 500"
                                        max={points}
                                        min="1"
                                        required
                                    />
                                </div>
                                <button disabled={loading} className="w-full py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black rounded-2xl transition-all shadow-xl disabled:opacity-50 active:scale-95 uppercase tracking-widest text-xs">
                                    {loading ? "Envoi en cours..." : "Confirmer le transfert"}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
