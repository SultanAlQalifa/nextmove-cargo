import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, MessageSquare, Bot, Zap } from "lucide-react";
import { useBranding } from "../../contexts/BrandingContext";
import AIChatBubble from "./AIChatBubble";

export default function FloatingActions() {
    const [isOpen, setIsOpen] = useState(false);
    const [isAiOpen, setIsAiOpen] = useState(false);
    const { settings } = useBranding();

    const phoneNumber = settings?.social_media?.whatsapp_number || "221776581741";
    const platformName = settings?.platform_name || "NextMove Cargo";

    const message = encodeURIComponent(
        `Bonjour, j'aimerais avoir plus d'informations sur vos services ${platformName}.`,
    );

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4 pointer-events-none">
            {/* AI Chat Window integration */}
            <AIChatBubble externalOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="flex flex-col gap-3 mb-2 pointer-events-auto"
                    >
                        {/* AI Action */}
                        <motion.button
                            onClick={() => {
                                setIsAiOpen(true);
                                setIsOpen(false);
                            }}
                            whileHover={{ scale: 1.05, x: -5 }}
                            className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-4 py-3 rounded-2xl shadow-xl group transition-all"
                        >
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Assistant IA</span>
                            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <Bot className="w-5 h-5" />
                            </div>
                        </motion.button>

                        {/* WhatsApp Action */}
                        <motion.a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.05, x: -5 }}
                            className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 px-4 py-3 rounded-2xl shadow-xl group transition-all"
                        >
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">WhatsApp Support</span>
                                <span className="text-[10px] text-emerald-500 font-medium">Réponse rapide</span>
                            </div>
                            <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                                <MessageSquare className="w-5 h-5 fill-current" />
                            </div>
                        </motion.a>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="pointer-events-auto">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center relative group overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-primary-700 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                    {isOpen ? (
                        <X className="relative z-10 w-7 h-7" />
                    ) : (
                        <div className="relative z-10">
                            <MessageCircle className="w-8 h-8 group-hover:hidden" />
                            <Zap className="w-8 h-8 hidden group-hover:block text-yellow-300 fill-current animate-pulse" />
                        </div>
                    )}

                    {/* Glow effect */}
                    <div className="absolute inset-0 -z-10 bg-primary/40 blur-xl scale-110 opacity-50" />
                </motion.button>
            </div>
        </div>
    );
}
