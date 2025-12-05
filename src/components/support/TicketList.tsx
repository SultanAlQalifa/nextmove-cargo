import { Ticket } from '../../services/supportService';
import { MessageCircle, Clock, CheckCircle2, AlertCircle, ChevronRight, Package } from 'lucide-react';

interface TicketListProps {
    tickets: Ticket[];
    onTicketClick?: (ticket: Ticket) => void;
}

export default function TicketList({ tickets, onTicketClick }: TicketListProps) {
    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'open': return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'in_progress': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'resolved': return 'bg-green-50 text-green-700 border-green-200';
            case 'closed': return 'bg-gray-50 text-gray-700 border-gray-200';
            default: return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'open': return 'Ouvert';
            case 'in_progress': return 'En cours';
            case 'resolved': return 'Résolu';
            case 'closed': return 'Fermé';
            default: return status;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-600 bg-red-50';
            case 'high': return 'text-orange-600 bg-orange-50';
            case 'medium': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
                {tickets.map((ticket) => (
                    <div
                        key={ticket.id}
                        onClick={() => onTicketClick?.(ticket)}
                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${ticket.status === 'resolved' ? 'bg-green-50' : 'bg-blue-50'}`}>
                                    <MessageCircle className={`w-5 h-5 ${ticket.status === 'resolved' ? 'text-green-600' : 'text-blue-600'}`} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                                        {ticket.subject}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                        <span>#{ticket.id}</span>
                                        <span>•</span>
                                        <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(ticket.status)}`}>
                                    {getStatusLabel(ticket.status)}
                                </span>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 pl-12">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority}
                            </span>
                            {ticket.shipment_ref && (
                                <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                    <Package className="w-3 h-3" />
                                    {ticket.shipment_ref}
                                </span>
                            )}
                            <span className="text-xs text-gray-400 ml-auto">
                                Dernière activité: {new Date(ticket.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
