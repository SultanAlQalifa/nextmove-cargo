import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../contexts/ToastContext';
import { rfqService } from '../../../services/rfqService';
import type { RFQWithOffers, RFQOffer } from '../../../types/rfq';
import OfferComparison from '../../../components/rfq/OfferComparison';
import {
    ArrowLeft,
    MapPin,
    Calendar,
    Package,
    Ship,
    Plane,
    Truck,
    Clock,
    DollarSign,
    CheckCircle,
    AlertCircle,
    FileText,
    Shield,
    Box,
    Archive,
    LayoutGrid,
    List
} from 'lucide-react';

export default function RFQDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { error: toastError } = useToast();
    const [rfq, setRfq] = useState<RFQWithOffers | null>(null);
    const [loading, setLoading] = useState(true);
    const [processingOffer, setProcessingOffer] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'compare'>('list');

    useEffect(() => {
        if (id) {
            loadRFQ(id);
        }
    }, [id]);

    const loadRFQ = async (rfqId: string) => {
        try {
            setLoading(true);
            const data = await rfqService.getRFQWithOffers(rfqId);
            setRfq(data);
            // Default to compare mode if there are multiple offers
            if (data.offers.length > 1) {
                setViewMode('compare');
            }
        } catch (error) {
            console.error('Error loading RFQ:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptOffer = async (offerId: string) => {
        if (!confirm(t('rfq.messages.confirmAcceptOffer', 'Êtes-vous sûr de vouloir accepter cette offre ? Cette action rejettera automatiquement les autres offres.'))) return;

        try {
            setProcessingOffer(offerId);
            await rfqService.acceptOffer(offerId);
            // Reload to update statuses
            if (id) loadRFQ(id);
        } catch (error) {
            console.error('Error accepting offer:', error);
            toastError('Une erreur est survenue lors de l\'acceptation de l\'offre.');
        } finally {
            setProcessingOffer(null);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Êtes-vous sûr de vouloir annuler cette demande ?')) return;
        try {
            if (id) {
                await rfqService.cancelRFQ(id);
                loadRFQ(id);
            }
        } catch (error) {
            console.error('Error cancelling RFQ:', error);
            toastError('Erreur lors de l\'annulation de la demande.');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement cette demande ? Cette action est irréversible.')) return;
        try {
            if (id) {
                await rfqService.deleteRFQ(id);
                navigate('/dashboard/client/rfq');
            }
        } catch (error) {
            console.error('Error deleting RFQ:', error);
            toastError('Erreur lors de la suppression de la demande.');
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            draft: { color: 'bg-gray-100 text-gray-700 border-gray-200', label: 'Brouillon' },
            published: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Publiée' },
            offers_received: { color: 'bg-green-50 text-green-700 border-green-200', label: 'Offres Reçues' },
            offer_accepted: { color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Offre Acceptée' },
            expired: { color: 'bg-red-50 text-red-700 border-red-200', label: 'Expirée' },
            cancelled: { color: 'bg-gray-50 text-gray-500 border-gray-200', label: 'Annulée' },
        };

        const badge = badges[status as keyof typeof badges] || badges.draft;

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${badge.color}`}>
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!rfq) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">Demande introuvable</h2>
                <button
                    onClick={() => navigate('/dashboard/client/rfq')}
                    className="mt-4 text-primary hover:underline"
                >
                    Retour à la liste
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard/client/rfq')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-500" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            Détail de la demande
                            {getStatusBadge(rfq.status)}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">ID: {rfq.id}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {rfq.status === 'draft' && (
                        <>
                            <button
                                onClick={() => navigate('/dashboard/client/rfq/create', { state: { mode: 'edit', rfqData: rfq } })}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                            >
                                <FileText className="w-4 h-4" />
                                Modifier
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                            >
                                <Archive className="w-4 h-4" />
                                Supprimer
                            </button>
                        </>
                    )}

                    {(rfq.status === 'published' || rfq.status === 'offers_received') && (
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                        >
                            <AlertCircle className="w-4 h-4" />
                            Annuler la demande
                        </button>
                    )}

                    {rfq.status === 'cancelled' && (
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                        >
                            <Archive className="w-4 h-4" />
                            Supprimer
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: RFQ Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Route Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" /> Route
                        </h2>
                        <div className="flex items-center justify-between relative">
                            <div className="flex-1 text-center sm:text-left">
                                <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">Origine</p>
                                <p className="text-xl font-bold text-gray-900 mt-1">{rfq.origin_port}</p>
                            </div>

                            <div className="flex-1 flex flex-col items-center px-4">
                                <div className={`p-3 rounded-full mb-2 ${rfq.transport_mode === 'air' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                    {getTransportIcon(rfq.transport_mode)}
                                </div>
                                <div className="w-full h-0.5 bg-gray-200 relative top-[-20px] -z-10"></div>
                                <p className="text-xs font-medium text-gray-500 capitalize">{rfq.transport_mode}</p>
                            </div>

                            <div className="flex-1 text-center sm:text-right">
                                <p className="text-sm text-gray-500 uppercase tracking-wider font-medium">Destination</p>
                                <p className="text-xl font-bold text-gray-900 mt-1">{rfq.destination_port}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 pt-6 border-t border-gray-50">
                            <div className="flex items-start gap-3">
                                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Départ souhaité</p>
                                    <p className="text-sm text-gray-500">
                                        {rfq.preferred_departure_date ? new Date(rfq.preferred_departure_date).toLocaleDateString() : 'Non spécifié'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Livraison requise</p>
                                    <p className="text-sm text-gray-500">
                                        {rfq.required_delivery_date ? new Date(rfq.required_delivery_date).toLocaleDateString() : 'Non spécifié'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cargo Details Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" /> Marchandise
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Type de marchandise</p>
                                <p className="font-semibold text-gray-900">{rfq.cargo_type}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Quantité</p>
                                <p className="font-semibold text-gray-900">{rfq.quantity || 1}</p>
                            </div>

                            {rfq.weight_kg && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Poids Total</p>
                                    <p className="font-semibold text-gray-900">{rfq.weight_kg} kg</p>
                                </div>
                            )}

                            {rfq.volume_cbm && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Volume Total</p>
                                    <p className="font-semibold text-gray-900">{rfq.volume_cbm} m³</p>
                                </div>
                            )}

                            {(rfq.length_cm || rfq.width_cm || rfq.height_cm) && (
                                <div className="sm:col-span-2">
                                    <p className="text-sm text-gray-500 mb-1">Dimensions (L x l x h)</p>
                                    <p className="font-semibold text-gray-900">
                                        {rfq.length_cm || '-'} x {rfq.width_cm || '-'} x {rfq.height_cm || '-'} cm
                                    </p>
                                </div>
                            )}

                            {rfq.cargo_description && (
                                <div className="sm:col-span-2 bg-gray-50 p-4 rounded-xl">
                                    <p className="text-sm text-gray-500 mb-1">Description</p>
                                    <p className="text-gray-900">{rfq.cargo_description}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Services & Budget */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" /> Services & Budget
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Services requis</p>
                                <div className="flex flex-wrap gap-2">
                                    {rfq.services_needed && rfq.services_needed.length > 0 ? (
                                        rfq.services_needed.map((service) => (
                                            <span key={service} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium capitalize">
                                                {service.replace('_', ' ')}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-400 italic">Aucun service supplémentaire demandé</span>
                                    )}
                                </div>
                            </div>

                            {rfq.budget_amount && (
                                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                                    <div className="p-2 bg-white rounded-full shadow-sm">
                                        <DollarSign className="w-5 h-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-green-800">Budget Cible</p>
                                        <p className="text-xl font-bold text-green-700">
                                            {rfq.budget_amount} {rfq.budget_currency}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Offers */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Offres Reçues</h2>
                        <div className="flex items-center gap-2">
                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">
                                {rfq.offers_count}
                            </span>
                        </div>
                    </div>

                    {/* View Toggle */}
                    {rfq.offers.length > 0 && (
                        <div className="bg-gray-100 p-1 rounded-lg flex mb-4">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <List className="w-4 h-4" /> Liste
                            </button>
                            <button
                                onClick={() => setViewMode('compare')}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-all ${viewMode === 'compare' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <LayoutGrid className="w-4 h-4" /> Comparer
                            </button>
                        </div>
                    )}

                    {rfq.offers.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                            <div className="inline-flex p-4 bg-gray-50 rounded-full mb-4">
                                <Clock className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">En attente d'offres</h3>
                            <p className="text-gray-500 mt-2 text-sm">
                                Les transitaires sont en train d'analyser votre demande. Vous recevrez une notification dès qu'une offre sera disponible.
                            </p>
                        </div>
                    ) : (
                        <>
                            {viewMode === 'compare' ? (
                                <div className="lg:absolute lg:left-0 lg:right-0 lg:px-8 lg:mt-8 lg:bg-gray-50/90 lg:backdrop-blur-sm lg:py-8 lg:border-t lg:border-gray-200 lg:z-10">
                                    <div className="max-w-7xl mx-auto">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="text-xl font-bold text-gray-900">Comparaison des offres</h3>
                                            <button
                                                onClick={() => setViewMode('list')}
                                                className="text-sm text-primary hover:underline"
                                            >
                                                Fermer la comparaison
                                            </button>
                                        </div>
                                        <OfferComparison
                                            offers={rfq.offers}
                                            onAccept={handleAcceptOffer}
                                            processingId={processingOffer}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {rfq.offers.map((offer) => (
                                        <div
                                            key={offer.id}
                                            className={`bg-white rounded-2xl shadow-sm border transition-all duration-200 overflow-hidden
                                                ${offer.status === 'accepted' ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200 hover:border-primary/50 hover:shadow-md'}
                                                ${offer.status === 'rejected' ? 'opacity-60 bg-gray-50' : ''}
                                            `}
                                        >
                                            {/* Offer Header */}
                                            <div className="p-5 border-b border-gray-50">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-2xl font-bold text-gray-900">
                                                            {offer.total_price.toLocaleString()}
                                                        </span>
                                                        <span className="text-sm font-medium text-gray-500 mt-1">
                                                            {offer.currency}
                                                        </span>
                                                    </div>
                                                    {offer.status === 'accepted' && (
                                                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                                            <CheckCircle className="w-3 h-3" /> ACCEPTÉE
                                                        </span>
                                                    )}
                                                    {offer.status === 'rejected' && (
                                                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-lg text-xs font-bold">
                                                            REJETÉE
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" /> {offer.estimated_transit_days} jours
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" /> Validité: {offer.validity_days}j
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Offer Details */}
                                            <div className="p-5 bg-gray-50/50 space-y-3">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Fret de base</span>
                                                    <span className="font-medium">{offer.base_price.toLocaleString()} {offer.currency}</span>
                                                </div>
                                                {offer.customs_clearance_price > 0 && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Dédouanement</span>
                                                        <span className="font-medium">{offer.customs_clearance_price.toLocaleString()} {offer.currency}</span>
                                                    </div>
                                                )}
                                                {offer.insurance_price > 0 && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Assurance</span>
                                                        <span className="font-medium">{offer.insurance_price.toLocaleString()} {offer.currency}</span>
                                                    </div>
                                                )}
                                                {offer.tax_price > 0 && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">TVA (18%)</span>
                                                        <span className="font-medium">{offer.tax_price.toLocaleString()} {offer.currency}</span>
                                                    </div>
                                                )}

                                                {offer.message_to_client && (
                                                    <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                                                        <p className="font-medium text-xs uppercase tracking-wide mb-1 opacity-70">Message du transitaire</p>
                                                        "{offer.message_to_client}"
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            {rfq.status !== 'offer_accepted' && offer.status === 'pending' && (
                                                <div className="p-4 border-t border-gray-100">
                                                    <button
                                                        onClick={() => handleAcceptOffer(offer.id)}
                                                        disabled={!!processingOffer}
                                                        className="w-full py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                    >
                                                        {processingOffer === offer.id ? (
                                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="w-5 h-5" />
                                                                Accepter l'offre
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
