import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { rfqService } from '../../services/rfqService';
import type { RFQRequest } from '../../types/rfq';
import {
    FileText,
    Plus,
    Eye,
    Edit,
    Trash2,
    Send,
    XCircle,
    CheckCircle,
    AlertCircle,
    Search,
    Filter,
    MoreVertical,
    Ship,
    Plane,
    Truck,
    Calendar,
    MapPin
} from 'lucide-react';

export default function ClientRFQList() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [rfqs, setRfqs] = useState<RFQRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'offers_received'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadRFQs();
    }, [filter]);

    const loadRFQs = async () => {
        try {
            setLoading(true);
            const filters = filter === 'all' ? {} : { status: filter };
            const data = await rfqService.getMyRFQs(filters);
            setRfqs(data);
        } catch (error) {
            console.error('Error loading RFQs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async (id: string) => {
        try {
            await rfqService.publishRFQ(id);
            loadRFQs();
        } catch (error) {
            console.error('Error publishing RFQ:', error);
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm(t('rfq.messages.confirmCancel'))) return;
        try {
            await rfqService.cancelRFQ(id);
            loadRFQs();
        } catch (error) {
            console.error('Error cancelling RFQ:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm(t('rfq.messages.confirmCancel'))) return;
        try {
            await rfqService.deleteRFQ(id);
            loadRFQs();
        } catch (error) {
            console.error('Error deleting RFQ:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            draft: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Edit, label: 'Brouillon' },
            published: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Send, label: 'Publiée' },
            offers_received: { color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle, label: 'Offres Reçues' },
            offer_accepted: { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: CheckCircle, label: 'Acceptée' },
            expired: { color: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle, label: 'Expirée' },
            cancelled: { color: 'bg-gray-50 text-gray-500 border-gray-200', icon: XCircle, label: 'Annulée' },
        };

        const badge = badges[status as keyof typeof badges] || badges.draft;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
                <Icon className="w-3 h-3 mr-1.5" />
                {badge.label}
            </span>
        );
    };

    const getTransportIcon = (mode: string) => {
        switch (mode) {
            case 'sea': return <Ship className="w-5 h-5" />;
            case 'air': return <Plane className="w-5 h-5" />;
            default: return <Truck className="w-5 h-5" />;
        }
    };

    const filteredRfqs = rfqs.filter(rfq =>
        rfq.origin_port.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfq.destination_port.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rfq.cargo_type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Mes Demandes RFQ</h1>
                    <p className="text-gray-500 mt-1">Gérez vos demandes de devis et suivez les offres.</p>
                </div>
                <button
                    onClick={() => navigate('/dashboard/client/rfq/create')}
                    className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30 font-medium"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Nouvelle Demande
                </button>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="flex bg-gray-50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
                    {['all', 'draft', 'published', 'offers_received'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filter === f
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            {f === 'all' ? 'Toutes' : t(`rfq.status.${f}`)}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-transparent focus:bg-white focus:border-primary/20 rounded-xl text-sm transition-all outline-none"
                    />
                </div>
            </div>

            {/* RFQ List */}
            {filteredRfqs.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="inline-flex p-4 bg-gray-50 rounded-full mb-4">
                        <FileText className="w-12 h-12 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Aucune demande trouvée</h3>
                    <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                        {searchTerm
                            ? "Aucun résultat ne correspond à votre recherche."
                            : "Commencez par créer votre première demande de devis pour recevoir des offres."}
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={() => navigate('/dashboard/client/rfq/create')}
                            className="mt-6 inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Créer une demande
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredRfqs.map((rfq) => (
                        <div
                            key={rfq.id}
                            className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-primary/20 transition-all duration-200"
                        >
                            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                <div className="flex-1 w-full">
                                    <div className="flex items-center justify-between md:justify-start gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl ${rfq.transport_mode === 'air' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                {getTransportIcon(rfq.transport_mode)}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                                    {rfq.origin_port} <span className="text-gray-400">→</span> {rfq.destination_port}
                                                </h3>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(rfq.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="md:hidden">
                                            {getStatusBadge(rfq.status)}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50/50 rounded-xl border border-gray-50">
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Type</span>
                                            <p className="font-semibold text-gray-900 mt-1">{rfq.cargo_type}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Mode</span>
                                            <p className="font-semibold text-gray-900 mt-1 capitalize">{rfq.transport_mode}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Service</span>
                                            <p className="font-semibold text-gray-900 mt-1 capitalize">{rfq.service_type}</p>
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Budget</span>
                                            <p className="font-semibold text-primary mt-1">
                                                {rfq.budget_amount ? `${rfq.budget_amount} ${rfq.budget_currency}` : 'Non spécifié'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-3 w-full md:w-auto border-t md:border-t-0 border-gray-100 pt-4 md:pt-0">
                                    <div className="hidden md:block">
                                        {getStatusBadge(rfq.status)}
                                    </div>

                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        <button
                                            onClick={() => navigate(`/dashboard/client/rfq/${rfq.id}`)}
                                            className="flex-1 md:flex-none inline-flex items-center justify-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 hover:text-primary transition-colors text-sm font-medium"
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            Détails
                                        </button>

                                        {rfq.status === 'draft' && (
                                            <>
                                                <button
                                                    onClick={() => navigate(`/dashboard/client/rfq/${rfq.id}/edit`)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handlePublish(rfq.id)}
                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="Publier"
                                                >
                                                    <Send className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(rfq.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}

                                        {rfq.status === 'published' && (
                                            <button
                                                onClick={() => handleCancel(rfq.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Annuler"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
