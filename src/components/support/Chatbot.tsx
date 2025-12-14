import { useState, useRef, useEffect } from "react";
import {
    MessageCircle,
    X,
    Send,
    Bot,
    ChevronRight
} from "lucide-react";
import CreateTicketModal from "./CreateTicketModal";

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showTicketModal, setShowTicketModal] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial Welcome Message
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    id: 1,
                    type: "bot",
                    content: "Bonjour ! Je suis l'assistant virtuel NextMove. Comment puis-je vous aider aujourd'hui ? 👋",
                    options: ["Suivre un colis", "Tarifs", "Problème technique", "Facturation"]
                }
            ]);
        }
    }, [isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        // Add User Message
        const userMsg = { id: Date.now(), type: "user", content: text };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsTyping(true);

        // Simulate AI Delay
        setTimeout(() => {
            const response = generateAIResponse(text);
            setMessages(prev => [...prev, response]);
            setIsTyping(false);
        }, 1200);
    };

    const generateAIResponse = (input: string) => {
        const lower = input.toLowerCase();

        // Knowledge Base (Hardcoded for now, could be dynamic)
        if (lower.includes("suivre") || lower.includes("colis") || lower.includes("tracking") || lower.includes("où est")) {
            return {
                id: Date.now() + 1,
                type: "bot",
                content: "Pour suivre votre colis, rendez-vous dans la section 'Mes Expéditions'. Cliquez sur la référence d'un envoi pour voir son statut détaillé en temps réel.",
                action: { label: "Voir mes expéditions", link: "/dashboard/shipments" }
            };
        }

        if (lower.includes("tarif") || lower.includes("prix") || lower.includes("coût") || lower.includes("combien")) {
            return {
                id: Date.now() + 1,
                type: "bot",
                content: "Nos tarifs sont calculés dynamiquement selon le poids, le volume et la destination. Vous devriez utiliser notre calculateur pour une estimation précise.",
                action: { label: "Ouvrir le calculateur", link: "/calculator" }
            };
        }

        if (lower.includes("facture") || lower.includes("payer") || lower.includes("paiement")) {
            return {
                id: Date.now() + 1,
                type: "bot",
                content: "Vos factures sont accessibles dans l'historique des transactions. Pour un problème de paiement spécifique, je peux vous mettre en relation avec le support.",
                options: ["Contacter le support", "Voir mes factures"]
            };
        }

        if (lower.includes("humain") || lower.includes("agent") || lower.includes("support") || lower.includes("problème")) {
            return {
                id: Date.now() + 1,
                type: "bot",
                content: "Je comprends. Si je n'ai pas pu vous aider, vous pouvez ouvrir un ticket pour parler à un agent spécialisé.",
                action: { label: "Ouvrir un ticket", onClick: () => setShowTicketModal(true) }
            };
        }

        // Default Fallback
        return {
            id: Date.now() + 1,
            type: "bot",
            content: "Je ne suis pas sûr de comprendre. Pouvez-vous reformuler ? Ou souhaitez-vous contacter notre équipe ?",
            options: ["Contacter le support", "Suivre un colis", "Tarifs"]
        };
    };

    const handleOptionClick = (option: string) => {
        if (option === "Contacter le support") {
            setShowTicketModal(true);
        } else {
            handleSend(option);
        }
    };

    return (
        <>
            {/* Floating Trigger Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    aria-label="Ouvrir le chat"
                    className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center z-50 animate-bounce-subtle"
                >
                    <MessageCircle className="w-7 h-7" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className={`fixed bottom-6 right-6 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col transition-all duration-300 ${isMinimized ? 'h-16' : 'h-[500px]'}`}>

                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-primary rounded-t-2xl text-white">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="p-1.5 bg-white/20 rounded-full">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-primary rounded-full"></span>
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm">Assistant NextMove</h3>
                                <p className="text-xs text-white/80">Toujours là pour vous</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsMinimized(!isMinimized)}
                                aria-label={isMinimized ? "Agrandir" : "Minimiser"}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <div className="w-4 h-0.5 bg-white rounded-full"></div>
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                title="Fermer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.type === 'user'
                                            ? 'bg-primary text-white rounded-br-none shadow-md shadow-primary/20'
                                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                                            }`}>
                                            <p>{msg.content}</p>

                                            {/* Action Link/Button */}
                                            {msg.action && (
                                                <div className="mt-3 pt-3 border-t border-white/20">
                                                    {msg.action.link ? (
                                                        <a href={msg.action.link} className="flex items-center gap-2 text-xs font-semibold hover:underline">
                                                            {msg.action.label} <ChevronRight className="w-3 h-3" />
                                                        </a>
                                                    ) : (
                                                        <button onClick={msg.action.onClick} className="flex items-center gap-2 text-xs font-semibold hover:underline">
                                                            {msg.action.label} <ChevronRight className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Quick Options */}
                                            {msg.options && (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {msg.options.map((opt: string) => (
                                                        <button
                                                            key={opt}
                                                            onClick={() => handleOptionClick(opt)}
                                                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 rounded-lg transition-colors"
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {isTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-3 bg-white border-t border-gray-100">
                                <form
                                    onSubmit={(e) => { e.preventDefault(); handleSend(inputValue); }}
                                    className="flex items-center gap-2"
                                >
                                    <input
                                        type="text"
                                        placeholder="Écrivez votre message..."
                                        className="flex-1 px-4 py-2.5 bg-gray-100 border-0 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        aria-label="Envoyer le message"
                                        disabled={!inputValue.trim()}
                                        className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary/20"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                                <p className="text-[10px] text-center text-gray-400 mt-2">
                                    L'IA peut commettre des erreurs. En cas d'urgence, contactez le support.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Embedded Ticket Modal */}
            <CreateTicketModal
                isOpen={showTicketModal}
                onClose={() => setShowTicketModal(false)}
                onSuccess={() => {
                    setShowTicketModal(false);
                    setMessages(prev => [...prev, {
                        id: Date.now(),
                        type: 'bot',
                        content: "Votre ticket a bien été créé ! Notre équipe reviendra vers vous très vite. ✅"
                    }]);
                }}
            />
        </>
    );
}
