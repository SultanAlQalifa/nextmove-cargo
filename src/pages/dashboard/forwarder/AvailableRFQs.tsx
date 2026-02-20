import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { rfqService } from "../../../services/rfqService";
import type { RFQRequest, RFQFilters } from "../../../types/rfq";
import {
  Search,
  Calendar,
  Ship,
  Plane,
  Truck,
  ArrowRight,
  Clock,
  Eye, // Added Icon
} from "lucide-react";
import { useDataSync } from "../../../contexts/DataSyncContext";
import { motion, AnimatePresence } from "framer-motion";

export default function AvailableRFQs() {
  const navigate = useNavigate();
  useDataSync("rfq_requests", () => loadRFQs());
  useDataSync("rfq_offers", () => loadRFQs());
  const [rfqs, setRfqs] = useState<RFQRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<RFQFilters>({});
  // Add state to track which RFQs the user has already bid on
  const [myRespondedRfqs, setMyRespondedRfqs] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRFQs();
  }, [filters]);

  const loadRFQs = async () => {
    try {
      setLoading(true);
      // Parallel fetch: Available RFQs AND User's existing offers
      const [availableData, myOffersData] = await Promise.all([
        rfqService.getAvailableRFQs(filters),
        rfqService.getMyOffers()
      ]);

      setRfqs(availableData);

      // Create a Set of RFQ IDs that the user has already offered on
      // Using 'any' cast temporarily if type mismatch, but OfferWithRFQ matches
      const respondedIds = new Set(myOffersData.map(offer => offer.rfq_id));
      setMyRespondedRfqs(respondedIds);

    } catch (error) {
      console.error("Error loading RFQs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadRFQs();
  };

  const filteredRfqs = rfqs.filter((rfq) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      rfq.origin_port.toLowerCase().includes(term) ||
      rfq.destination_port.toLowerCase().includes(term) ||
      rfq.cargo_type.toLowerCase().includes(term)
    );
  });

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case "sea":
        return <Ship className="w-5 h-5" />;
      case "air":
        return <Plane className="w-5 h-5" />;
      default:
        return <Truck className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Demandes Disponibles
          </h1>
          <p className="text-gray-500 mt-1">
            Trouvez de nouvelles opportunités et soumettez vos offres.
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-3xl shadow-lg border border-white/50 dark:border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between"
      >
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher (origine, destination, marchandise)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-medium text-slate-900 dark:text-white placeholder-slate-400"
          />
        </form>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button
            onClick={() =>
              setFilters({ ...filters, transport_mode: undefined })
            }
            className={`px-5 py-3 rounded-2xl text-sm font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm ${!filters.transport_mode ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-slate-100/80 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-700"}`}
          >
            Tout
          </button>
          <button
            onClick={() => setFilters({ ...filters, transport_mode: "sea" })}
            className={`px-5 py-3 rounded-2xl text-sm font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm flex items-center gap-2 ${filters.transport_mode === "sea" ? "bg-blue-600 text-white shadow-blue-500/20" : "bg-blue-50/80 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"}`}
          >
            <Ship className="w-4 h-4" /> Maritime
          </button>
          <button
            onClick={() => setFilters({ ...filters, transport_mode: "air" })}
            className={`px-5 py-3 rounded-2xl text-sm font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm flex items-center gap-2 ${filters.transport_mode === "air" ? "bg-sky-600 text-white shadow-sky-500/20" : "bg-sky-50/80 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/20 dark:text-sky-400 dark:hover:bg-sky-900/40"}`}
          >
            <Plane className="w-4 h-4" /> Aérien
          </button>
        </div>
      </motion.div>

      {/* RFQ List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : filteredRfqs.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200 dark:border-white/10"
        >
          <div className="inline-flex p-5 bg-slate-100 dark:bg-slate-800 rounded-3xl mb-4 shadow-inner">
            <Search className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Aucune demande trouvée
          </h3>
          <p className="text-slate-500 font-medium mt-2">
            Essayez de modifier vos filtres ou revenez plus tard pour de nouvelles opportunités.
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
          className="grid grid-cols-1 gap-6"
        >
          {filteredRfqs.map((rfq) => {
            const hasResponded = myRespondedRfqs.has(rfq.id);

            return (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 }
                }}
                whileHover={{ y: -4, scale: 1.005 }}
                key={rfq.id}
                className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 shadow-lg shadow-slate-200/50 dark:shadow-none border border-slate-200/50 dark:border-white/5 transition-all group relative overflow-hidden"
              >
                {/* Subtle Background Glow */}
                <div className={`absolute -right-24 -top-24 w-64 h-64 rounded-full blur-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 ${rfq.transport_mode === 'air' ? 'bg-sky-500' : 'bg-indigo-500'}`}></div>

                <div className="flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center relative z-10">
                  {/* Route & Icon */}
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-3.5 rounded-2xl shadow-inner shrink-0 ${rfq.transport_mode === "air" ? "bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400" : "bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400"}`}
                    >
                      {getTransportIcon(rfq.transport_mode)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        {rfq.origin_port}
                        <ArrowRight className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                        {rfq.destination_port}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          Départ :{" "}
                          <span className="text-slate-700 dark:text-slate-300">
                            {rfq.preferred_departure_date
                              ? new Date(
                                rfq.preferred_departure_date,
                              ).toLocaleDateString()
                              : "Flexible"}
                          </span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          Publié le :{" "}
                          <span className="text-slate-700 dark:text-slate-300">
                            {new Date(rfq.created_at).toLocaleDateString()}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cargo Details */}
                  <div className="flex-1 grid grid-cols-2 gap-4 lg:border-l lg:border-r border-slate-100 dark:border-white/5 lg:px-6 w-full lg:w-auto">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                        Marchandise
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {rfq.cargo_type}
                      </p>
                      <p className="text-xs font-bold text-slate-500 mt-0.5">
                        {rfq.quantity} unité(s)
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10">
                      <p className="text-[10px] font-black text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-widest mb-1.5">
                        Budget Cible
                      </p>
                      {rfq.budget_amount ? (
                        <p className="font-black text-lg text-emerald-700 dark:text-emerald-400 tracking-tight">
                          {rfq.budget_amount.toLocaleString()}{" "}
                          <span className="text-sm">{rfq.budget_currency}</span>
                        </p>
                      ) : (
                        <p className="text-sm font-bold text-emerald-600/50 dark:text-emerald-400/50 italic mt-1 relative top-1">
                          Non spécifié
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="w-full lg:w-auto flex justify-end">
                    {hasResponded ? (
                      <button
                        onClick={() => navigate("/dashboard/forwarder/offers")}
                        className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-2 border-emerald-500/20 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-50 dark:hover:bg-emerald-500/20 transition-all shadow-sm"
                      >
                        <Eye className="w-4 h-4" />
                        Voir mon offre
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          navigate(`/dashboard/forwarder/rfq/${rfq.id}/offer`)
                        }
                        className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5"
                      >
                        Faire une offre
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
