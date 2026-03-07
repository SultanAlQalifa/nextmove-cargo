import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Award, Sparkles, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function FounderPackModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        checkSettings();
    }, []);

    const checkSettings = async () => {
        // User requested popup to show every visit, so we removed the localStorage check

        // if (dismissed) return;

        try {
            // Fetch settings from singleton table
            const { data } = await supabase
                .from('platform_settings')
                .select('*')
                .order('created_at', { ascending: false }) // Fallback if single_row constraint failed or to get latest
                .limit(1)
                .maybeSingle();

            if (data && data.show_founder_offer) {
                setSettings(data);
                // Delay appearance slightly (3 seconds) for UX
                setTimeout(() => setIsOpen(true), 3000);
            }
        } catch (err) {
            console.error("Error loading founder settings:", err);
        }
    };

    const handleDismiss = () => {
        setIsOpen(false);
        // Do not save dismissal to localStorage as per user request
        // localStorage.setItem('founder_pack_dismissed', 'true');
    };

    const handleCTA = () => {
        // Logic to open payment or register
        // For now, redirect to register or show toast
        window.location.href = '/register?plan=founder';
    };

    if (!isOpen || !settings) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={handleDismiss}
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg quantum-card rounded-[3rem] shadow-2xl overflow-hidden border border-white/5"
                    >
                        {/* Abstract Glows */}
                        <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 blur-[100px]" />
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/10 blur-[100px]" />

                        <button
                            onClick={handleDismiss}
                            aria-label="Fermer"
                            className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors z-10"
                        >
                            <X className="w-5 h-5 text-white/50" />
                        </button>

                        <div className="relative p-12 text-center space-y-8">
                            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl quantum-card mb-4 group overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Award className="w-10 h-10 text-amber-500 animate-pulse" />
                            </div>

                            <div className="space-y-4">
                                <h2 className="text-4xl font-black text-quantum-gradient tracking-tighter leading-none">
                                    {settings.founder_offer_title || "Founder Ascension"}
                                </h2>
                                <p className="text-lg text-slate-500 font-light max-w-xs mx-auto uppercase tracking-tighter">
                                    {settings.founder_offer_description || "Secure your legacy in the African digital frontier."}
                                </p>
                            </div>

                            <div className="quantum-card rounded-3xl p-8 border border-white/5 bg-white/5 relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-4">
                                    <Sparkles className="w-5 h-5 text-amber-500/30" />
                                </div>
                                <div className="flex items-baseline justify-center gap-2 mb-8">
                                    <span className="text-5xl font-black text-white tracking-tighter">
                                        {(settings.founder_offer_price || 5000).toLocaleString()}
                                    </span>
                                    <span className="text-sm font-black text-indigo-400 uppercase tracking-widest">FCFA</span>
                                </div>

                                <div className="space-y-4 text-left">
                                    {[
                                        "Founder Badge & Verified Identity",
                                        "Early-Access Intelligence Access",
                                        "Tactical Support Unit (VIP)"
                                    ].map((benefit, i) => (
                                        <div key={i} className="flex items-center gap-4 text-sm font-black uppercase tracking-tighter text-slate-400">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                                            {benefit}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleCTA}
                                className="w-full py-6 bg-indigo-600 text-white text-lg font-black rounded-2xl shadow-2xl shadow-indigo-500/20 hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                            >
                                Deploy Founder Access
                                <ArrowRight className="w-5 h-5" />
                            </button>

                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">
                                Strategic Limit: 100 Modules Remaining
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
