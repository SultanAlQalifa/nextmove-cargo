import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { chatService, ChatMessage } from '../../services/chatService';
import { Send } from 'lucide-react';

interface ChatWindowProps {
    chatId: string;
    recipientName: string;
    onClose: () => void;
}

export default function ChatWindow({ chatId, recipientName, onClose }: ChatWindowProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
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
            console.error('Error loading messages:', error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        try {
            await chatService.sendMessage(chatId, user.id, newMessage);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 w-80 bg-white shadow-xl rounded-lg border border-gray-200 flex flex-col h-96 z-50">
            <div className="bg-primary text-white p-3 rounded-t-lg flex justify-between items-center">
                <span className="font-bold">{recipientName}</span>
                <button onClick={onClose} className="text-white hover:text-gray-200">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-xs px-3 py-2 rounded-lg text-sm ${msg.sender_id === user?.id
                                    ? 'bg-blue-500 text-white rounded-br-none'
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t bg-white rounded-b-lg flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                    type="submit"
                    className="bg-primary text-white p-2 rounded-md hover:bg-blue-700"
                >
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
}
