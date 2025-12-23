import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  X,
  Send,
  Minus,
  Maximize2,
  Search,
  ChevronLeft,
  Trash2,
  Bot,
  Mic,
  Paperclip,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { aiService } from "../../services/aiService";
import { shipmentContext } from "../../services/shipmentContext"; // NEW
import { messageService, Message, Conversation } from "../../services/messageService";
import { supabase } from "../../lib/supabase";
import { useSettings } from "../../contexts/SettingsContext";
import { useAuth } from "../../contexts/AuthContext";
import { useChat } from "../../contexts/ChatContext";

export default function ChatWidget() {
  const { error: toastError } = useToast();
  const { user } = useAuth();
  const { settings } = useSettings();
  const {
    isOpen,
    setIsOpen,
    selectedConversation,
    setSelectedConversation,
    recipientDetails,
    // isAIConversation, // REMOVED
    // setIsAIConversation, // REMOVED
  } = useChat();
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false); // NEW
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userContext, setUserContext] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'messages' | 'ai'>('messages');
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // NEW for OCR
  const fileInputRef = useRef<HTMLInputElement>(null); // NEW for file upload

  // Helper functions defined BEFORE useEffect
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await messageService.getConversations();
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const data = await messageService.getMessages(convId);
      setMessages(data);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const loadContext = async () => {
    if (user) {
      const context = await shipmentContext.getActiveShipmentsContext(user.id);
      setUserContext(context);
    }
  };

  // Load conversations when widget opens
  useEffect(() => {
    // 1. Initialize AI chat if needed
    if (isOpen && aiMessages.length === 0) {
      const welcomeMsg = aiService.getWelcomeMessage();
      setAiMessages([{
        id: welcomeMsg.id,
        conversation_id: 'ai-chat',
        sender_id: 'ai-bot',
        content: welcomeMsg.content,
        created_at: welcomeMsg.timestamp.toISOString(),
        is_read: true,
        sender: {
          full_name: settings?.integrations?.ai_chat?.assistant_name || 'Assistant IA',
          email: 'ai@nextmove.com'
        }
      } as Message]);
    }

    // 2. Determine Initial Tab
    if (isOpen) {
      if (!user) {
        setActiveTab('ai');
      } else {
        // If user, default to messages unless they were already using AI? 
        // For now default to messages or keep previous state if persisted.
        // Let's default to messages for verified users.
        setActiveTab('messages');
        loadConversations();
        loadContext();
      }
    }
  }, [user, isOpen]);

  // ... (keep loadContext same)

  // ... handleSendMessage
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      if (activeTab === 'ai') {
        const senderId = user ? user.id : 'guest-user';
        const userMsg: Message = {
          id: crypto.randomUUID(),
          conversation_id: 'ai-chat',
          sender_id: senderId,
          content: replyContent,
          created_at: new Date().toISOString(),
          is_read: true,
        };

        setAiMessages(prev => [...prev, userMsg]);
        setReplyContent("");
        setLoading(true);

        const aiConfig = settings?.integrations?.ai_chat;
        const aiResponse = await aiService.sendMessage(
          userMsg.content,
          userContext,
          selectedImage || undefined,
          {
            apiKey: aiConfig?.enabled ? aiConfig.api_key : undefined,
            systemPrompt: aiConfig?.enabled ? aiConfig.system_prompt : undefined
          }
        );

        const aiMsg: Message = {
          id: aiResponse.id,
          conversation_id: 'ai-chat',
          sender_id: 'ai-bot',
          content: aiResponse.content,
          created_at: aiResponse.timestamp.toISOString(),
          is_read: true,
          sender: {
            full_name: aiConfig?.assistant_name || 'Assistant IA',
            email: 'ai@nextmove.com'
          }
        };

        setAiMessages(prev => [...prev, aiMsg]);
        setSelectedImage(null);
      } else if (selectedConversation && user) {
        await messageService.sendMessage(selectedConversation, replyContent);
        setReplyContent("");
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      if (activeTab === 'ai') {
        setAiMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          conversation_id: 'ai-chat',
          sender_id: 'ai-bot',
          content: "Désolé, je rencontre une difficulté technique pour répondre. Pouvez-vous reformuler ou rafraîchir la page ?",
          created_at: new Date().toISOString(),
          is_read: true,
          sender: { full_name: 'Système', email: 'system@nextmove.com' }
        } as Message]);
      }
    } finally {
      setLoading(false);
    }
  };


  // ...

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setReplyContent(prev => prev ? `${prev} ${transcript}` : transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      toastError("La reconnaissance vocale n'est pas supportée par votre navigateur (Essayez Chrome).");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB Limit
        toastError("L'image est trop volumineuse (Max 5MB)");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getOtherParticipant = (conv: Conversation) => {
    return (
      conv.participants.find((p) => p.user_id !== user?.id)?.user || {
        full_name: "Utilisateur",
        email: "",
      }
    );
  };

  // REMOVED helper functions (loadConversations, loadMessages, etc.) from here as they are now at the top.

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col items-end transition-all duration-300 ${isMinimized ? "w-auto" : "w-full max-w-sm"}`}
    >
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all flex items-center justify-center group relative"
        >
          <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
          {/* Unread Badge - Mocked for now as we need a separate query for unread count */}
          {/* <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span> */}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-300 ${isMinimized ? "h-14 w-72" : "h-[600px] w-full"}`} // Increased height for tabs
        >
          {/* Header */}
          <div className="bg-primary text-white flex flex-col">
            {/* Top Bar */}
            <div className="flex items-center justify-between p-4 pb-2">
              <div className="flex items-center gap-3">
                {/* Back Button only for Messages Tab inner view */}
                {activeTab === 'messages' && selectedConversation ? (
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="hover:bg-white/20 p-1 rounded-full transition-colors"
                    aria-label="Retour"
                    title="Retour"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                ) : (
                  <Bot className="w-6 h-6" />
                )}
                <h3 className="font-bold text-sm">
                  {activeTab === 'ai' ? "Assistant IA" : (selectedConversation ? "Discussion" : "Messagerie")}
                </h3>
              </div>

              {/* Window Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMinimized(!isMinimized);
                  }}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label={isMinimized ? "Agrandir" : "Réduire"}
                  title={isMinimized ? "Agrandir" : "Réduire"}
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    setIsMinimized(false);
                  }}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Fermer"
                  title="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* TABS (Visible for everyone) */}
            {!isMinimized && (
              <div className="flex px-2 pb-2 gap-2">
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'messages'
                    ? 'bg-white text-primary shadow-sm'
                    : 'bg-primary-dark/30 text-white/70 hover:bg-white/10'
                    }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  Messages
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'ai'
                    ? 'bg-white text-primary shadow-sm'
                    : 'bg-primary-dark/30 text-white/70 hover:bg-white/10'
                    }`}
                >
                  <Bot className="w-4 h-4" />
                  Assistant IA
                </button>
              </div>
            )}
          </div>

          {!isMinimized && (
            <>
              {/* CONTENT AREA */}
              {activeTab === 'ai' ? (
                /* --- AI TAB CONTENT --- */
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                    {aiMessages.map((msg) => {
                      const isMe = msg.sender_id !== 'ai-bot';
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded-2xl p-3 text-sm break-words whitespace-pre-wrap ${isMe ? "bg-primary text-white rounded-br-none" : "bg-white text-gray-700 border border-gray-100 rounded-bl-none shadow-sm"}`}>
                            <p className="leading-relaxed">{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? "text-white/70" : "text-gray-400"}`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      );
                    })}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-white text-gray-700 border border-gray-100 rounded-2xl rounded-bl-none p-3 shadow-sm flex items-center gap-2">
                          <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Image Preview */}
                  {selectedImage && (
                    <div className="p-2 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-primary" />
                        <span className="text-xs text-gray-600 truncate max-w-[200px]">Image sélectionnée</span>
                      </div>
                      <button
                        onClick={() => setSelectedImage(null)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Supprimer l'image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* INPUT FORM (AI) */}
                  <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                    <label htmlFor="chat-file-upload" className="sr-only">Upload image</label>
                    <input
                      id="chat-file-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-gray-100 rounded-xl transition-colors"
                      title="Joindre une image"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={startListening}
                      className={`p-2 rounded-xl transition-colors ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                      title="Dictée Vocale"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                    <input
                      type="text"
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={isListening ? "Écoute en cours..." : "Posez une question..."}
                      className="flex-1 px-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-primary/20 rounded-xl text-sm focus:outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!replyContent.trim() && !selectedImage}
                      className="p-2 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Envoyer"
                      title="Envoyer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>

              ) : (
                /* --- MESSAGES TAB CONTENT --- */
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  {selectedConversation ? (
                    /* ACTIVE CONVERSATION */
                    <>
                      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                        {messages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-2xl p-3 text-sm break-words whitespace-pre-wrap ${msg.sender_id === user?.id ? "bg-primary text-white rounded-br-none" : "bg-white text-gray-700 border border-gray-100 rounded-bl-none shadow-sm"}`}>
                              <p className="leading-relaxed">{msg.content}</p>
                              <p className={`text-[10px] mt-1 ${msg.sender_id === user?.id ? "text-white/70" : "text-gray-400"}`}>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                      {/* INPUT FORM (Human) */}
                      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                        <button
                          type="button"
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                          title="Dictée Vocale (Indisponible)"
                        >
                          <Mic className="w-5 h-5 opacity-50 cursor-not-allowed" /> {/* Voice disabled for human chat for now */}
                        </button>
                        <input
                          type="text"
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder="Écrivez un message..."
                          className="flex-1 px-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-primary/20 rounded-xl text-sm focus:outline-none transition-all"
                        />
                        <button
                          type="submit"
                          disabled={!replyContent.trim()}
                          className="p-2 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          aria-label="Envoyer"
                          title="Envoyer"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </>
                  ) : (
                    /* CONVERSATION LIST */
                    <>
                      {!user ? (
                        /* GUEST PLACEHOLDER (Should not happen if logic is correct, but safe fallback) */
                        <div className="p-8 text-center text-gray-500">Connectez-vous pour voir vos messages.</div>
                      ) : (
                        <>
                          <div className="p-3 border-b border-gray-100">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <input type="text" placeholder="Rechercher..." className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-primary/20 focus:outline-none transition-all" />
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto">
                            {loading ? (
                              <div className="p-4 text-center text-gray-500 text-sm">
                                Chargement...
                              </div>
                            ) : conversations.length === 0 ? (
                              <div className="p-8 text-center text-gray-500"><p className="text-sm">Aucune conversation</p></div>
                            ) : (
                              <div className="divide-y divide-gray-50">
                                {conversations.map((conv) => {
                                  const otherUser = getOtherParticipant(conv);
                                  return (
                                    <button key={conv.id} onClick={() => setSelectedConversation(conv.id)} className="w-full p-4 hover:bg-gray-50 transition-colors flex items-start gap-3 text-left group">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
                                        {(otherUser.full_name || "?")[0].toUpperCase()}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                          <h4 className="font-medium text-sm text-gray-900 truncate pr-2">{otherUser.full_name}</h4>
                                          <span className="text-[10px] text-gray-400 whitespace-nowrap">{new Date(conv.updated_at).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{conv.last_message}</p>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
