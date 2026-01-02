
import { OfferWithForwarder } from "../../types/rfq";
import {
  CheckCircle,
  Clock,
  Award,
  Zap,
  Shield,
  Box,
  Anchor,
  Building
} from "lucide-react";
import StarRating from "../common/StarRating";

interface OfferComparisonProps {
  offers: OfferWithForwarder[];
  onAccept: (offerId: string) => void;
  processingId?: string | null;
}

export default function OfferComparison({
  offers,
  onAccept,
  processingId,
}: OfferComparisonProps) {


  if (!offers || offers.length === 0) return null;

  // Find best offers
  const bestPriceOffer = [...offers].sort(
    (a, b) => a.total_price - b.total_price,
  )[0];
  const fastestOffer = [...offers].sort(
    (a, b) => a.estimated_transit_days - b.estimated_transit_days,
  )[0];

  return (
    <div className="overflow-x-auto pb-8 pt-4">
      <div className="flex gap-6 min-w-max px-2 items-stretch">
        {offers.map((offer) => {
          const isBestPrice = offer.id === bestPriceOffer.id;
          const isFastest = offer.id === fastestOffer.id;
          const isAccepted = offer.status === "accepted";

          const ForwarderLogo = () => (
            <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 font-bold overflow-hidden border border-gray-100 shadow-sm shrink-0">
              {offer.forwarder?.avatar_url ? (
                <img
                  src={offer.forwarder.avatar_url}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building className="w-6 h-6 text-gray-400" />
              )}
            </div>
          );

          return (
            <div
              key={offer.id}
              className={`
                                relative w-[340px] bg-white rounded-3xl border transition-all duration-300 flex flex-col group
                                ${isAccepted ? "border-green-500 ring-4 ring-green-500/20 shadow-xl scale-[1.02] z-10" : "border-gray-100 shadow-lg hover:shadow-xl hover:border-primary/50 hover:-translate-y-1"}
                                ${offer.status === "rejected" ? "opacity-60 grayscale" : ""}
                            `}
            >
              {/* Specialized Badges */}
              <div className="absolute -top-3 inset-x-0 flex justify-center gap-2 pointer-events-none z-20">
                {isBestPrice && (
                  <span className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-[10px] tracking-wider font-bold px-3 py-1.5 rounded-full shadow-lg shadow-green-500/30 flex items-center gap-1.5 border border-white/20">
                    <Award className="w-3 h-3" /> MEILLEUR PRIX
                  </span>
                )}
                {isFastest && (
                  <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] tracking-wider font-bold px-3 py-1.5 rounded-full shadow-lg shadow-blue-500/30 flex items-center gap-1.5 border border-white/20">
                    <Zap className="w-3 h-3" /> LE PLUS RAPIDE
                  </span>
                )}
              </div>

              {/* Pricing Header */}
              <div className="p-8 text-center border-b border-gray-50 bg-gradient-to-b from-gray-50/50 to-white rounded-t-3xl space-y-4">

                {/* Price */}
                <div>
                  <div className="flex items-start justify-center gap-1">
                    <span className="text-4xl font-black text-gray-900 tracking-tight">
                      {offer.total_price.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-gray-500 mt-2">
                      {offer.currency}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1">
                    Prix Total Estimé
                  </div>
                </div>

                {/* Forwarder Identity */}
                <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-left">
                  <ForwarderLogo />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900 truncate text-sm">
                        {offer.forwarder?.company_name || offer.forwarder?.full_name || "Prestataire"}
                      </h4>
                      {offer.forwarder?.kyc_status === 'verified' && (
                        <div className="text-blue-500 cursor-help" title="Identité Vérifiée">
                          <CheckCircle className="w-3.5 h-3.5 fill-blue-500 text-white" />
                        </div>
                      )}
                    </div>
                    <StarRating rating={offer.forwarder?.rating || 0} size="sm" />
                    <span className="font-medium">{offer.forwarder?.rating?.toFixed(1) || "N/A"}</span> • <span className="text-gray-400">{offer.forwarder?.review_count || 0} avis</span>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-8 flex-1 flex flex-col gap-6">

                {/* Key Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50 flex flex-col items-center justify-center text-center">
                    <div className="text-blue-600 mb-1"><Clock className="w-5 h-5" /></div>
                    <span className="text-lg font-bold text-gray-900 leading-none">{offer.estimated_transit_days}j</span>
                    <span className="text-[10px] uppercase font-bold text-blue-400 mt-1">Transit</span>
                  </div>
                  <div className="bg-purple-50/50 p-3 rounded-2xl border border-purple-100/50 flex flex-col items-center justify-center text-center">
                    <div className="text-purple-600 mb-1"><CalendarIcon className="w-5 h-5" /></div>
                    <span className="text-lg font-bold text-gray-900 leading-none">{offer.validity_days}j</span>
                    <span className="text-[10px] uppercase font-bold text-purple-400 mt-1">Validité</span>
                  </div>
                </div>

                {/* Services List */}
                <div className="space-y-3 pl-1">
                  <div className="flex items-center justify-between text-sm group/item">
                    <span className="text-gray-600 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover/item:bg-primary/10 group-hover/item:text-primary transition-colors">
                        <Anchor className="w-3.5 h-3.5" />
                      </div>
                      Fret de base
                    </span>
                    <span className="font-bold text-gray-900">
                      {offer.base_price.toLocaleString()} <span className="text-[10px] text-gray-400">{offer.currency}</span>
                    </span>
                  </div>

                  {offer.insurance_price > 0 ? (
                    <div className="flex items-center justify-between text-sm group/item">
                      <span className="text-gray-600 flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                        Assurance
                      </span>
                      <span className="font-bold text-gray-900">Inclus</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-sm opacity-50">
                      <span className="text-gray-500 flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                        <span className="line-through decoration-gray-300">Assurance</span>
                      </span>
                      <span className="text-xs text-gray-400">-</span>
                    </div>
                  )}

                  {(offer.packaging_price > 0 || offer.storage_price > 0) && (
                    <div className="flex items-center justify-between text-sm group/item">
                      <span className="text-gray-600 flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                          <Box className="w-3.5 h-3.5" />
                        </div>
                        Services+
                      </span>
                      <span className="font-bold text-gray-900">
                        {((offer.packaging_price || 0) + (offer.storage_price || 0)).toLocaleString()} <span className="text-[10px] text-gray-400">{offer.currency}</span>
                      </span>
                    </div>
                  )}
                </div>

                {offer.message_to_client && (
                  <div className="bg-gray-50 rounded-xl p-4 text-xs text-gray-600 italic border border-gray-100 leading-relaxed relative">
                    <span className="absolute top-2 left-2 text-gray-300 text-xl font-serif">"</span>
                    <span className="relative z-10 pl-2">{offer.message_to_client}</span>
                  </div>
                )}
              </div>

              {/* Footer Action */}
              <div className="p-8 pt-0 mt-auto">
                {offer.status === "accepted" ? (
                  <div className="w-full py-4 bg-green-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/20">
                    <CheckCircle className="w-5 h-5" />
                    OFFRE ACCEPTÉE
                  </div>
                ) : offer.status === "rejected" ? (
                  <div className="w-full py-4 bg-gray-100 text-gray-400 rounded-2xl font-bold flex items-center justify-center gap-2">
                    OFFRE REJETÉE
                  </div>
                ) : (
                  <button
                    onClick={() => onAccept(offer.id)}
                    disabled={!!processingId}
                    className="w-full py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                  >
                    {processingId === offer.id ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>Choisir cette offre</>
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
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
