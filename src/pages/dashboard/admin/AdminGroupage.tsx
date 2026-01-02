import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageHeader from "../../../components/common/PageHeader";
import { consolidationService } from "../../../services/consolidationService";
import { Consolidation } from "../../../types/consolidation";
import {
  AlertCircle,
  Filter,
  Search,
  Package,
  ArrowUpRight,
  CheckCircle,
  Anchor,
  Plane,
  MoreVertical,
} from "lucide-react";

import AssignForwarderModal from "../../../components/admin/AssignForwarderModal";
import { useToast } from "../../../contexts/ToastContext";

export default function AdminGroupage() {
  const [consolidations, setConsolidations] = useState<(Consolidation & { linked_shipment_forwarder_id?: string | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  // Assign Modal State
  const [assignModal, setAssignModal] = useState<{
    isOpen: boolean;
    consolidation: (Consolidation & { linked_shipment_forwarder_id?: string | null }) | null;
  }>({ isOpen: false, consolidation: null });

  // Filter State
  const [timeRange, setTimeRange] = useState<
    "7d" | "30d" | "3m" | "1y" | "all" | "custom"
  >("30d");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Stats State
  const [stats, setStats] = useState({
    total: { value: 0, trend: "+0%", trendUp: true },
    active: { value: 0, trend: "+0%", trendUp: true },
    unassigned: { value: 0, trend: "+0%", trendUp: false },
    completed: { value: 0, trend: "+0%", trendUp: true },
  });

  useEffect(() => {
    fetchConsolidations();
  }, []);

  const fetchConsolidations = async () => {
    try {
      setLoading(true);
      // Use Admin API to get detailed info including assignments
      const data = await consolidationService.adminGetConsolidations();
      setConsolidations(data);
      calculateStats(data);
    } catch (err) {
      console.error("Error fetching consolidations:", err);
      setError(
        "Impossible de charger les groupages.",
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: (Consolidation & { linked_shipment_forwarder_id?: string | null })[]) => {
    const total = data.length;
    const active = data.filter(
      (c) => c.status === "open" || c.status === "closing_soon",
    ).length;
    // Count unassigned client requests
    const unassigned = data.filter(
      (c) => c.type === "client_request" && !c.linked_shipment_forwarder_id
    ).length;

    setStats({
      total: { value: total, trend: "+0%", trendUp: true },
      active: { value: active, trend: "+0%", trendUp: true },
      unassigned: { value: unassigned, trend: unassigned > 0 ? "Action Requise" : "OK", trendUp: unassigned === 0 },
      completed: { value: data.filter(c => c.status === 'shipped' || c.status === 'delivered').length, trend: "+100%", trendUp: true }
    });
  };

  const getFilteredConsolidations = () => {
    let result = [...consolidations];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          (c.title || "").toLowerCase().includes(query) ||
          c.origin_port.toLowerCase().includes(query) ||
          c.destination_port.toLowerCase().includes(query),
      );
    }

    if (statusFilter !== "all") {
      if (statusFilter === 'unassigned') {
        result = result.filter(c => c.type === "client_request" && !c.linked_shipment_forwarder_id);
      } else {
        result = result.filter((c) => c.status === statusFilter);
      }
    }

    return result;
  };

  const handleAssignForwarder = async (forwarderId: string) => {
    if (!assignModal.consolidation) return;
    try {
      await consolidationService.adminAssignForwarder(assignModal.consolidation.id, forwarderId);
      success("Prestataire assigné avec succès !");
      fetchConsolidations(); // Refresh list
    } catch (err) {
      console.error(err);
      toastError("Erreur lors de l'assignation.");
    }
  };

  const filteredConsolidations = getFilteredConsolidations();

  const getStatusBadge = (status: string, item: Consolidation & { linked_shipment_forwarder_id?: string | null }) => {
    const styles = {
      open: "bg-green-100 text-green-800",
      closing_soon: "bg-yellow-100 text-yellow-800",
      full: "bg-red-100 text-red-800",
      shipped: "bg-blue-100 text-blue-800",
      delivered: "bg-gray-100 text-gray-800",
      cancelled: "bg-gray-100 text-gray-500",
    };

    const labels = {
      open: "Ouvert",
      closing_soon: "Ferme Bientôt",
      full: "Complet",
      shipped: "Expédié",
      delivered: "Livré",
      cancelled: "Annulé",
    };

    return (
      <div className="flex flex-col gap-1 items-start">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"}`}
        >
          {labels[status as keyof typeof labels] || status}
        </span>
        {item.type === 'client_request' && (
          !item.linked_shipment_forwarder_id ? (
            <button
              onClick={() => setAssignModal({ isOpen: true, consolidation: item })}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 w-fit animate-pulse hover:bg-red-200 transition-colors cursor-pointer border border-red-200"
            >
              Assigner Force
            </button>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 w-fit">
              Assigné
            </span>
          )
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion du Groupage"
        subtitle="Vue d'ensemble de toutes les offres et demandes de groupage"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
        <div className="flex bg-gray-50 rounded-xl p-1">
          {["7d", "30d", "3m", "all"].map((period) => (
            <button
              key={period}
              onClick={() => setTimeRange(period as any)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${timeRange === period ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
            >
              {period === "all" ? "Tout" : period.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            title="Filtre Statut"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Tous les statuts</option>
            <option value="unassigned">Non Assignés (Urgent)</option>
            <option value="open">Ouvert</option>
            <option value="closing_soon">Ferme Bientôt</option>
            <option value="shipped">Expédié</option>
          </select>
        </div>

        <div className="w-px bg-gray-100 hidden sm:block mx-1 h-8"></div>

        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-8 py-2 bg-transparent hover:bg-gray-50 focus:bg-white border border-transparent focus:border-primary/20 rounded-xl text-sm focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="w-6 h-6" />
            </div>
            <span className="text-green-600 bg-green-50 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> {stats.total.trend}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Total Groupages</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.total.value}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
              <AlertCircle className="w-6 h-6" />
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.unassigned.trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {stats.unassigned.trend}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Non Assignés</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.unassigned.value}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gray-100 text-gray-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span className="text-green-600 bg-green-50 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> {stats.completed.trend}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Terminés</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.completed.value}
          </p>
        </div>
      </div>

      {/* List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Titre / Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Route
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Capacité
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  Chargement...
                </td>
              </tr>
            ) : filteredConsolidations.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="p-4 bg-gray-50 rounded-full mb-3">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <p>Aucun groupage trouvé</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredConsolidations.map((consolidation) => (
                <tr
                  key={consolidation.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${consolidation.transport_mode === "sea" ? "bg-blue-50 text-blue-600" : "bg-sky-50 text-sky-600"}`}
                      >
                        {consolidation.transport_mode === "sea" ? (
                          <Anchor className="w-4 h-4" />
                        ) : (
                          <Plane className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {consolidation.title || "Groupage sans titre"}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {consolidation.type.replace("_", " ")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{consolidation.origin_port}</span>
                      <span className="text-gray-400">→</span>
                      <span>{consolidation.destination_port}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {consolidation.current_load_cbm || 0} /{" "}
                      {consolidation.total_capacity_cbm || 0} CBM
                    </div>
                    <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      {(() => {
                        const width = `${Math.min(((consolidation.current_load_cbm || 0) / (consolidation.total_capacity_cbm || 1)) * 100, 100)}%`;
                        return (
                          <motion.div
                            className="h-full bg-blue-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width }}
                            transition={{ duration: 0.5 }}
                          />
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(consolidation.status, consolidation)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      Dép:{" "}
                      {consolidation.departure_date ? new Date(
                        consolidation.departure_date,
                      ).toLocaleDateString() : 'TBD'}
                    </div>
                    {consolidation.arrival_date && (
                      <div className="text-xs text-gray-400">
                        Arr:{" "}
                        {new Date(
                          consolidation.arrival_date,
                        ).toLocaleDateString()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      title="Actions"
                      className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AssignForwarderModal
        isOpen={assignModal.isOpen}
        onClose={() => setAssignModal({ isOpen: false, consolidation: null })}
        onAssign={handleAssignForwarder}
        consolidationTitle={assignModal.consolidation?.title}
      />
    </div>
  );
}
