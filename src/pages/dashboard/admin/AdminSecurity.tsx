import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
  Search,
  Calendar,
  Eye,
  FileJson,
  X,
  User,
  Filter
} from "lucide-react";
import { auditService, AuditLog } from "../../../services/auditService";
import { useToast } from "../../../contexts/ToastContext";

export default function AdminSecurity() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: "",
  });

  // Modals
  const [detailsModal, setDetailsModal] = useState<{
    isOpen: boolean;
    log: AuditLog | null;
  }>({
    isOpen: false,
    log: null,
  });

  const { error: toastError } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [dateRange]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const filters: any = {
        limit: 100 // Default limit for now
      };

      if (dateRange.start) filters.startDate = new Date(dateRange.start).toISOString();
      if (dateRange.end) filters.endDate = new Date(dateRange.end).toISOString();
      if (searchQuery) filters.action = searchQuery; // Basic search mapping

      const { data } = await auditService.getLogs(filters);
      setLogs(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
      toastError("Erreur lors du chargement des logs");
    } finally {
      setLoading(false);
    }
  };

  // Filter client-side for search query to be more responsive on small datasets
  // or if API search is limited
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (log.action?.toLowerCase() || "").includes(query) ||
      (log.resource?.toLowerCase() || "").includes(query) ||
      (log.user?.full_name?.toLowerCase() || "").includes(query) ||
      (log.user?.email?.toLowerCase() || "").includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Journal d'Audit"
        subtitle="Suivi de la sécurité et des actions critiques"
      />

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher (Action, Utilisateur, Ressource)..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent focus:bg-white focus:border-primary/20 rounded-xl text-sm focus:outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              aria-label="Date de début"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="bg-transparent border-none text-sm text-gray-700 focus:outline-none w-32"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              aria-label="Date de fin"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="bg-transparent border-none text-sm text-gray-700 focus:outline-none w-32"
            />
          </div>
          <button
            onClick={fetchLogs}
            className="p-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
            title="Rafraîchir"
            aria-label="Rafraîchir les logs"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date & Heure
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Ressource
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Détails
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      Aucun log trouvé pour cette période
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <User className="w-3 h-3" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {log.user?.full_name || "Système / Inconnu"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {log.user?.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                          {log.action ? log.action.replace(/_/g, " ") : "Action inconnue"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.resource || "Ressource inconnue"} <span className="text-gray-400 text-xs">({log.resource_id?.slice(0, 8) || "N/A"}...)</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setDetailsModal({ isOpen: true, log })}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir les détails JSON"
                          aria-label="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {detailsModal.isOpen && detailsModal.log && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <FileJson className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Détails de l'événement</h3>
                  <p className="text-sm text-gray-500">ID: {detailsModal.log.id}</p>
                </div>
              </div>
              <button
                onClick={() => setDetailsModal({ isOpen: false, log: null })}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-gray-50/50">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-400 uppercase font-semibold">Action</span>
                    <p className="font-medium text-gray-900">{detailsModal.log.action}</p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-100">
                    <span className="text-xs text-gray-400 uppercase font-semibold">Ressource</span>
                    <p className="font-medium text-gray-900">{detailsModal.log.resource}</p>
                  </div>
                </div>

                <div>
                  <span className="text-sm font-semibold text-gray-700 mb-2 block">Données brutes (JSON)</span>
                  <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                    <pre className="text-xs text-green-400 font-mono">
                      {JSON.stringify(detailsModal.log.details, null, 2)}
                    </pre>
                  </div>
                </div>

                {detailsModal.log.metadata && Object.keys(detailsModal.log.metadata).length > 0 && (
                  <div>
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">Métadonnées</span>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 text-sm text-gray-600">
                      {JSON.stringify(detailsModal.log.metadata, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
              <button
                onClick={() => setDetailsModal({ isOpen: false, log: null })}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
