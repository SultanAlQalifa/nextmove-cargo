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
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useChat } from "../../contexts/ChatContext";
import {
  messageService,
  Message,
  Conversation,
} from "../../services/messageService";
import { supabase } from "../../lib/supabase";

export default function ChatWidget() {
  const { user } = useAuth();
  const {
    isOpen,
    setIsOpen,
    selectedConversation,
    setSelectedConversation,
    recipientDetails,
  } = useChat();
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations when widget opens
  useEffect(() => {
    if (user && isOpen) {
      loadConversations();
    }
  }, [user, isOpen]);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);

      // Subscribe to new messages
      const subscription = messageService.subscribeToMessages(
        selectedConversation,
        (payload) => {
          // Optimistically add message if it's not already there (though Realtime usually sends the new row)
          // We might need to fetch the sender details, so simpler to just reload or append carefully
          // For now, let's append the payload.new if it matches our schema
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
        },
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedConversation, isOpen]);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !replyContent.trim()) return;

    try {
      if (selectedConversation) {
        // Send to existing conversation
        await messageService.sendMessage(selectedConversation, replyContent);
        // Optimistic update is handled by Realtime subscription usually,
        // but we can clear input immediately
        setReplyContent("");
      } else if (recipientDetails) {
        // Start new conversation
        // Note: This logic needs to be robust. Ideally check if conversation exists first.
        // For now, assuming startConversation handles it.
        // But wait, messageService.startConversation takes userId.
        // We need the ID of the recipient.
        // recipientDetails should have the ID.
        // If recipientDetails is just { name, email }, we can't start a chat easily without ID.
        // Assuming recipientDetails has ID or we can't start.
        // Temporary fallback: If we don't have an ID, we can't start.
        // But let's assume we do or we passed it.
        // The ChatContext might need to be updated to ensure recipientDetails has ID.
        // For this implementation, let's assume we are replying to an existing conversation
        // OR we have a way to start one.
        // If selectedConversation is null, we are in the list view OR starting a new one.
        // If we are here, it means we are trying to send a message without a selected conversation?
        // Actually, the UI below only shows the form if selectedConversation is active.
        // So this block might be unreachable unless we change the UI.
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleStartNewChat = async () => {
    // Logic to start a new chat (e.g. from a user profile)
    // This would set selectedConversation to the new ID
  };

  const getOtherParticipant = (conv: Conversation) => {
    return (
      conv.participants.find((p) => p.user_id !== user?.id)?.user || {
        full_name: "Utilisateur",
        email: "",
      }
    );
  };

  if (!user) return null;

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
          className={`bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-300 ${isMinimized ? "h-14 w-72" : "h-[500px] w-full"}`}
        >
          {/* Header */}
          <div
            className="bg-primary text-white p-4 flex items-center justify-between cursor-pointer"
            onClick={() =>
              !selectedConversation && setIsMinimized(!isMinimized)
            }
          >
            <div className="flex items-center gap-3">
              {selectedConversation ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedConversation(null);
                  }}
                  className="hover:bg-white/20 p-1 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              ) : (
                <MessageCircle className="w-6 h-6" />
              )}
              <div>
                <h3 className="font-bold text-sm">
                  {selectedConversation
                    ? "Discussion" // Could put name here if we find it in conversations list
                    : "Messagerie"}
                </h3>
                {selectedConversation && (
                  <p className="text-xs text-white/80">En ligne</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {selectedConversation ? (
                /* Conversation View */
                <>
                  <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl p-3 text-sm ${
                            msg.sender_id === user.id
                              ? "bg-primary text-white rounded-br-none"
                              : "bg-white text-gray-700 border border-gray-100 rounded-bl-none shadow-sm"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p
                            className={`text-[10px] mt-1 ${msg.sender_id === user.id ? "text-white/70" : "text-gray-400"}`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  <form
                    onSubmit={handleSendMessage}
                    className="p-3 bg-white border-t border-gray-100 flex gap-2"
                  >
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
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              ) : (
                /* Conversation List */
                <div className="flex-1 flex flex-col">
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Rechercher..."
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-primary/20 focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {loading ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        Chargement...
                      </div>
                    ) : conversations.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <p className="text-sm">Aucune conversation</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-50">
                        {conversations.map((conv) => {
                          const otherUser = getOtherParticipant(conv);
                          return (
                            <button
                              key={conv.id}
                              onClick={() => setSelectedConversation(conv.id)}
                              className="w-full p-4 hover:bg-gray-50 transition-colors flex items-start gap-3 text-left group"
                            >
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
                                {(otherUser.full_name || "?")[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                  <h4 className="font-medium text-sm text-gray-900 truncate pr-2">
                                    {otherUser.full_name}
                                  </h4>
                                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                    {new Date(
                                      conv.updated_at,
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 truncate">
                                  {conv.last_message}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
