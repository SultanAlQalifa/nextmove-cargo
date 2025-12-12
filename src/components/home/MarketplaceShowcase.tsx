import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Ship,
  Plane,
  ArrowRight,
  Calendar,
  MapPin,
  Box,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { consolidationService } from "../../services/consolidationService";
import { Consolidation } from "../../types/consolidation";

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
    <div className="py-24 bg-white dark:bg-gray-900 border-t border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-sm mb-4">
            {t("marketplace.title")}
          </h2>
          <p className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
            {t("marketplace.heroTitle")}
          </p>
          <p className="max-w-2xl text-xl text-slate-500 dark:text-slate-400 mx-auto leading-relaxed font-light mb-10">
            {t("marketplace.heroSubtitle")}
          </p>

          {/* Filter Tabs */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {[
              { id: "all", label: t("marketplace.tabs.all") },
              { id: "groupage", label: t("marketplace.tabs.groupage") },
              { id: "expedition", label: t("marketplace.tabs.expedition") },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredOffers.map((offer) => {
            // Determine display style based on active tab or offer properties
            // For this demo: If tab is 'expedition', force Expedition style.
            // If tab is 'groupage', force Groupage style.
            // If 'all', use a heuristic (e.g. sea=groupage, air=expedition for variety, or just default to Groupage)

            const isExpeditionView =
              activeTab === "expedition" ||
              (activeTab === "all" && offer.transport_mode === "air");
            const isGroupageView = !isExpeditionView;

            const priceUnit = offer.transport_mode === "sea" ? "/ CBM" : "/ kg";
            const priceValue =
              offer.transport_mode === "sea"
                ? offer.price_per_cbm
                : offer.price_per_kg;
            const formattedPrice = priceValue
              ? `${priceValue.toLocaleString()} ${offer.currency} ${priceUnit}`
              : "Sur devis";

            // Calculate duration
            const duration =
              offer.departure_date && offer.arrival_date
                ? Math.ceil(
                    (new Date(offer.departure_date).getTime() -
                      new Date(offer.arrival_date).getTime()) /
                      (1000 * 60 * 60 * 24),
                  )
                : null;

            return (
              <div
                key={offer.id}
                className={`group relative rounded-[2.5rem] p-8 transition-all duration-500 hover:-translate-y-2 overflow-hidden flex flex-col h-full ${
                  isGroupageView
                    ? "bg-slate-900 text-slate-200 shadow-2xl shadow-emerald-900/20 hover:shadow-emerald-900/40 border border-slate-800"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-xl shadow-blue-200/50 dark:shadow-none hover:shadow-2xl hover:shadow-blue-500/20 border border-slate-100 dark:border-slate-700"
                }`}
              >
                {/* Soft Ambient Glows */}
                {isGroupageView ? (
                  <>
                    <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] -ml-10 -mb-10 pointer-events-none"></div>
                  </>
                ) : (
                  <>
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] -ml-10 -mb-10 pointer-events-none"></div>
                  </>
                )}

                {/* Header: Route & Price */}
                <div className="relative z-10 flex flex-col gap-6 mb-8">
                  <div className="flex justify-between items-start">
                    {/* Transport Mode Icon & Label */}
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform duration-500 ${
                          isGroupageView
                            ? "bg-gradient-to-br from-blue-500 to-emerald-500 text-white shadow-emerald-500/25"
                            : "bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-blue-500/25"
                        }`}
                      >
                        {offer.transport_mode === "sea" ? (
                          <Ship className="w-7 h-7" />
                        ) : (
                          <Plane className="w-7 h-7" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`text-xs font-bold uppercase tracking-wider ${isGroupageView ? "text-slate-400" : "text-slate-500"}`}
                        >
                          {offer.transport_mode === "sea"
                            ? t("calculator.sea.label")
                            : t("calculator.air.label")}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full w-fit mt-1 ${
                            isGroupageView
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-blue-100 text-blue-600"
                          }`}
                        >
                          Standard
                        </span>
                      </div>
                    </div>

                    {/* Prominent Price Tag */}
                    <div className={`flex flex-col items-end`}>
                      <span
                        className={`text-xs font-bold uppercase tracking-wider mb-1 ${
                          isGroupageView ? "text-slate-400" : "text-slate-400"
                        }`}
                      >
                        {t("marketplace.officialRate")}
                      </span>
                      <div
                        className={`px-4 py-2 rounded-xl text-lg font-bold border backdrop-blur-md ${
                          isGroupageView
                            ? "bg-white/5 text-emerald-400 border-emerald-500/30"
                            : "bg-blue-50 text-blue-700 border-blue-100"
                        }`}
                      >
                        {formattedPrice}
                      </div>
                    </div>
                  </div>

                  {/* Route Title */}
                  <div>
                    <div
                      className={`text-xs font-bold uppercase tracking-widest mb-2 ${
                        isGroupageView
                          ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400"
                          : "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500"
                      }`}
                    >
                      {isGroupageView
                        ? t("marketplace.offerGroupage")
                        : t("marketplace.offerExpedition")}
                    </div>
                    <h3
                      className={`text-xl font-bold leading-tight ${
                        isGroupageView ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {offer.origin_port}{" "}
                      <span className="text-slate-400 mx-1">→</span>{" "}
                      {offer.destination_port}
                    </h3>
                  </div>
                </div>

                {/* Detailed Timeline */}
                <div
                  className={`relative z-10 mb-8 p-5 rounded-3xl border ${
                    isGroupageView
                      ? "bg-slate-800/40 border-slate-700/50"
                      : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <div className="flex items-center justify-between text-center relative">
                    {/* Departure */}
                    <div className="flex flex-col items-center z-10">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isGroupageView ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {t("marketplace.departure")}
                      </span>
                      <span
                        className={`text-sm font-bold ${isGroupageView ? "text-white" : "text-slate-900"}`}
                      >
                        {offer.departure_date
                          ? format(new Date(offer.departure_date), "dd MMM")
                          : "--"}
                      </span>
                    </div>

                    {/* Duration Line */}
                    <div className="flex-1 px-4 flex flex-col items-center relative -mt-1">
                      <span
                        className={`text-[10px] font-medium mb-1 ${isGroupageView ? "text-emerald-400" : "text-blue-500"}`}
                      >
                        {duration
                          ? `${duration} ${t("calculator.days")}`
                          : "Direct"}
                      </span>
                      <div className="w-full h-px bg-slate-300 dark:bg-slate-700 relative">
                        <div
                          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                            isGroupageView ? "bg-emerald-500" : "bg-blue-500"
                          }`}
                        ></div>
                      </div>
                    </div>

                    {/* Arrival */}
                    <div className="flex flex-col items-center z-10">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isGroupageView ? "text-slate-500" : "text-slate-400"}`}
                      >
                        {t("marketplace.arrival")}
                      </span>
                      <span
                        className={`text-sm font-bold ${isGroupageView ? "text-white" : "text-slate-900"}`}
                      >
                        {offer.arrival_date
                          ? format(new Date(offer.arrival_date), "dd MMM")
                          : "--"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Capacity & Progress (Only for Groupage) */}
                {isGroupageView && (
                  <div className="relative z-10 flex-grow">
                    <div className="flex justify-between items-end mb-4">
                      <div className="w-full">
                        <div className="flex justify-between mb-2.5">
                          <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            {t("marketplace.availability")}
                          </span>
                          <span className="text-sm font-bold text-white">
                            {offer.transport_mode === "sea"
                              ? Math.max(
                                  0,
                                  (offer.total_capacity_cbm || 0) -
                                    (offer.current_load_cbm || 0),
                                )
                              : Math.max(
                                  0,
                                  (offer.total_capacity_kg || 0) -
                                    (offer.current_load_kg || 0),
                                )}
                            <span className="text-xs font-normal ml-1 text-slate-400">
                              {offer.transport_mode === "sea" ? "CBM" : "KG"}
                            </span>
                          </span>
                        </div>

                        <div className="h-2 w-full rounded-full overflow-hidden bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                            style={{
                              width:
                                offer.transport_mode === "sea"
                                  ? `${Math.min(((offer.current_load_cbm || 0) / (offer.total_capacity_cbm || 1)) * 100, 100)}%`
                                  : `${Math.min(((offer.current_load_kg || 0) / (offer.total_capacity_kg || 1)) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div
                  className={`mt-6 pt-6 border-t border-dashed ${isGroupageView ? "border-slate-800" : "border-slate-200"}`}
                >
                  {isGroupageView ? (
                    <Link
                      to="/register"
                      className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 transform group-hover:scale-[1.02] bg-white text-slate-900 hover:bg-emerald-50"
                    >
                      {t("marketplace.bookNow")}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <Link
                      to={`/calculator?forwarder=${offer.initiator_id}&origin=${encodeURIComponent(offer.origin_port)}&destination=${encodeURIComponent(offer.destination_port)}&mode=${offer.transport_mode}&type=standard`}
                      className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 transform group-hover:scale-[1.02] bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-lg hover:shadow-blue-500/30"
                    >
                      {t("marketplace.requestQuote")}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold hover:gap-3 transition-all"
          >
            {t("marketplace.viewAll")} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
