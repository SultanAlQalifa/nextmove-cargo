import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Send, MessageCircle, Minimize2, Maximize2, Zap, ShieldCheck, Image as ImageIcon, Paperclip } from "lucide-react";
import { aiService, AIMessage } from "../../services/aiService";
import { useNavigate } from "react-router-dom";
import { useFeature } from "../../contexts/FeatureFlagContext";

export default function AIChatBubble() {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<AIMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [attachedImage, setAttachedImage] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isOCRActive = useFeature('ai_smart_scan');

    // Initialize with welcome message
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([aiService.getWelcomeMessage()]);
        }
    }, []);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() && !attachedImage || loading) return;

        const userMsg: AIMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: input || (attachedImage ? "Analyse de document..." : ""),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        const currentImage = attachedImage;
        setInput("");
        setAttachedImage(null);
        setLoading(true);

        // Only send image if feature is active
        const imagePayload = isOCRActive ? currentImage : undefined;

        try {
            const response = await aiService.sendMessage(input, undefined, imagePayload || undefined);
            setMessages(prev => [...prev, response]);

            // If the response suggests pre-filling RFQ, we could add a special button/action
            // For now, let's just make sure the user knows it's possible.
        } catch (error) {
            console.error("AI Error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            y: 0,
                            height: isMinimized ? '60px' : '500px'
                        }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className={`w-[380px] bg-white/80 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col transition-all duration-300 ${isMinimized ? 'w-[200px]' : ''}`}
                    >
                        {/* Header */}
                        <div className="p-4 bg-gradient-to-r from-primary to-primary-700 text-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                    <Bot className="w-6 h-6" />
                                </div>
                                {!isMinimized && (
                                    <div>
                                        <h3 className="font-bold text-sm tracking-tight">Assistant IA</h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                            <span className="text-[10px] font-medium opacity-80 uppercase tracking-widest">En ligne</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsMinimized(!isMinimized)}
                                    title={isMinimized ? "Agrandir" : "Réduire"}
                                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    title="Fermer"
                                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Chat Body */}
                        {!isMinimized && (
                            <>
                                <div
                                    ref={scrollRef}
                                    className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-transparent to-primary/5 h-[360px]"
                                >
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                                ? 'bg-primary text-white rounded-tr-none shadow-md'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none shadow-sm'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex gap-1">
                                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-75" />
                                                <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-150" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Info */}
                                <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                                        <Zap className="w-3 h-3 text-amber-500 fill-current" />
                                        Powered by NextMove IA
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                                        Sécurisé
                                    </div>
                                </div>

                                {/* Input Area */}
                                <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
                                    {attachedImage && (
                                        <div className="mb-3 relative inline-block">
                                            <img src={attachedImage} alt="Preview" className="w-20 h-20 object-cover rounded-xl border-2 border-primary/20 shadow-sm" />
                                            <button
                                                type="button"
                                                onClick={() => setAttachedImage(null)}
                                                title="Supprimer l'image"
                                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            accept="image/*"
                                            title="Joindre un document"
                                            className="hidden"
                                        />
                                        {isOCRActive && (
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                title="Joindre une photo (OCR)"
                                                className="p-2.5 bg-gray-50 text-gray-500 rounded-xl hover:bg-gray-100 transition-all"
                                            >
                                                <Paperclip className="w-5 h-5" />
                                            </button>
                                        )}
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            placeholder="Posez votre question..."
                                            className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                        />
                                        <button
                                            type="submit"
                                            disabled={loading || (!input.trim() && !attachedImage)}
                                            title="Envoyer le message"
                                            className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary-600 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </div>
                                </form>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                title={isOpen ? "Fermer le chat" : "Discuter avec l'IA"}
                className="mt-4 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center pointer-events-auto relative group overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary-700 to-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                {isOpen ? <X className="relative z-10 w-7 h-7" /> : <MessageCircle className="relative z-10 w-8 h-8" />}

                {/* Glow effect */}
                <div className="absolute inset-0 -z-10 bg-primary/40 blur-xl scale-110 opacity-50" />
            </motion.button>
        </div >
    );
}
