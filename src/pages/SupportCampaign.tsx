
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Copy, Check, ArrowRight, Star, Rocket, Shield, Globe, Wallet } from "lucide-react";
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

    if (submitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-10 rounded-3xl max-w-md w-full shadow-xl border border-slate-100"
                >
                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Heart className="w-10 h-10 text-emerald-500 fill-current" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 mb-4">Merci du fond du cœur !</h2>
                    <p className="text-slate-500 mb-8 leading-relaxed">
                        Votre soutien est la première brique de notre succès. <br />
                        L'équipe NextMove vous remercie.
                    </p>

                    <div className="p-6 bg-slate-50 rounded-2xl mb-8 border border-slate-100 text-left">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Compte de dépôt</p>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 font-medium">Wave / OM</span>
                            <span className="font-mono font-bold text-slate-800 text-xl">77 658 17 41</span>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-400">
                            <Shield className="w-4 h-4 text-emerald-500" />
                            Validation manuelle sécurisée.
                        </div>
                    </div>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
                    >
                        Fermer
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-100 overflow-x-hidden">

            {/* Subtle Pattern Background */}
            <div className="fixed inset-0 pointer-events-none opacity-40 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] bg-[length:32px_32px]">
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

                    <div className="flex items-center gap-8 text-slate-500 font-medium mb-12">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <Check className="w-4 h-4" />
                            </div>
                            Impact Réel
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                <Globe className="w-4 h-4" />
                            </div>
                            Innovation
                        </div>
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
                    <p className="mt-6 text-center text-xs text-slate-400 max-w-md mx-auto text-balance leading-relaxed">
                        Ceci est une campagne de soutien (don) pour le lancement du projet. Merci de faire partie de nos premiers supporters !
                    </p>
                </motion.div>

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
