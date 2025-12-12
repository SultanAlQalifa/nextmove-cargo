import React, { createContext, useContext, useState, ReactNode } from "react";

interface ChatContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  selectedConversation: string | null;
  setSelectedConversation: (id: string | null) => void;
  recipientDetails: { name: string; email: string } | null;
  openChatWith: (
    userId: string,
    details?: { name: string; email: string },
  ) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);

  const [recipientDetails, setRecipientDetails] = useState<{
    name: string;
    email: string;
  } | null>(null);

  const openChatWith = (
    userId: string,
    details?: { name: string; email: string },
  ) => {
    setSelectedConversation(userId);
    if (details) {
      setRecipientDetails(details);
    }
    setIsOpen(true);
  };

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        setIsOpen,
        selectedConversation,
        setSelectedConversation,
        recipientDetails,
        openChatWith,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
