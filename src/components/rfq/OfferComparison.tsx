import { OfferWithForwarder } from "../../types/rfq";
import {
  CheckCircle,
  Clock,
  Award,
  Zap,
  Shield,
  Box,
  Anchor,
  Building,
  Sparkles
} from "lucide-react";
import StarRating from "../common/StarRating";
import { motion } from "framer-motion";

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

  // AI Best Offer (Combinaison Prix / Temps)
  // Pénalité arbitraire pour le calcul : + 25 000 FCFA par jour de transit
  const aiBestOffer = [...offers].sort(
    (a, b) => (a.total_price + (a.estimated_transit_days * 25000)) - (b.total_price + (b.estimated_transit_days * 25000))
  )[0];

  return (
    <div className="overflow-x-auto pb-8 pt-4">
      <div className="flex gap-6 min-w-max px-2 items-stretch">
        {offers.map((offer) => {
          const isBestPrice = offer.id === bestPriceOffer.id;
          const isFastest = offer.id === fastestOffer.id;
          const isAiBest = offer.id === aiBestOffer.id;
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
                 relative w-[340px] glass-card-premium dark:bg-slate-900/60 rounded-[2.5rem] transition-all duration-500 flex flex-col group
                 ${isAiBest ? "border-transparent" : "border border-gray-100 dark:border-white/10 shadow-xl dark:shadow-none hover:shadow-primary/10 hover:-translate-y-2"}
                 ${isAccepted ? "ring-2 ring-green-500 shadow-2xl shadow-green-500/20 scale-[1.02] z-10" : ""}
                 ${offer.status === "rejected" ? "opacity-40 grayscale" : ""}
              `}
            >
              {/* IA Best Offer Animated Border */}
              {isAiBest && !isAccepted && (
                <div className="absolute inset-x-0 inset-y-0 rounded-[2.5rem] bg-gradient-to-r from-amber-300 via-orange-500 to-amber-300 p-[2px] z-[-1] opacity-70 group-hover:opacity-100 transition-opacity animate-gradient-xy">
                  <div className="absolute inset-0 bg-white dark:bg-slate-900 rounded-[2.5rem] z-[-1]"></div>
                </div>
              )}
              {/* Specialized Badges */}
              <div className="absolute -top-4 inset-x-0 flex justify-center gap-2 pointer-events-none z-20">
                {isAiBest && (
                  <motion.div
                    initial={{ y: 5, opacity: 0, scale: 0.9 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[11px] tracking-widest font-black px-5 py-2.5 rounded-full shadow-[0_8px_20px_rgba(245,158,11,0.4)] flex items-center gap-2 border border-white/40 ring-2 ring-amber-300/30 relative overflow-hidden group-hover:scale-105 transition-transform"
                  >
                    {/* Sparkle Particles effect could go here */}
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
                      <Sparkles className="w-4 h-4 text-amber-100 fill-amber-100" />
                    </motion.div>
                    RECOMMANDATION IA
                  </motion.div>
                )}
                {!isAiBest && isBestPrice && (
                  <motion.span
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[10px] tracking-widest font-black px-4 py-2 rounded-full shadow-[0_8px_20px_rgba(16,185,129,0.3)] flex items-center gap-2 border border-white/30"
                  >
                    <Award className="w-3.5 h-3.5" /> MEILLEUR PRIX
                  </motion.span>
                )}
                {!isAiBest && isFastest && (
                  <motion.span
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] tracking-widest font-black px-4 py-2 rounded-full shadow-[0_8px_20px_rgba(37,99,235,0.3)] flex items-center gap-2 border border-white/30"
                  >
                    <Zap className="w-3.5 h-3.5" /> LE PLUS RAPIDE
                  </motion.span>
                )}
              </div>

              {/* Ambient Glow */}
              <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full pointer-events-none -mr-10 -mt-10 opacity-20 ${isAiBest ? 'bg-amber-400' : isBestPrice ? 'bg-emerald-500' : isFastest ? 'bg-blue-500' : 'bg-gray-400'}`}></div>

              {/* Pricing Header */}
              <div className="p-8 text-center border-b border-gray-100/50 dark:border-white/5 rounded-t-3xl space-y-5 relative overflow-hidden">
                {/* Price */}
                <div className="relative z-10">
                  <div className="flex items-start justify-center gap-1">
                    <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                      {offer.total_price.toLocaleString()}
                    </span>
                    <span className="text-sm font-bold text-slate-400 mt-2">
                      {offer.currency}
                    </span>
                  </div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
                    Cotation Finale Tout Inclus
                  </div>
                </div>

                {/* Forwarder Identity */}
                <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-4 rounded-2xl border border-white/50 dark:border-white/5 shadow-sm text-left group-hover:bg-white transition-colors duration-500">
                  <ForwarderLogo />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-slate-900 dark:text-white truncate text-sm tracking-tight">
                        {offer.forwarder?.company_name || offer.forwarder?.full_name || "Prestataire"}
                      </h4>
                      {offer.forwarder?.kyc_status === 'verified' && (
                        <div className="text-blue-500 flex items-center" title="Identité Vérifiée">
                          <CheckCircle className="w-4 h-4 fill-blue-500 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <StarRating rating={offer.forwarder?.rating || 0} size="sm" />
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">{offer.forwarder?.rating?.toFixed(1) || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-8 flex-1 flex flex-col gap-8 relative z-10">

                {/* Key Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-500/5 dark:bg-blue-500/10 p-4 rounded-3xl border border-blue-500/10 flex flex-col items-center justify-center text-center group-hover:bg-blue-500/10 transition-colors">
                    <div className="text-blue-600 dark:text-blue-400 mb-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm"><Clock className="w-5 h-5" /></div>
                    <span className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{offer.estimated_transit_days}j</span>
                    <span className="text-[9px] uppercase font-black text-blue-500 dark:text-blue-400 mt-2 tracking-widest">Temps Transit</span>
                  </div>
                  <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-4 rounded-3xl border border-emerald-500/10 flex flex-col items-center justify-center text-center group-hover:bg-emerald-500/10 transition-colors">
                    <div className="text-emerald-600 dark:text-emerald-400 mb-2 p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm"><CalendarIcon className="w-5 h-5" /></div>
                    <span className="text-xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{offer.validity_days}j</span>
                    <span className="text-[9px] uppercase font-black text-emerald-500 dark:text-emerald-400 mt-2 tracking-widest">Validité Devis</span>
                  </div>
                </div>

                {/* Services Checklist */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400 px-1">
                    <span>Services Inclus</span>
                    <span className="w-10 h-px bg-slate-200 dark:bg-slate-700"></span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm group/item">
                      <span className="text-slate-600 dark:text-slate-300 flex items-center gap-3 font-medium">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover/item:bg-blue-100 group-hover/item:text-blue-600 transition-all duration-300">
                          <Anchor className="w-3.5 h-3.5" />
                        </div>
                        Base Freight
                      </span>
                      <span className="font-black text-slate-900 dark:text-white">
                        {offer.base_price.toLocaleString()} <span className="text-[10px] text-slate-400">{offer.currency}</span>
                      </span>
                    </div>

                    <div className={`flex items-center justify-between text-sm transition-opacity duration-300 ${offer.insurance_price > 0 ? 'opacity-100' : 'opacity-40'}`}>
                      <span className="text-slate-600 dark:text-slate-300 flex items-center gap-3 font-medium">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${offer.insurance_price > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                        Assurance Cargo
                      </span>
                      <span className={`font-black ${offer.insurance_price > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {offer.insurance_price > 0 ? 'Inclus' : '--'}
                      </span>
                    </div>

                    {(offer.packaging_price > 0 || offer.storage_price > 0) && (
                      <div className="flex items-center justify-between text-sm group/item">
                        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-3 font-medium">
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                            <Box className="w-3.5 h-3.5" />
                          </div>
                          Packing / Stockage
                        </span>
                        <span className="font-black text-slate-900 dark:text-white">
                          {((offer.packaging_price || 0) + (offer.storage_price || 0)).toLocaleString()} <span className="text-[10px] text-slate-400">{offer.currency}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {offer.message_to_client && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 rounded-[1.5rem] p-5 text-xs text-slate-600 dark:text-slate-400 italic border border-slate-100 dark:border-white/5 leading-relaxed relative group-hover:border-primary/20 transition-colors">
                    <span className="absolute -top-2 left-4 px-2 bg-white dark:bg-slate-900 text-blue-500 font-black tracking-widest text-[9px]">MESSAGE</span>
                    <span className="relative z-10">{offer.message_to_client}</span>
                  </div>
                )}
              </div>

              {/* Footer Action */}
              <div className="p-8 pt-4 mt-auto">
                {offer.status === "accepted" ? (
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black tracking-widest text-xs flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(16,185,129,0.3)]"
                  >
                    <CheckCircle className="w-5 h-5 fill-white text-emerald-500" />
                    OFFRE ACCEPTÉE
                  </motion.div>
                ) : offer.status === "rejected" ? (
                  <div className="w-full py-5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 rounded-2xl font-black tracking-widest text-xs flex items-center justify-center gap-2">
                    OFFRE REJETÉE
                  </div>
                ) : (
                  <button
                    onClick={() => onAccept(offer.id)}
                    disabled={!!processingId}
                    className="group/btn relative w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black tracking-widest text-xs overflow-hidden transition-all duration-300 hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative z-10 flex items-center justify-center gap-2 font-black">
                      {processingId === offer.id ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>SÉLECTIONNER CETTE OFFRE</>
                      )}
                    </span>
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
