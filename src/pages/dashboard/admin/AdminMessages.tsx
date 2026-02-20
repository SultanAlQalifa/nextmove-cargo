import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
  MessageSquare,
  Search,
  Send,
  User,
  Mail,
  Clock,
  Check,
  CheckCheck,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { messageService, Message } from "../../../services/messageService";
import { useToast } from "../../../contexts/ToastContext";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminMessages() {
  const { success } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMessages();
    }
  }, [user]);

  const loadMessages = async () => {
    if (!user) return;
    try {
      const data = await messageService.getMessages(user.id);
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedMessage || !replyContent.trim()) return;

    try {
      await messageService.sendMessage({
        sender_id: user.id,
        receiver_id:
          selectedMessage.sender_id === user.id
            ? (selectedMessage as any).receiver_id
            : selectedMessage.sender_id,
        subject: `Re: ${(selectedMessage as any).subject || "Message"}`,
        content: replyContent,
        sender_email: user.email,
        receiver_email:
          selectedMessage.sender_id === user.id
            ? (selectedMessage as any).receiver_email
            : selectedMessage.sender?.email,
      } as any); // Casting to any because sendMessage signature in service is different (takes conversationId, content)
      setReplyContent("");
      loadMessages();
      success("Réponse envoyée !");
    } catch (error) {
      console.error("Error sending reply:", error);
    }
  };

  const filteredMessages = messages.filter(
    (m) =>
      ((m as any).subject || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (m.sender?.full_name || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (m.sender?.email || "").toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col relative z-10 w-full max-w-7xl mx-auto space-y-6 pb-6">
      <div className="grain-overlay opacity-[0.02] pointer-events-none" />
      <PageHeader
        title="Messagerie Interne"
        subtitle="Consultez et répondez aux messages des utilisateurs"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 glass-card-premium rounded-[2rem] border-white/20 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/60 dark:bg-slate-900/40 backdrop-blur-2xl overflow-hidden flex"
      >
        {/* Sidebar List */}
        <div className="w-80 border-r border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md flex flex-col relative z-10">
          <div className="p-5 border-b border-slate-200/50 dark:border-white/5 relative">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-4">Boîte de réception</h2>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all shadow-inner"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar">
            {loading ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-3"></div>
                <span className="text-xs uppercase tracking-widest font-bold">Chargement...</span>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500 dark:text-slate-400 text-sm mt-10">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2 opacity-50" />
                <span className="font-semibold tracking-wide">Aucune message</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100/50 dark:divide-white/5">
                {filteredMessages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => setSelectedMessage(msg)}
                    className={`w-full p-4 text-left transition-all relative overflow-hidden group ${selectedMessage?.id === msg.id
                        ? "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                      }`}
                  >
                    {selectedMessage?.id === msg.id && (
                      <motion.div
                        layoutId="activeMessageIndicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"
                      />
                    )}
                    <div className="flex justify-between items-start mb-1.5 gap-2">
                      <span
                        className={`text-sm truncate ${!msg.is_read && msg.sender_id !== user?.id ? "text-slate-900 dark:text-white font-black" : "text-slate-700 dark:text-slate-300 font-bold"}`}
                      >
                        {msg.sender?.full_name ||
                          msg.sender?.email ||
                          "Utilisateur"}
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 whitespace-nowrap mt-0.5">
                        {new Date(msg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p
                      className={`text-sm mb-1 truncate ${!msg.is_read && msg.sender_id !== user?.id ? "text-blue-600 dark:text-blue-400 font-bold" : "text-slate-600 dark:text-slate-400 font-medium"}`}
                    >
                      {(msg as any).subject || "Nouveau message"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500/80 truncate font-medium">
                      {msg.content}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Detail & Reply Area */}
        <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-900/20 relative z-10">
          {selectedMessage ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedMessage.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full"
              >
                {/* Message Header */}
                <div className="p-6 border-b border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {(selectedMessage as any).subject || "Message sans objet"}
                    </h2>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5 bg-white/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-white/5">
                      <Clock className="w-3 h-3" />
                      {new Date(selectedMessage.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-blue-500 to-sky-400 p-[2px] shadow-sm">
                      <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center font-black text-blue-600 dark:text-blue-400 text-lg">
                        {(selectedMessage.sender?.full_name ||
                          selectedMessage.sender?.email ||
                          "?")[0].toUpperCase()}
                      </div>
                    </div>
                    <div>
                      <p className="font-black text-slate-900 dark:text-white text-lg leading-tight">
                        {selectedMessage.sender?.full_name || "Utilisateur"}
                      </p>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {selectedMessage.sender?.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Message Content (Styled like a modern email body) */}
                <div className="flex-1 p-8 overflow-y-auto hide-scrollbar">
                  <div className="glass-card-premium bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/30 dark:shadow-none min-h-[200px]">
                    <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-wrap">
                      {selectedMessage.content}
                    </div>
                  </div>
                </div>

                {/* Reply Box */}
                <div className="p-4 border-t border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md">
                  <form onSubmit={handleSendReply} className="flex gap-4 max-w-4xl mx-auto">
                    <div className="flex-1 relative group">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Écrivez votre réponse..."
                        className="w-full p-4 pl-5 bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium text-slate-900 dark:text-white placeholder-slate-400 resize-none h-20 shadow-inner"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      disabled={!replyContent.trim()}
                      className="px-6 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 h-20"
                    >
                      <Send className="w-5 h-5" />
                      <span className="hidden sm:inline">Envoyer</span>
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500/10 to-transparent dark:from-blue-500/20 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 border border-blue-500/20 rounded-full animate-[spin_4s_linear_infinite]" />
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/10 border border-slate-100 dark:border-white/5 relative z-10">
                  <Mail className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                Sélectionnez un message
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm text-center font-medium leading-relaxed">
                Choisissez une conversation dans la liste pour lire le message et y répondre.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
