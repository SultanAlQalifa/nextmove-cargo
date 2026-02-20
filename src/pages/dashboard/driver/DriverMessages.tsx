import { useState } from "react";
import { MessageCircle, Search, Send, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DriverMessages() {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");

  const chats = [
    {
      id: 1,
      name: "Support NextMove",
      lastMessage: "Bonjour, avez-vous pu livrer ?",
      time: "10:30",
      unread: 2,
    },
    {
      id: 2,
      name: "Prestataire Alpha",
      lastMessage: "Nouvelle mission disponible.",
      time: "Hier",
      unread: 0,
    },
  ];

  const messages = [
    {
      id: 1,
      sender: "them",
      text: "Bonjour, avez-vous pu livrer le colis TRK-123 ?",
      time: "10:30",
    },
    {
      id: 2,
      sender: "me",
      text: "Oui, je viens de soumettre le POD.",
      time: "10:32",
    },
    { id: 3, sender: "them", text: "Parfait, merci !", time: "10:33" },
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col relative z-10 w-full max-w-7xl mx-auto space-y-6 pb-6 mt-4">
      <div className="grain-overlay opacity-[0.02] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex-1 glass-card-premium rounded-[2rem] border-white/20 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none bg-white/60 dark:bg-slate-900/40 backdrop-blur-2xl overflow-hidden flex"
      >
        {/* Sidebar List */}
        <div className="w-1/3 border-r border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md flex flex-col relative z-10">
          <div className="p-5 border-b border-slate-200/50 dark:border-white/5 relative">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-4">Messages</h2>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all shadow-inner"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={`w-full text-left p-4 transition-all relative overflow-hidden group ${selectedChat === chat.id
                    ? "bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                    : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                  }`}
              >
                {selectedChat === chat.id && (
                  <motion.div
                    layoutId="activeChatIndicator"
                    className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"
                  />
                )}
                <div className="flex justify-between items-start mb-1.5 gap-2">
                  <h3 className={`text-sm truncate ${selectedChat === chat.id ? "text-slate-900 dark:text-white font-black" : "text-slate-700 dark:text-slate-300 font-bold"}`}>
                    {chat.name}
                  </h3>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 whitespace-nowrap mt-0.5">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className={`text-xs truncate font-medium ${selectedChat === chat.id ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-500/80"}`}>
                    {chat.lastMessage}
                  </p>
                  {chat.unread > 0 && (
                    <span className="bg-gradient-to-br from-blue-500 to-sky-400 text-white text-[10px] uppercase tracking-widest font-black px-2 mt-0.5 rounded-full shadow-sm ml-2">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-900/20 relative z-10 w-2/3">
          {selectedChat ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedChat}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full"
              >
                {/* Chat Header */}
                <div className="p-6 border-b border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-sky-400 p-[2px] shadow-sm">
                      <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center font-bold text-blue-600 dark:text-blue-400 text-sm">
                        {(chats.find((c) => c.id === selectedChat)?.name || "?")[0].toUpperCase()}
                      </div>
                    </div>
                    <h3 className="font-black text-lg text-slate-900 dark:text-white tracking-tight">
                      {chats.find((c) => c.id === selectedChat)?.name}
                    </h3>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4 hide-scrollbar">
                  {messages.map((msg, idx) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={msg.id}
                      className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-5 py-3 shadow-sm relative group ${msg.sender === "me"
                            ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-sm"
                            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-white/5 rounded-bl-sm"
                          }`}
                      >
                        <p className="text-sm font-medium">{msg.text}</p>
                        <p
                          className={`text-[9px] mt-1.5 font-bold tracking-widest flex items-center gap-1 ${msg.sender === "me" ? "justify-end text-blue-200" : "justify-start text-slate-400"}`}
                        >
                          <Clock className="w-2.5 h-2.5" />
                          {msg.time}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="p-4 border-t border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setMessageInput("");
                    }}
                    className="flex gap-2 max-w-4xl mx-auto"
                  >
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Écrivez votre message..."
                      className="flex-1 bg-slate-50/80 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-inner"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="submit"
                      title="Envoyer le message"
                      className="w-12 h-12 flex items-center justify-center bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
                    >
                      <Send className="w-5 h-5 ml-1" />
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
                  <MessageCircle className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                Sélectionnez une conversation
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm text-center font-medium leading-relaxed">
                Choisissez une conversation dans la liste pour commencer.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
