import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ticketService, Ticket, TicketMessage } from '../../services/ticketService';
import { Send, ArrowLeft } from 'lucide-react';

interface SupportTicketDetailProps {
    ticket: Ticket;
    onBack: () => void;
}

export default function SupportTicketDetail({ ticket, onBack }: SupportTicketDetailProps) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadMessages();
        // In a real app, we would subscribe to realtime updates here too
    }, [ticket.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        try {
            const data = await ticketService.getTicketMessages(ticket.id);
            setMessages(data || []);
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
            await ticketService.sendMessage(ticket.id, user.id, newMessage);
            setNewMessage('');
            loadMessages(); // Refresh messages
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
        <div className="bg-white shadow rounded-lg h-[600px] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50 rounded-t-lg">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{ticket.subject}</h2>
                        <p className="text-sm text-gray-500">ID: {ticket.id.slice(0, 8)}</p>
                    </div>
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full 
          ${ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                        ticket.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                            'bg-purple-100 text-purple-800'}`}>
                    {ticket.status}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] px-4 py-2 rounded-lg text-sm ${msg.sender_id === user?.id
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                                }`}
                        >
                            <p className="font-bold text-xs mb-1 opacity-75">
                                {msg.sender?.full_name || 'User'}
                            </p>
                            <p>{msg.message}</p>
                            <p className="text-xs mt-1 opacity-50 text-right">
                                {new Date(msg.created_at).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t bg-gray-50 rounded-b-lg flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-1 border rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-primary text-white p-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
}
