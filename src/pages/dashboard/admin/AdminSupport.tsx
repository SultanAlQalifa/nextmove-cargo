import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { MessageSquare, Search, Filter, MoreVertical, Eye, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { supportService, Ticket } from '../../../services/supportService';
import UnifiedFilterSegment from '../../../components/dashboard/UnifiedFilterSegment';
import TicketDetailsModal from '../../../components/admin/TicketDetailsModal';

export default function AdminSupport() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [activeTab, setActiveTab] = useState('all');
    const [timeRange, setTimeRange] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const data = await supportService.getAllTickets();
            setTickets(data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    // Close action menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openActionMenuId && !(event.target as Element).closest('.action-menu-trigger')) {
                setOpenActionMenuId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openActionMenuId]);

    const handleStatusUpdate = async (ticketId: string, status: Ticket['status']) => {
        try {
            await supportService.updateTicketStatus(ticketId, status);
            fetchTickets();
            setOpenActionMenuId(null);
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleDelete = async (ticketId: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce ticket ?')) {
            try {
                await supportService.deleteTicket(ticketId);
                fetchTickets();
                setOpenActionMenuId(null);
            } catch (error) {
                console.error('Error deleting ticket:', error);
            }
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.id.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTab = activeTab === 'all' || ticket.status === activeTab;

        // Time range filtering logic could be added here

        return matchesSearch && matchesTab;
    });

    const stats = {
        total: tickets.length,
        open: tickets.filter(t => t.status === 'open').length,
        resolved: tickets.filter(t => t.status === 'resolved').length,
        urgent: tickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800';
            case 'resolved': return 'bg-green-100 text-green-800';
            case 'closed': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-600 bg-red-50';
            case 'high': return 'text-orange-600 bg-orange-50';
            case 'medium': return 'text-blue-600 bg-blue-50';
            case 'low': return 'text-gray-600 bg-gray-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div>
            <PageHeader
                title="Support & Tickets"
                subtitle="Gérez les demandes d'assistance des utilisateurs"
            />

            <UnifiedFilterSegment
                timeRange={timeRange}
                setTimeRange={setTimeRange}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                statusFilter={activeTab}
                setStatusFilter={setActiveTab}
                statusOptions={[
                    { value: 'all', label: 'Tous les statuts' },
                    { value: 'open', label: 'Ouverts' },
                    { value: 'in_progress', label: 'En Cours' },
                    { value: 'resolved', label: 'Résolus' },
                    { value: 'closed', label: 'Fermés' }
                ]}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <MessageSquare className="w-6 h-6 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">+12%</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
                    <p className="text-sm text-gray-500">Total Tickets</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-yellow-50 rounded-xl">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                        <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">Action requise</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.open}</h3>
                    <p className="text-sm text-gray-500">Tickets Ouverts</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">+5%</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.resolved}</h3>
                    <p className="text-sm text-gray-500">Tickets Résolus</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-red-50 rounded-xl">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-lg">Prioritaire</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{stats.urgent}</h3>
                    <p className="text-sm text-gray-500">Urgents / Haute Priorité</p>
                </div>
            </div>

            {/* Tickets List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sujet</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Catégorie</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Priorité</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Assigné à</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Chargement...
                                    </td>
                                </tr>
                            ) : filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                        Aucun ticket trouvé
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map((ticket) => (
                                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-gray-100 rounded-lg">
                                                    <MessageSquare className="w-4 h-4 text-gray-600" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium text-gray-900">{ticket.subject}</p>
                                                        {ticket.is_escalated && (
                                                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 uppercase tracking-wide border border-red-200">
                                                                Escaladé
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-gray-500">ID: {ticket.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                                                {ticket.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)} capitalize`}>
                                                {ticket.priority}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)} capitalize`}>
                                                {ticket.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {ticket.assigned_to ? (
                                                <div className="flex items-center gap-2" title={`Assigné à ID: ${ticket.assigned_to}`}>
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                                        {ticket.assigned_to === '1' ? 'AD' : ticket.assigned_to === '2' ? 'SA' : 'FM'}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Non assigné</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(ticket.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="relative action-menu-trigger">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenActionMenuId(openActionMenuId === ticket.id ? null : ticket.id);
                                                    }}
                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    <MoreVertical className="w-4 h-4 text-gray-400" />
                                                </button>

                                                {openActionMenuId === ticket.id && (
                                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-10 py-1 animate-fade-in">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedTicket(ticket);
                                                                setOpenActionMenuId(null);
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                            Voir détails
                                                        </button>
                                                        {ticket.status !== 'resolved' && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(ticket.id, 'resolved')}
                                                                className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                                Marquer résolu
                                                            </button>
                                                        )}
                                                        {ticket.status !== 'closed' && (
                                                            <button
                                                                onClick={() => handleStatusUpdate(ticket.id, 'closed')}
                                                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                                Fermer
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(ticket.id)}
                                                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-50"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            Supprimer
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedTicket && (
                <TicketDetailsModal
                    ticket={selectedTicket}
                    onClose={() => setSelectedTicket(null)}
                    onUpdate={() => {
                        fetchTickets();
                        // If status changed to something filtered out, might want to close modal or keep it open
                        // For now, we'll keep it open but refresh data
                        const updated = tickets.find(t => t.id === selectedTicket.id);
                        if (updated) setSelectedTicket(updated);
                    }}
                />
            )}
        </div>
    );
}
