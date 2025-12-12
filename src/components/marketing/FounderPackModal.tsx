import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Award, Check, Sparkles, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function FounderPackModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        checkSettings();
    }, []);

    const checkSettings = async () => {
        // Check local storage for dismissal
        const dismissed = localStorage.getItem('founder_pack_dismissed');
        const searchParams = new URLSearchParams(window.location.search);
        const forceShow = searchParams.get('test_popup') === 'true';

        if (dismissed && !forceShow) return;

        try {
            // Fetch settings from singleton table
            const { data, error } = await supabase
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
        localStorage.setItem('founder_pack_dismissed', 'true');
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
                        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-amber-500/20"
                    >
                        {/* Glossy Header Effect - Reduced height */}
                        <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 opacity-10" />
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-300 via-yellow-400 to-orange-500" />

                        <button
                            onClick={handleDismiss}
                            aria-label="Fermer"
                            className="absolute top-3 right-3 p-2 bg-white/50 dark:bg-black/20 hover:bg-white/80 rounded-full transition-colors z-10"
                        >
                            <X className="w-5 h-5 text-slate-500" />
                        </button>

                        <div className="relative p-5 md:p-8 text-center space-y-4 md:space-y-6">

                            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 mb-2 ring-8 ring-amber-50 dark:ring-amber-900/10">
                                <Award className="w-8 h-8 md:w-10 md:h-10 text-amber-600 dark:text-amber-400" />
                            </div>

                            <div className="space-y-2">
                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                                    {settings.founder_offer_title || "Devenez Membre Fondateur"}
                                </h2>
                                <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                                    {settings.founder_offer_description || "Soutenez le développement de NextMove Cargo et bénéficiez d'avantages exclusifs à vie."}
                                </p>
                            </div>

                            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 md:p-6 border border-amber-100 dark:border-amber-800/50">
                                <div className="flex items-baseline justify-center gap-1 mb-3 md:mb-4">
                                    <span className="text-3xl md:text-4xl font-bold text-amber-600 dark:text-amber-400">
                                        {(settings.founder_offer_price || 5000).toLocaleString()} FCFA
                                    </span>
                                    <span className="text-xs md:text-sm text-amber-600/60 dark:text-amber-400/60 font-medium">/ unique</span>
                                </div>

                                <ul className="space-y-2 md:space-y-3 text-left max-w-xs mx-auto">
                                    <li className="flex items-center gap-2 md:gap-3 text-sm text-slate-700 dark:text-slate-200">
                                        <div className="p-1 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Badge "Membre Fondateur" sur votre profil</span>
                                    </li>
                                    <li className="flex items-center gap-2 md:gap-3 text-sm text-slate-700 dark:text-slate-200">
                                        <div className="p-1 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Accès prioritaire aux nouvelles fonctionnalités</span>
                                    </li>
                                    <li className="flex items-center gap-2 md:gap-3 text-sm text-slate-700 dark:text-slate-200">
                                        <div className="p-1 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300">
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span>Support client dédié VIP</span>
                                    </li>
                                </ul>
                            </div>

                            <button
                                onClick={handleCTA}
                                className="group relative w-full inline-flex items-center justify-center gap-2 px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-white dark:to-slate-200 text-white dark:text-slate-900 rounded-xl font-bold text-base md:text-lg shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                            >
                                <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-amber-400 group-hover:animate-pulse" />
                                <span>Profiter de l'offre maintenant</span>
                                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                            </button>

                            <p className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500">
                                Offre limitée aux 100 premiers membres. Paiement sécurisé par Wave/OM.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
