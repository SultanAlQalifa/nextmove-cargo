import { useTranslation } from 'react-i18next';
import { RFQOffer } from '../../types/rfq';
import { CheckCircle, Clock, DollarSign, Award, Zap, Shield, Box, Anchor } from 'lucide-react';

interface OfferComparisonProps {
    offers: RFQOffer[];
    onAccept: (offerId: string) => void;
    processingId?: string | null;
}

export default function OfferComparison({ offers, onAccept, processingId }: OfferComparisonProps) {
    const { t } = useTranslation();

    if (!offers || offers.length === 0) return null;

    // Find best offers
    const bestPriceOffer = [...offers].sort((a, b) => a.total_price - b.total_price)[0];
    const fastestOffer = [...offers].sort((a, b) => a.estimated_transit_days - b.estimated_transit_days)[0];

    return (
        <div className="overflow-x-auto pb-4">
            <div className="flex gap-6 min-w-max px-1">
                {offers.map((offer) => {
                    const isBestPrice = offer.id === bestPriceOffer.id;
                    const isFastest = offer.id === fastestOffer.id;
                    const isAccepted = offer.status === 'accepted';

                    return (
                        <div
                            key={offer.id}
                            className={`
                                relative w-80 bg-white rounded-2xl border transition-all duration-300 flex flex-col
                                ${isAccepted ? 'border-green-500 ring-2 ring-green-500 shadow-lg' : 'border-gray-200 hover:shadow-xl hover:border-primary/30'}
                                ${offer.status === 'rejected' ? 'opacity-60 grayscale' : ''}
                            `}
                        >
                            {/* Badges */}
                            <div className="absolute -top-3 left-0 right-0 flex justify-center gap-2 pointer-events-none">
                                {isBestPrice && (
                                    <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                                        <Award className="w-3 h-3" /> MEILLEUR PRIX
                                    </span>
                                )}
                                {isFastest && (
                                    <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                                        <Zap className="w-3 h-3" /> LE PLUS RAPIDE
                                    </span>
                                )}
                            </div>

                            {/* Header */}
                            <div className="p-6 text-center border-b border-gray-50 bg-gray-50/30 rounded-t-2xl">
                                <div className="text-3xl font-bold text-gray-900 mb-1">
                                    {offer.total_price.toLocaleString()} <span className="text-lg text-gray-500 font-medium">{offer.currency}</span>
                                </div>
                                <div className="text-sm text-gray-500 font-medium mb-4">Prix Total Estimé</div>

                                <div className="flex justify-center gap-4 text-sm">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <span className="font-semibold text-gray-900">{offer.estimated_transit_days}j</span>
                                        <span className="text-xs text-gray-500">Transit</span>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                            <CalendarIcon className="w-5 h-5" />
                                        </div>
                                        <span className="font-semibold text-gray-900">{offer.validity_days}j</span>
                                        <span className="text-xs text-gray-500">Validité</span>
                                    </div>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="p-6 space-y-4 flex-1">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 flex items-center gap-2">
                                            <Anchor className="w-4 h-4 text-gray-400" /> Fret de base
                                        </span>
                                        <span className="font-medium">{offer.base_price.toLocaleString()} {offer.currency}</span>
                                    </div>
                                    {offer.customs_clearance_price > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-gray-400" /> Dédouanement
                                            </span>
                                            <span className="font-medium">{offer.customs_clearance_price.toLocaleString()} {offer.currency}</span>
                                        </div>
                                    )}
                                    {offer.insurance_price > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-gray-400" /> Assurance
                                            </span>
                                            <span className="font-medium">{offer.insurance_price.toLocaleString()} {offer.currency}</span>
                                        </div>
                                    )}
                                    {(offer.packaging_price > 0 || offer.storage_price > 0) && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500 flex items-center gap-2">
                                                <Box className="w-4 h-4 text-gray-400" /> Autres services
                                            </span>
                                            <span className="font-medium">
                                                {((offer.packaging_price || 0) + (offer.storage_price || 0)).toLocaleString()} {offer.currency}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {offer.message_to_client && (
                                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 italic border border-gray-100">
                                        "{offer.message_to_client}"
                                    </div>
                                )}
                            </div>

                            {/* Action */}
                            <div className="p-6 pt-0 mt-auto">
                                {offer.status === 'accepted' ? (
                                    <div className="w-full py-3 bg-green-50 text-green-700 rounded-xl font-bold flex items-center justify-center gap-2 border border-green-100">
                                        <CheckCircle className="w-5 h-5" />
                                        OFFRE ACCEPTÉE
                                    </div>
                                ) : offer.status === 'rejected' ? (
                                    <div className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-bold flex items-center justify-center gap-2">
                                        OFFRE REJETÉE
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => onAccept(offer.id)}
                                        disabled={!!processingId}
                                        className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {processingId === offer.id ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                Choisir cette offre
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function CalendarIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
    );
}
