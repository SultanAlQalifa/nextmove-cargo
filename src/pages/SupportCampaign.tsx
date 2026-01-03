
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Copy, Check, ArrowRight, Star, Rocket, Shield, Globe, Wallet, Share2 } from "lucide-react";
import confetti from "canvas-confetti";
import { supabase } from "../lib/supabase";

// Modern Fintech Aesthetic Amounts
const AMOUNTS = [
    { value: 10000, label: "Supporter", icon: Heart, color: "bg-blue-100 text-blue-600", checkColor: "bg-blue-600" },
    { value: 25000, label: "Bienfaiteur", icon: Star, color: "bg-indigo-100 text-indigo-600", checkColor: "bg-indigo-600" },
    { value: 50000, label: "Fondateur", icon: Rocket, color: "bg-amber-100 text-amber-600", checkColor: "bg-amber-600" },
];

import PaymentModal from "../components/payment/PaymentModal";

export default function SupportCampaign() {
    const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
    const [isCustom, setIsCustom] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false); // <--- New State
    const [formData, setFormData] = useState({ message: "", contact: "" });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [copied, setCopied] = useState("");

    const handleCopy = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(""), 2000);
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("status") === "success") {
            setSubmitted(true);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAmount) return;

        setLoading(true);
        try {
            const { error } = await supabase.rpc('create_sales_lead', {
                p_query: `[SOUTIEN] Un supporter promet un don de ${selectedAmount} FCFA. Msg: ${formData.message}`,
                p_metadata: {
                    type: 'supporter_donation',
                    amount: selectedAmount,
                    contact: formData.contact,
                    supporter_name: "Supporter",
                    message: formData.message,
                    source: 'support_campaign'
                }
            });
            if (error) throw error;
            // Instead of finishing immediately, we show the payment modal
            setShowPaymentModal(true);
        } catch (err) {
            console.error("Error submitting support:", err);
            // Fallback: If DB fail, still show modal so they can pay? 
            // Better to show modal anyway to collect money.
            setShowPaymentModal(true);
        } finally {
            setLoading(false);
        }
    };

    // Trigger Confetti on Success
    useEffect(() => {
        if (submitted) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#F59E0B', '#3B82F6', '#8B5CF6']
            });

            // Second burst for more impact
            setTimeout(() => {
                confetti({
                    particleCount: 100,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#F59E0B', '#3B82F6']
                });
                confetti({
                    particleCount: 100,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#F59E0B', '#8B5CF6']
                });
            }, 500);
        }
    }, [submitted]);

    if (submitted) {
        return (
            <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-slate-900">

                {/* Immersive Background */}
                <div className="absolute inset-0">
                    <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px] animate-pulse delay-1000"></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.8, type: "spring" }}
                    className="relative w-full max-w-lg bg-white/10 backdrop-blur-2xl border border-white/20 p-8 md:p-12 rounded-[2.5rem] text-center shadow-2xl shadow-black/50 overflow-hidden"
                >
                    {/* Glossy Reflection Effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

                    {/* Animated Icon */}
                    <div className="relative mb-8 inline-block">
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                            className="w-24 h-24 bg-gradient-to-tr from-amber-300 to-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/30 text-5xl"
                        >
                            🏆
                        </motion.div>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 }}
                            className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full border-4 border-slate-900 shadow-lg"
                        >
                            <Check className="w-5 h-5" />
                        </motion.div>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 mb-6 drop-shadow-sm leading-tight">
                        Merci du fond <br /> du cœur !
                    </h2>

                    <p className="text-blue-100 text-lg mb-8 leading-relaxed font-medium">
                        Votre soutien est une force incroyable.<br />
                        Vous faites officiellement partie des <span className="text-white font-bold text-xl block mt-1">Pionniers de NextMove 🚀</span>
                    </p>

                    {/* Payment Recap Card */}
                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-white/10 mb-8 backdrop-blur-md">
                        <div className="flex justify-between items-center text-sm text-slate-400 mb-2 uppercase tracking-wider font-bold">
                            <span>Contribution</span>
                            <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-green-400" /> Sécurisé</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                            <span className="text-white font-medium">Montant versé</span>
                            <span className="text-2xl font-bold text-emerald-400">{selectedAmount?.toLocaleString() || "Don"} FCFA</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-4 relative z-10">
                        <button
                            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent("Je viens de soutenir le lancement de NextMove Cargo ! Rejoins le mouvement ici : https://nextmovecargo.com/soutien 🚀")}`, '_blank')}
                            className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
                        >
                            <Share2 className="w-5 h-5" />
                            Partager ma fierté
                        </button>

                        <button
                            onClick={() => window.location.href = '/dashboard/client'}
                            className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold border border-white/10 transition-all flex items-center justify-center gap-3 backdrop-blur-md"
                        >
                            Aller au Tableau de Bord
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 overflow-x-hidden">

            {/* Premium Animated Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 -left-20 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-0 -right-20 w-[600px] h-[600px] bg-indigo-100/50 rounded-full blur-[120px] animate-pulse delay-1000"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-30 mix-blend-soft-light"></div>
            </div>

            <div className="relative max-w-6xl mx-auto px-6 py-12 lg:py-20 grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">

                {/* Left Column: The Story / Pitch */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="sticky top-20"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider mb-8 border border-blue-100">
                        <Rocket className="w-4 h-4" /> Campagne de Lancement
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-black tracking-tight mb-6 leading-[1.1] text-slate-900">
                        Soutenez une <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Vision Audacieuse.</span>
                    </h1>

                    <p className="text-lg text-slate-600 mb-8 leading-relaxed max-w-lg">
                        NextMove n'est pas qu'une simple application, c'est une révolution pour la logistique en Afrique.
                        Votre contribution participe directement à cet envol technologique.
                    </p>

                    <div className="flex flex-wrap items-center gap-6 text-slate-500 font-semibold mb-12">
                        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                                <Check className="w-5 h-5" />
                            </div>
                            <span className="text-sm">Impact Direct</span>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl shadow-sm border border-slate-100">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 shadow-inner">
                                <Globe className="w-5 h-5" />
                            </div>
                            <span className="text-sm">100% Sénégalais</span>
                        </div>
                    </div>

                    {/* Live Progress Bar (High Reward Visual) */}
                    <div className="mb-12 max-w-lg bg-white p-6 rounded-[2rem] shadow-xl shadow-blue-900/5 border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Rocket className="w-20 h-20" />
                        </div>
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Objectif Lancement</p>
                                <h4 className="text-2xl font-black text-slate-900">7 250 000 <span className="text-sm text-slate-400 font-bold">XOF</span></h4>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-black text-blue-600">68%</p>
                            </div>
                        </div>
                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden p-1 border border-slate-200/50">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "68%" }}
                                transition={{ duration: 2, ease: "easeOut" }}
                                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 rounded-full shadow-lg relative"
                            >
                                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]"></div>
                            </motion.div>
                        </div>
                        <p className="mt-4 text-xs font-medium text-slate-500 flex items-center gap-2">
                            <Star className="w-3 h-3 text-amber-500 fill-current" />
                            Déjà <span className="text-slate-900 font-bold">142 supporters</span> ont rejoint l'aventure !
                        </p>
                    </div>

                    {/* International Transfer Highlight - Desktop Position */}
                    <div className="hidden lg:block mt-8">
                        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl shadow-2xl shadow-blue-500/40 text-white transform hover:scale-105 transition-all duration-300 border-4 border-blue-400/30 ring-4 ring-blue-500/20">
                            <div className="absolute -top-10 -right-10 p-4 opacity-10 animate-spin-slow">
                                <Globe className="w-40 h-40" />
                            </div>
                            <div className="relative z-10">
                                <div className="inline-block px-3 py-1 bg-amber-400 text-amber-900 rounded-full text-xs font-black uppercase tracking-widest mb-4 animate-pulse">Important</div>
                                <h3 className="text-2xl font-black mb-3 flex items-center gap-2">
                                    🌍 Depuis l'étranger ?
                                </h3>
                                <p className="text-blue-50 text-base mb-6 leading-relaxed font-medium">
                                    Utilisez <span className="text-amber-300 font-bold">Sendwave, TapTap Send</span> ou autre service de transfert rapide.
                                </p>
                                <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/30 shadow-inner">
                                    <p className="text-xs text-blue-200 uppercase tracking-widest mb-1 font-bold">Envoyer vers Wave au :</p>
                                    <p className="font-mono text-3xl font-black tracking-widest text-white drop-shadow-md">+221 77 658 17 41</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Column: The Action Card */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="relative"
                >
                    <div className="absolute -inset-1 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-[2rem] opacity-20 blur-xl"></div>
                    <div className="bg-white rounded-[2rem] shadow-2xl shadow-blue-900/10 p-6 lg:p-8 border border-slate-100 relative">

                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center justify-between">
                            Faire un don
                            <Heart className="w-5 h-5 text-red-500 fill-current animate-pulse" />
                        </h3>

                        {/* Mascot Reaction Area */}
                        <div className="mb-6 min-h-[80px] flex items-center justify-center text-center">
                            <AnimatePresence mode="wait">
                                {selectedAmount === null ? (
                                    <motion.div
                                        key="default"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className="text-slate-500"
                                    >
                                        <div className="text-4xl mb-2">👋</div>
                                        <p className="text-sm font-medium">Choisissez votre niveau de soutien !</p>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="reaction"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="text-slate-800"
                                    >
                                        <div className="text-5xl mb-2 animate-bounce">
                                            {selectedAmount < 25000 && "💙"}
                                            {selectedAmount >= 25000 && selectedAmount < 50000 && "🌟"}
                                            {selectedAmount >= 50000 && "👑"}
                                        </div>
                                        <p className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                                            {selectedAmount < 10000 && "Chaque geste compte. Merci !"}
                                            {selectedAmount >= 10000 && selectedAmount < 25000 && "Merci pour ce geste !"}
                                            {selectedAmount >= 25000 && selectedAmount < 50000 && "Wow ! Superbe contribution !"}
                                            {selectedAmount >= 50000 && "Incroyable ! Vous êtes un Fondateur !"}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Amount Selector */}
                            <div className="space-y-3">
                                {AMOUNTS.map((amt) => {
                                    const Icon = amt.icon;
                                    const isSelected = selectedAmount === amt.value;
                                    return (
                                        <motion.button
                                            key={amt.value}
                                            type="button"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => { setSelectedAmount(amt.value); setIsCustom(false); }}
                                            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 ${isSelected && !isCustom
                                                ? `border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-200`
                                                : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 rounded-lg ${amt.color} ${isSelected && !isCustom ? 'scale-110' : ''} transition-transform`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <div className="font-bold text-slate-800 text-lg">{amt.value.toLocaleString()} FCFA</div>
                                                    <div className="text-xs font-medium text-slate-500">{amt.label} (Don)</div>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected && !isCustom ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>
                                                {isSelected && !isCustom && <Check className="w-3.5 h-3.5" />}
                                            </div>
                                        </motion.button>
                                    );
                                })}

                                {/* Custom Amount Button */}
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    className={`relative overflow-hidden w-full rounded-xl border-2 transition-all duration-200 ${isCustom
                                        ? `border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-200`
                                        : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                                        }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => { setIsCustom(true); setSelectedAmount(null); }}
                                        className="w-full flex items-center justify-between p-4"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-lg bg-slate-100 text-slate-600`}>
                                                <Wallet className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <div className="font-bold text-slate-800 text-lg">Autre Montant</div>
                                                <div className="text-xs font-medium text-slate-500">Montant libre</div>
                                            </div>
                                        </div>
                                    </button>

                                    {/* Custom Input */}
                                    <AnimatePresence>
                                        {isCustom && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="px-4 pb-4"
                                            >
                                                <input
                                                    type="number"
                                                    placeholder="Entrez le montant (FCFA)"
                                                    value={selectedAmount || ''}
                                                    onChange={(e) => setSelectedAmount(parseInt(e.target.value) || 0)}
                                                    className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold text-center text-slate-800"
                                                    autoFocus
                                                />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            </div>

                            {/* International Transfer Info - Mobile Position (HIGH VISIBILITY) */}
                            <div className="lg:hidden block mt-6 relative z-10">
                                <div className="absolute inset-0 bg-blue-500 rounded-2xl blur opacity-20 animate-pulse"></div>
                                <div className="relative bg-gradient-to-r from-blue-700 to-indigo-700 p-5 rounded-2xl text-white shadow-xl border border-blue-400/50">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                                            <Globe className="w-6 h-6 text-amber-300" />
                                        </div>
                                        <div>
                                            <p className="font-black text-lg leading-tight uppercase tracking-wide">Depuis l'étranger ?</p>
                                            <p className="text-xs text-blue-100 font-medium mt-0.5">Sendwave, TapTap Send...</p>
                                        </div>
                                    </div>
                                    <div className="bg-black/30 rounded-xl px-4 py-3 font-mono font-black text-center text-2xl tracking-widest text-amber-300 border border-white/10 shadow-inner">
                                        77 658 17 41
                                    </div>
                                    <p className="text-center text-[10px] uppercase tracking-widest font-bold text-blue-300 mt-2">Envoyer vers Wave</p>
                                </div>
                            </div>

                            {/* Payment Info & Form */}
                            <AnimatePresence>
                                {selectedAmount && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden space-y-6 pt-4"
                                    >
                                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-slate-400 uppercase">Numéro Local (Wave/OM)</span>
                                                <div className="flex gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse delay-75"></div>
                                                </div>
                                            </div>
                                            <div
                                                className="flex items-center justify-between cursor-pointer hover:bg-white transition-colors p-2 rounded-lg"
                                                onClick={() => handleCopy("776581741", "phone")}
                                            >
                                                <span className="font-mono text-3xl font-bold text-slate-800 tracking-tight group-hover:scale-105 transition-transform origin-left">77 658 17 41</span>
                                                <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-100 text-slate-400 group-hover:text-blue-600 group-hover:border-blue-200 transition-all">
                                                    {copied === "phone" ? <Check className="w-5 h-5 text-green-500 scale-125 transition-transform" /> : <Copy className="w-5 h-5" />}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4">
                                                <input
                                                    type="tel"
                                                    placeholder="Votre Numéro (Optionnel)"
                                                    value={formData.contact}
                                                    onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                                                />
                                            </div>
                                            <textarea
                                                rows={2}
                                                placeholder="Un petit mot ? (facultatif)"
                                                value={formData.message}
                                                onChange={e => setFormData({ ...formData, message: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium resize-none"
                                            />
                                        </div>

                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="submit"
                                            disabled={loading || !selectedAmount}
                                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                                        >
                                            {loading ? "Envoi en cours..." : (
                                                <>
                                                    Valider mon don <ArrowRight className="w-5 h-5" />
                                                </>
                                            )}
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </form>
                    </div>
                    <div className="mt-8 grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/50 rounded-2xl border border-slate-100 text-center">
                            <Shield className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sécure</p>
                        </div>
                        <div className="p-4 bg-white/50 rounded-2xl border border-slate-100 text-center">
                            <Star className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Premium</p>
                        </div>
                    </div>
                </motion.div>

            </div>

            {/* Why Support Section (Horizontal Flow) */}
            <div className="relative max-w-6xl mx-auto px-6 pb-20">
                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { title: "Indépendance", desc: "Soutenir un projet 100% autonome et technologique.", emoji: "🇸🇳" },
                        { title: "Transformation", desc: "Digitaliser le transport pour réduire les coûts et délais.", emoji: "⚡" },
                        { title: "Emplois", desc: "Créer des opportunités pour la jeunesse locale.", emoji: "👨‍💻" }
                    ].map((item, i) => (
                        <div key={i} className="bg-white/40 backdrop-blur-sm p-8 rounded-3xl border border-white/60 hover:border-blue-200 transition-colors">
                            <div className="text-3xl mb-4">{item.emoji}</div>
                            <h4 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h4>
                            <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payment Modal for Real Transactions */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={() => {
                    setShowPaymentModal(false);
                    setSubmitted(true);
                }}
                planName="Soutien NextMove"
                amount={selectedAmount || 0}
                currency="XOF"
                allowedMethods={["wave", "paytech", "cinetpay"]}
                showCoupons={false}
                showVAT={false}
                returnUrl={window.location.origin + window.location.pathname}
            />
        </div>
    );
}
