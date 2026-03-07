import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Ship,
  Plane,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { consolidationService } from "../../services/consolidationService";
import { Consolidation } from "../../types/consolidation";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
    },
  },
};

export default function MarketplaceShowcase() {
  const { t } = useTranslation();
  const [offers, setOffers] = useState<Consolidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "groupage" | "expedition">(
    "all",
  );

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        // Fetch both types of open consolidations
        const data = await consolidationService.getConsolidations({
          status: "open",
        });
        // Take the first 9 items
        setOffers(data.slice(0, 9));
      } catch (error) {
        console.error("Error fetching marketplace offers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, []);

  const filteredOffers = offers.filter((offer) => {
    if (activeTab === "all") return true;
    if (activeTab === "groupage") return offer.type === "forwarder_offer";
    if (activeTab === "expedition") return offer.type === "client_request";
    return true;
  });

  if (loading) {
    return (
      <div className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (offers.length === 0) {
    return null;
  }

  return (
    <div className="py-32 bg-slate-50 dark:bg-slate-950 relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none animate-mesh"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-[140px] pointer-events-none animate-mesh"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-[10px] tracking-[0.3em] uppercase mb-8">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            Opportunités en Temps Réel
          </div>

          <h2 className="text-6xl lg:text-[8rem] font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-[0.85]">
            Marketplace. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-400">Live Ops.</span>
          </h2>

          <p className="max-w-3xl text-xl text-slate-500 dark:text-slate-400 mx-auto leading-relaxed font-light mb-12">
            Instant fulfillment opportunities. Access backhaul rates and urgent shipping requests in real-time.
          </p>

          <div className="inline-flex p-2 bg-slate-200/50 dark:bg-white/5 backdrop-blur-3xl rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-md dark:shadow-2xl">
            {[
              { id: "all", label: "Overview" },
              { id: "groupage", label: "Consolidations" },
              { id: "expedition", label: "Requests" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative px-10 py-4 rounded-2xl text-sm font-black tracking-tight transition-all duration-500 ${activeTab === tab.id
                  ? "text-white"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
              >
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabMarket"
                    className="absolute inset-0 bg-indigo-600 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)] -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-10"
        >
          <AnimatePresence mode="popLayout">
            {filteredOffers.map((offer) => {
              const isExpeditionView =
                activeTab === "expedition" ||
                (activeTab === "all" && offer.transport_mode === "air");
              const isGroupageView = !isExpeditionView;

              const priceUnit = offer.transport_mode === "sea" ? "/ CBM" : "/ kg";
              const priceValue =
                offer.transport_mode === "sea"
                  ? offer.price_per_cbm
                  : offer.price_per_kg;
              const duration =
                offer.departure_date && offer.arrival_date
                  ? Math.ceil(
                    (new Date(offer.arrival_date).getTime() -
                      new Date(offer.departure_date).getTime()) /
                    (1000 * 60 * 60 * 24),
                  )
                  : null;

              return (
                <motion.div
                  key={offer.id}
                  layout
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  className="group relative h-full"
                >
                  <div className="relative h-full bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-white/5 rounded-[3rem] p-10 flex flex-col shadow-lg dark:shadow-2xl overflow-hidden box-border">
                    {/* Interior Glows */}
                    <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] -mr-20 -mt-20 opacity-10 pointer-events-none ${isGroupageView ? 'bg-cyan-500' : 'bg-indigo-500'}`}></div>

                    {/* Header: Mode & Status */}
                    <div className="relative z-10 flex justify-between items-start mb-10">
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl relative ${isGroupageView ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/10' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10'}`}>
                          {offer.transport_mode === "sea" ? (
                            <Ship className="w-8 h-8" />
                          ) : (
                            <Plane className="w-8 h-8" />
                          )}
                        </div>
                        <div>
                          <div className="text-slate-800 dark:text-slate-100 font-black text-lg tracking-tight">
                            {offer.transport_mode === "sea" ? "Maritime" : "Aérien"}
                          </div>
                          <div className={`text-[9px] font-black uppercase tracking-widest mt-1 px-2 py-0.5 rounded-md border ${isGroupageView ? 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5' : 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5'}`}>
                            {isGroupageView ? "Consolidation" : "Urgent Request"}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Tarif Estimé</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                          {priceValue ? `${priceValue.toLocaleString()}` : "Sur devis"}
                          {priceValue && <span className="text-xs font-medium text-slate-500 ml-1">{offer.currency} {priceUnit}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Content: Route */}
                    <div className="relative z-10 mb-10">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white dark:border-[#0B1224] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                          <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{offer.origin_port}</span>
                        </div>
                        <div className="w-px h-6 ml-1.5 bg-gradient-to-b from-blue-500 to-emerald-500/0"></div>
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0B1224] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                          <span className="text-slate-900 dark:text-white text-lg font-bold">{offer.destination_port}</span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline & Durée */}
                    <div className="relative z-10 p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 backdrop-blur-xl mb-10">
                      <div className="flex justify-between items-center relative">
                        <div className="text-center">
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">{t("marketplace.departure")}</div>
                          <div className="text-sm font-bold text-slate-800 dark:text-white">
                            {offer.departure_date ? format(new Date(offer.departure_date), "dd MMM") : "--"}
                          </div>
                        </div>

                        <div className="flex-1 px-8 relative">
                          <div className="h-px bg-gradient-to-r from-blue-500/20 via-blue-500 to-emerald-500/20 w-full relative">
                            <motion.div
                              animate={{ x: [0, 20, 0] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                            >
                              <div className={`w-2 h-2 rounded-full ${isGroupageView ? 'bg-emerald-400' : 'bg-blue-400'} shadow-[0_0_10px_rgba(59,130,246,0.5)]`}></div>
                            </motion.div>
                          </div>
                          <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-400">
                            {duration ? `${duration} jours` : t("marketplace.availability")}
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mb-1">{t("marketplace.arrival")}</div>
                          <div className="text-sm font-bold text-slate-800 dark:text-white">
                            {offer.arrival_date ? format(new Date(offer.arrival_date), "dd MMM") : "--"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="relative z-10 mt-auto pt-6">
                      <Link
                        to="/register"
                        className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${isGroupageView
                          ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-emerald-500/20'
                          : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:shadow-blue-500/40 shadow-blue-500/20'
                          }`}
                      >
                        {isGroupageView ? "Réserver cet Emplacement" : "Faire une Offre"}
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        <div className="mt-20 text-center">
          <Link
            to="/register"
            className="group inline-flex items-center gap-4 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 px-10 py-5 rounded-3xl border border-slate-200 dark:border-white/10 transition-all duration-300 backdrop-blur-xl"
          >
            <span className="text-slate-800 dark:text-white font-bold tracking-tight">{t("marketplace.viewAll")}</span>
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white group-hover:translate-x-2 transition-transform duration-300">
              <ArrowRight className="w-5 h-5" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
