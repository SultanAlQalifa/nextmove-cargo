import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUI } from '../../contexts/UIContext';
import PaymentModal from '../../components/dashboard/PaymentModal';
import ChatWindow from '../../components/dashboard/ChatWindow';
import { quoteService, QuoteRequest } from '../../services/quoteService';
import { chatService } from '../../services/chatService';
import { supabase } from '../../lib/supabase';
import { generateInvoice, generateWaybill } from '../../utils/pdfGenerator';
import PageHeader from '../../components/common/PageHeader';
import DashboardControls from '../../components/dashboard/DashboardControls';
import {
    Package,
    Truck,
    CheckCircle,
    FileText,
    Plus,
    ArrowRight,
    Clock,
    AlertCircle,
    TrendingUp,
    Calculator,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    X,
    Star
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ClientDashboard() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { profile, user } = useAuth();
    const { openCalculator } = useUI();
    const [activeTab, setActiveTab] = useState<'overview' | 'requests' | 'shipments'>('overview');
    const [requests, setRequests] = useState<QuoteRequest[]>([]);
    const [shipments, setShipments] = useState<any[]>([]);
    const [selectedRequestQuotes, setSelectedRequestQuotes] = useState<any[] | null>(null);
    const [paymentShipment, setPaymentShipment] = useState<any | null>(null);
    const [activeChat, setActiveChat] = useState<{ chatId: string; recipientName: string } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            await Promise.all([loadRequests(), loadShipments()]);
        } finally {
            setLoading(false);
        }
    };

    const loadRequests = async () => {
        if (!user) return;
        try {
            const data = await quoteService.getClientRequests(user.id);
            setRequests(data);
        } catch (error) {
            console.error('Error loading requests:', error);
        }
    };

    const loadShipments = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('shipments')
            .select('*, forwarder:forwarder_id(full_name, company_name), payment:payments(*)')
            .eq('client_id', user.id)
            .order('created_at', { ascending: false });

        if (error) console.error('Error loading shipments:', error);
        else setShipments(data || []);
    };

    const handleAcceptQuote = async (quoteId: string, requestId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir accepter cette offre ? Cela créera une expédition.')) return;
        try {
            await quoteService.acceptQuote(quoteId, requestId);
            alert('Offre acceptée ! Expédition créée.');
            setSelectedRequestQuotes(null);
            loadData();
        } catch (error) {
            console.error('Error accepting quote:', error);
            alert('Échec de l\'acceptation de l\'offre.');
        }
    };

    // Filtered Data
    const filteredRequests = requests.filter(r =>
        r.cargo_details.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.destination_country.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredShipments = shipments.filter(s =>
        s.tracking_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.destination_country.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <PageHeader
                title="Tableau de Bord Client"
                subtitle={`Bienvenue, ${profile?.full_name || 'Client'}. Suivez vos expéditions et demandes.`}
                action={{
                    label: "Nouvelle Demande",
                    onClick: () => window.location.href = '/dashboard/client/rfq/create',
                    icon: Plus
                }}
            >
                <div className="flex gap-2">
                    <button
                        onClick={openCalculator}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <Calculator className="w-4 h-4" />
                        <span className="hidden sm:inline">Calculateur</span>
                    </button>
                    <Link
                        to="/dashboard/client/groupage"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        <Package className="w-4 h-4" />
                        <span className="hidden sm:inline">Groupage</span>
                    </Link>
                </div>
            </PageHeader>

            <DashboardControls
                timeRange="30d"
                setTimeRange={() => { }}
                showTimeRange={false}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                searchPlaceholder="Rechercher une expédition ou demande..."
            />

            {/* Upgrade CTA */}
            <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Star className="w-5 h-5 text-yellow-300" fill="currentColor" />
                            </div>
                            <h2 className="text-2xl font-bold">{t('dashboard.upgrade.title')}</h2>
                        </div>
                        <p className="text-blue-100 max-w-xl">
                            {t('dashboard.upgrade.description')}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/upgrade')}
                        className="px-6 py-3 bg-white text-blue-600 font-bold rounded-xl shadow-lg hover:bg-blue-50 transition-all transform hover:-translate-y-1 whitespace-nowrap"
                    >
                        {t('dashboard.upgrade.button')}
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Truck className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" /> Actives
                        </span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Expéditions en cours</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{shipments.filter(s => s.status !== 'completed' && s.status !== 'cancelled').length}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                            <Clock className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                            En attente
                        </span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Demandes de devis</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                        {requests.filter(r => r.status === 'pending').length}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                            Total
                        </span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Expéditions Terminées</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                        {shipments.filter(s => s.status === 'completed').length}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Requests */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">Demandes Récentes</h2>
                            <Link to="/dashboard/client/rfq" className="text-sm text-primary font-medium hover:text-primary/80 flex items-center gap-1">
                                Voir tout <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {filteredRequests.slice(0, 5).map((request) => (
                                <div key={request.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-white group-hover:text-primary transition-colors">
                                            <Package className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{request.cargo_details.description}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {request.origin_country} → {request.destination_country}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full
                                        ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            request.status === 'quoted' ? 'bg-blue-100 text-blue-800' :
                                                'bg-green-100 text-green-800'}`}>
                                        {request.status === 'pending' ? 'En attente' : request.status === 'quoted' ? 'Offre reçue' : 'Terminé'}
                                    </span>
                                </div>
                            ))}
                            {filteredRequests.length === 0 && (
                                <div className="p-8 text-center">
                                    <div className="inline-flex p-4 bg-gray-50 rounded-full mb-4">
                                        <FileText className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 text-sm">Aucune demande récente</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Active Shipments */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">Expéditions en cours</h2>
                            <Link to="/dashboard/client/shipments" className="text-sm text-primary font-medium hover:text-primary/80 flex items-center gap-1">
                                Voir tout <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {filteredShipments.slice(0, 5).map((shipment) => (
                                <div key={shipment.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                            <Truck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{shipment.tracking_number}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {shipment.origin_country} → {shipment.destination_country}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {shipment.status === 'in_transit' && (
                                            <span className="flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                                                En transit
                                            </span>
                                        )}
                                        <button className="text-gray-400 hover:text-primary transition-colors">
                                            <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {filteredShipments.length === 0 && (
                                <div className="p-8 text-center">
                                    <div className="inline-flex p-4 bg-gray-50 rounded-full mb-4">
                                        <Truck className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500 text-sm">Aucune expédition active</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {selectedRequestQuotes && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Offres Disponibles</h3>
                            <button
                                onClick={() => setSelectedRequestQuotes(null)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {selectedRequestQuotes.map((quote) => (
                                <div key={quote.id} className="border border-gray-100 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:shadow-md transition-shadow bg-gray-50/50">
                                    <div>
                                        <p className="font-bold text-lg text-gray-900">{quote.forwarder?.company_name || 'Transitaire'}</p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Valide jusqu'au: {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="mt-4 sm:mt-0 text-right">
                                        <p className="text-2xl font-bold text-primary">{quote.amount} {quote.currency}</p>
                                        <button
                                            onClick={() => handleAcceptQuote(quote.id, quote.request_id)}
                                            className="mt-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 text-sm font-medium transition-colors shadow-sm"
                                        >
                                            Accepter l'offre
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {selectedRequestQuotes.length === 0 && (
                                <p className="text-gray-500 text-center py-8">Aucune offre reçue pour le moment.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {paymentShipment && (
                <PaymentModal
                    shipment={paymentShipment}
                    onClose={() => setPaymentShipment(null)}
                    onSuccess={() => {
                        setPaymentShipment(null);
                        loadData();
                    }}
                />
            )}

            {activeChat && (
                <ChatWindow
                    chatId={activeChat.chatId}
                    recipientName={activeChat.recipientName}
                    onClose={() => setActiveChat(null)}
                />
            )}
        </div>
    );
}
