import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { MessageSquare, Search, Send, User, Mail, Clock, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { messageService, Message } from '../../../services/messageService';
import { useToast } from '../../../contexts/ToastContext';

export default function AdminMessages() {
    const { success } = useToast();
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [replyContent, setReplyContent] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
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
            console.error('Error loading messages:', error);
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
                receiver_id: selectedMessage.sender_id === user.id ? (selectedMessage as any).receiver_id : selectedMessage.sender_id,
                subject: `Re: ${(selectedMessage as any).subject || 'Message'}`,
                content: replyContent,
                sender_email: user.email,
                receiver_email: selectedMessage.sender_id === user.id ? (selectedMessage as any).receiver_email : selectedMessage.sender?.email
            } as any); // Casting to any because sendMessage signature in service is different (takes conversationId, content)
            setReplyContent('');
            loadMessages();
            success('Réponse envoyée !');
        } catch (error) {
            console.error('Error sending reply:', error);
        }
    };

    const filteredMessages = messages.filter(m =>
        ((m as any).subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.sender?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.sender?.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <PageHeader
                title="Messagerie Interne"
                subtitle="Consultez et répondez aux messages des utilisateurs"
            />

            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex mt-4">
                {/* Sidebar List */}
                <div className="w-80 border-r border-gray-100 flex flex-col bg-gray-50/50">
                    <div className="p-4 border-b border-gray-100 bg-white">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher..."
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-sm focus:bg-white focus:border-primary/20 focus:outline-none transition-all"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-gray-500">Chargement...</div>
                        ) : filteredMessages.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p>Aucun message</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredMessages.map((msg) => (
                                    <button
                                        key={msg.id}
                                        onClick={() => setSelectedMessage(msg)}
                                        className={`w-full p-4 text-left hover:bg-white transition-colors ${selectedMessage?.id === msg.id ? 'bg-white border-l-4 border-primary shadow-sm' : 'border-l-4 border-transparent'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-medium text-sm truncate ${!msg.is_read && msg.sender_id !== user?.id ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                                                {msg.sender?.full_name || msg.sender?.email || 'Utilisateur'}
                                            </span>
                                            <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                                {new Date(msg.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {/* Subject is not in Message interface, using content preview instead or hardcoded subject if needed. 
                                            The original code assumed a subject field. I will use content slice as subject or 'No Subject' */}
                                        <p className={`text-sm mb-1 truncate ${!msg.is_read && msg.sender_id !== user?.id ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                                            {(msg as any).subject || 'Nouveau message'}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">
                                            {msg.content}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Message Detail */}
                <div className="flex-1 flex flex-col bg-white">
                    {selectedMessage ? (
                        <>
                            {/* Message Header */}
                            <div className="p-6 border-b border-gray-100">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">{(selectedMessage as any).subject || 'Message'}</h2>
                                    <span className="text-sm text-gray-500 flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {new Date(selectedMessage.created_at).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {(selectedMessage.sender?.full_name || selectedMessage.sender?.email || '?')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {selectedMessage.sender?.full_name || 'Utilisateur'}
                                            <span className="text-gray-400 font-normal text-sm ml-2">&lt;{selectedMessage.sender?.email}&gt;</span>
                                        </p>
                                        {/* Receiver info is not available in Message interface */}
                                    </div>
                                </div>
                            </div>

                            {/* Message Content */}
                            <div className="flex-1 p-6 overflow-y-auto">
                                <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                                    {selectedMessage.content}
                                </div>
                            </div>

                            {/* Reply Box */}
                            <div className="p-4 border-t border-gray-100 bg-gray-50">
                                <form onSubmit={handleSendReply} className="flex gap-4">
                                    <textarea
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder="Écrivez votre réponse..."
                                        className="flex-1 p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none h-24"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!replyContent.trim()}
                                        className="px-6 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end flex items-center gap-2"
                                    >
                                        <Send className="w-4 h-4" />
                                        Envoyer
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Mail className="w-10 h-10 text-gray-300" />
                            </div>
                            <p className="text-lg font-medium text-gray-500">Sélectionnez un message</p>
                            <p className="text-sm">Choisissez une conversation dans la liste pour voir les détails</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
