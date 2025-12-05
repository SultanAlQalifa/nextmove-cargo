import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ticketService, Ticket } from '../../services/ticketService';
import SupportTicketDetail from './SupportTicketDetail';
import { Plus, MessageSquare } from 'lucide-react';

export default function SupportTicketList() {
    const { user, profile } = useAuth();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [showCreate, setShowCreate] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [newTicket, setNewTicket] = useState({ subject: '', priority: 'normal' });

    useEffect(() => {
        if (user) loadTickets();
    }, [user, profile]);

    const loadTickets = async () => {
        if (!user) return;
        try {
            let data;
            if (profile?.role === 'admin') {
                data = await ticketService.getAllTickets();
            } else {
                data = await ticketService.getUserTickets(user.id);
            }
            setTickets(data || []);
        } catch (error) {
            console.error('Error loading tickets:', error);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        try {
            await ticketService.createTicket(user.id, newTicket.subject, newTicket.priority);
            setShowCreate(false);
            setNewTicket({ subject: '', priority: 'normal' });
            loadTickets();
        } catch (error) {
            console.error('Error creating ticket:', error);
        }
    };

    if (selectedTicket) {
        return <SupportTicketDetail ticket={selectedTicket} onBack={() => setSelectedTicket(null)} />;
    }

    return (
        <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="text-primary" /> Support Tickets
                </h2>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="bg-primary text-white px-3 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={16} /> New Ticket
                </button>
            </div>

            {showCreate && (
                <form onSubmit={handleCreate} className="mb-6 bg-gray-50 p-4 rounded-md border">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Subject</label>
                            <input
                                type="text"
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                                value={newTicket.subject}
                                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Priority</label>
                            <select
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 border"
                                value={newTicket.priority}
                                onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                            >
                                <option value="low">Low</option>
                                <option value="normal">Normal</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowCreate(false)}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                            >
                                Submit Ticket
                            </button>
                        </div>
                    </div>
                </form>
            )}

            <div className="overflow-hidden">
                <ul className="divide-y divide-gray-200">
                    {tickets.map((ticket) => (
                        <li key={ticket.id} className="py-4 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                            <div className="flex items-center justify-between px-4">
                                <div>
                                    <p className="text-sm font-medium text-primary">{ticket.subject}</p>
                                    <p className="text-sm text-gray-500">
                                        Created: {new Date(ticket.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                                            ticket.priority === 'low' ? 'bg-green-100 text-green-800' :
                                                'bg-yellow-100 text-yellow-800'}`}>
                                        {ticket.priority}
                                    </span>
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                                            ticket.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                                                'bg-purple-100 text-purple-800'}`}>
                                        {ticket.status}
                                    </span>
                                </div>
                            </div>
                        </li>
                    ))}
                    {tickets.length === 0 && (
                        <li className="py-4 text-center text-gray-500">No tickets found.</li>
                    )}
                </ul>
            </div>
        </div>
    );
}
