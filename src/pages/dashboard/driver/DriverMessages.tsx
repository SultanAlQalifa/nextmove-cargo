import { useState } from "react";
import { MessageCircle, Search, Send } from "lucide-react";

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
    <div className="h-[calc(100vh-8rem)] flex bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Sidebar List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setSelectedChat(chat.id)}
              className={`p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${selectedChat === chat.id ? "bg-blue-50" : ""}`}
            >
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-semibold text-gray-900">{chat.name}</h3>
                <span className="text-xs text-gray-500">{chat.time}</span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600 truncate">
                  {chat.lastMessage}
                </p>
                {chat.unread > 0 && (
                  <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedChat ? (
          <>
            <div className="p-4 bg-white border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">
                {chats.find((c) => c.id === selectedChat)?.name}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${msg.sender === "me"
                      ? "bg-primary text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none"
                      }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p
                      className={`text-[10px] mt-1 text-right ${msg.sender === "me" ? "text-blue-100" : "text-gray-400"}`}
                    >
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setMessageInput("");
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1 rounded-lg border-gray-300 focus:ring-primary focus:border-primary"
                />
                <button
                  type="submit"
                  title="Envoyer le message"
                  className="bg-primary text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageCircle className="w-16 h-16 mb-4 opacity-20" />
            <p>Sélectionnez une conversation pour commencer</p>
          </div>
        )}
      </div>
    </div>
  );
}
