import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import RFQDetailsModal from "../../../components/admin/RFQDetailsModal";
import QuoteDetailsModal from "../../../components/admin/QuoteDetailsModal";
import {
  FileText,
  Search,
  Filter,
  Calendar,
  X,
  TrendingUp,
  Clock,
  CheckCircle,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { rfqService } from "../../../services/rfqService";

export default function AdminRFQList() {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [timeRange, setTimeRange] = useState<
    "7d" | "30d" | "3m" | "1y" | "all" | "custom"
  >("30d");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredRFQs, setFilteredRFQs] = useState<any[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedRFQ, setSelectedRFQ] = useState<any>(null);
  const [showQuoteForRFQ, setShowQuoteForRFQ] = useState<string | null>(null);

  // Stats State
  const [stats, setStats] = useState({
    total: { value: 0, trend: "+0%", trendUp: true },
    pending: { value: 0, trend: "+0%", trendUp: true },
    completed: { value: 0, trend: "+0%", trendUp: true },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await rfqService.getAllRFQs();

      // Format data for display
      const formattedRFQs = data.map((rfq: any) => ({
        id: rfq.id,
        client:
          rfq.client?.company_name || rfq.client?.full_name || "Client Inconnu",
        destination: `${rfq.destination_port || ""}`,
        origin: `${rfq.origin_port || ""}`,
        status:
          rfq.status === "published"
            ? "Open"
            : rfq.status === "offers_received"
              ? "Pending Quote"
              : rfq.status === "offer_accepted"
                ? "Completed"
                : rfq.status,
        created_at: rfq.created_at,
        items: rfq.quantity || 1,
      }));

      setRfqs(formattedRFQs);
      setFilteredRFQs(formattedRFQs);
    } catch (error) {
      console.error("Error fetching RFQs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Apply Filters
  useEffect(() => {
    let result = [...rfqs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.id.toLowerCase().includes(query) ||
          r.client.toLowerCase().includes(query) ||
          r.destination.toLowerCase().includes(query),
      );
    }

    if (statusFilter !== "all") {
      // Map UI status to API status if needed, or just match
      result = result.filter((r) => r.status === statusFilter);
    }

    // Time range filtering
    if (timeRange !== "all") {
      const now = new Date();
      let limitDate = new Date();

      if (timeRange === "7d") limitDate.setDate(now.getDate() - 7);
      else if (timeRange === "30d") limitDate.setDate(now.getDate() - 30);
      else if (timeRange === "3m") limitDate.setMonth(now.getMonth() - 3);
      else if (timeRange === "1y") limitDate.setFullYear(now.getFullYear() - 1);

      if (timeRange !== "custom") {
        result = result.filter((r) => new Date(r.created_at) >= limitDate);
      }
    }

    setFilteredRFQs(result);

    // Update Stats
    setStats({
      total: {
        value: result.length,
        trend: "+0%",
        trendUp: true,
      },
      pending: {
        value: result.filter((r) => r.status === "Pending Quote").length,
        trend: "+0%",
        trendUp: true,
      },
      completed: {
        value: result.filter((r) => r.status === "Completed").length,
        trend: "+0%",
        trendUp: true,
      },
    });
  }, [searchQuery, timeRange, customDateRange, statusFilter, rfqs]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des RFQ"
        subtitle="Vue d'ensemble de toutes les demandes de devis"
      />

      {/* Unified Filter Segment */}
      <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
        {/* Time Range Segmented Control */}
        <div className="flex bg-gray-50 rounded-xl p-1">
          {[
            { id: "7d", label: "7J" },
            { id: "30d", label: "30J" },
            { id: "3m", label: "3M" },
            { id: "1y", label: "1A" },
            { id: "all", label: "Tout" },
            { id: "custom", icon: Calendar },
          ].map((period) => (
            <button
              key={period.id}
              onClick={() => setTimeRange(period.id as any)}
              className={`
                                px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                                ${
                                  timeRange === period.id
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                }
                            `}
              title={
                period.id === "custom" ? "Période personnalisée" : undefined
              }
            >
              {period.icon ? <period.icon className="w-4 h-4" /> : period.label}
            </button>
          ))}
        </div>

        {/* Status Filter Dropdown */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2 bg-gray-50 border border-transparent hover:bg-white hover:border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="all">Tous les statuts</option>
            <option value="Open">Ouvert</option>
            <option value="Pending Quote">En attente</option>
            <option value="Completed">Terminé</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Custom Date Inputs */}
        {timeRange === "custom" && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-200 bg-gray-50 p-1 rounded-xl">
            <input
              type="date"
              value={customDateRange.start}
              onChange={(e) =>
                setCustomDateRange({
                  ...customDateRange,
                  start: e.target.value,
                })
              }
              className="pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-28"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={customDateRange.end}
              onChange={(e) =>
                setCustomDateRange({ ...customDateRange, end: e.target.value })
              }
              className="pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-28"
            />
          </div>
        )}

        <div className="w-px bg-gray-100 hidden sm:block mx-1 h-8"></div>

        {/* Search */}
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par ID, client..."
            className="w-full pl-9 pr-8 py-2 bg-transparent hover:bg-gray-50 focus:bg-white border border-transparent focus:border-primary/20 rounded-xl text-sm focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.total.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
            >
              {stats.total.trendUp ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}{" "}
              {stats.total.trend}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Total RFQs</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.total.value}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
              <Clock className="w-6 h-6" />
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.pending.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
            >
              {stats.pending.trendUp ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}{" "}
              {stats.pending.trend}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">
            En Attente de Devis
          </h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.pending.value}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.completed.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
            >
              {stats.completed.trendUp ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}{" "}
              {stats.completed.trend}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Terminées</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.completed.value}
          </p>
        </div>
      </div>

      {/* RFQ List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID RFQ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Route
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRFQs.map((rfq) => (
              <tr key={rfq.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-primary">
                    {rfq.id}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {rfq.client}
                  </div>
                  <div className="text-xs text-gray-500">
                    {rfq.items} articles
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{rfq.origin.split(",")[0]}</span>
                    <span className="text-gray-400">→</span>
                    <span>{rfq.destination.split(",")[0]}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${
                                          rfq.status === "Open"
                                            ? "bg-blue-100 text-blue-800"
                                            : rfq.status === "Pending Quote"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-green-100 text-green-800"
                                        }`}
                  >
                    {rfq.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(rfq.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActiveMenu(activeMenu === rfq.id ? null : rfq.id)
                      }
                      className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {activeMenu === rfq.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setActiveMenu(null)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 animate-in fade-in zoom-in duration-200">
                          <button
                            onClick={() => {
                              setSelectedRFQ(rfq);
                              setActiveMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4" /> Voir détails
                          </button>
                          <button
                            onClick={() => {
                              if (confirm("Supprimer cette RFQ ?")) {
                                setFilteredRFQs(
                                  filteredRFQs.filter((r) => r.id !== rfq.id),
                                );
                              }
                              setActiveMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <X className="w-4 h-4" /> Supprimer
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredRFQs.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="p-4 bg-gray-50 rounded-full mb-3">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p>Aucune RFQ trouvée</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedRFQ && (
        <RFQDetailsModal
          rfq={selectedRFQ}
          onClose={() => setSelectedRFQ(null)}
          onViewQuote={() => {
            setShowQuoteForRFQ(selectedRFQ.id);
            setSelectedRFQ(null);
          }}
        />
      )}

      {showQuoteForRFQ && (
        <QuoteDetailsModal
          rfqId={showQuoteForRFQ}
          onClose={() => setShowQuoteForRFQ(null)}
        />
      )}
    </div>
  );
}
