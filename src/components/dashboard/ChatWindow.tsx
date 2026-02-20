import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { chatService, ChatMessage } from "../../services/chatService";
import { Send, MoreVertical, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatWindowProps {
  chatId: string;
  recipientName: string;
  onClose: () => void;
}

export default function ChatWindow({
  chatId,
  recipientName,
  onClose,
}: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const subscription = chatService.subscribeToMessages(chatId, (payload) => {
      setMessages((prev) => [...prev, payload.new]);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await chatService.getMessages(chatId);
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      await chatService.sendMessage(chatId, user.id, newMessage);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
        className="fixed bottom-6 right-6 w-80 sm:w-96 glass-card-premium bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] border-white/20 dark:border-white/10 shadow-2xl flex flex-col h-[500px] max-h-[80vh] z-50 overflow-hidden"
      >
        <div className="grain-overlay opacity-[0.03]" />

        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm flex justify-between items-center relative z-10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 p-[2px] shadow-md">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 uppercase text-sm">
                  {recipientName.charAt(0)}
                </div>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
            </div>
            <div>
              <span className="font-black text-slate-900 dark:text-white tracking-tight block leading-none">{recipientName}</span>
              <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">En ligne</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button title="Appeler" className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
              <Phone className="w-4 h-4" />
            </button>
            <button title="Plus d'options" className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
              <MoreVertical className="w-4 h-4" />
            </button>
            <button
              title="Fermer le chat"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors ml-1"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Messages Auto-Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/30 relative z-10 hide-scrollbar scroll-smooth">
          {messages.map((msg, idx) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm shadow-sm relative group ${isMe
                    ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-sm"
                    : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-white/5 rounded-bl-sm"
                    }`}
                >
                  {msg.content}
                  <span className={`block text-[9px] mt-1 font-medium select-none ${isMe ? 'text-blue-100 text-right' : 'text-slate-400 text-left'}`}>
                    {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSend}
          className="p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-white/5 flex gap-2 relative z-10"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Écrivez un message..."
            className="flex-1 bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
          />
          <button
            type="submit"
            title="Envoyer"
            disabled={!newMessage.trim()}
            className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-sm shadow-blue-500/30"
          >
            <Send size={18} className="ml-1" />
          </button>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
