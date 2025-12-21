import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { consolidationService } from "../../services/consolidationService";
import { Consolidation } from "../../types/consolidation";
import {
  Plus,
  Package,
  Anchor,
  Plane,
  ArrowRight,
  Upload,
} from "lucide-react";
import CreateConsolidationModal from "../consolidation/CreateConsolidationModal";
import BulkUploadModal from "../dashboard/BulkUploadModal";
import { format } from "date-fns";
import { useDataSync } from "../../contexts/DataSyncContext";

export default function ForwarderConsolidations() {
  const { user } = useAuth();
  const [consolidations, setConsolidations] = useState<Consolidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadConsolidations();
    }
  }, [user]);

  const loadConsolidations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await consolidationService.getMyConsolidations(user.id);
      setConsolidations(data);
    } catch (error) {
      console.error("Error loading consolidations:", error);
    } finally {
      setLoading(false);
    }
  };

  useDataSync("consolidations", () => loadConsolidations());

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "closing_soon":
        return "bg-yellow-100 text-yellow-800";
      case "full":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Mes Groupages</h2>
          <p className="text-gray-500 text-sm">Gérez vos offres de groupage</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Upload className="h-5 w-5" />
            Importer CSV
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/30"
          >
            <Plus className="h-5 w-5" />
            Nouveau Groupage
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : consolidations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            Aucun groupage pour le moment
          </h3>
          <p className="text-gray-500 mb-6">
            Créez votre première offre de groupage pour commencer à remplir vos
            conteneurs.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-blue-600 font-medium hover:text-blue-500"
          >
            Créer un Groupage
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {consolidations.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}
                  >
                    {item.status.replace("_", " ").toUpperCase()}
                  </div>
                  {item.transport_mode === "sea" ? (
                    <Anchor className="h-5 w-5 text-blue-500" />
                  ) : (
                    <Plane className="h-5 w-5 text-sky-500" />
                  )}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">
                  {item.title ||
                    `${item.origin_port} → ${item.destination_port}`}
                </h3>

                <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
                  <span>{item.origin_port}</span>
                  <ArrowRight className="h-4 w-4" />
                  <span>{item.destination_port}</span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Départ</span>
                    <span className="font-medium text-gray-900">
                      {item.departure_date
                        ? format(new Date(item.departure_date), "dd MMM yyyy")
                        : "À définir"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Rempli</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          // eslint-disable-next-line react/forbid-dom-props
                          /* hint-disable no-inline-styles */
                          style={{
                            width: `${Math.min(((item.current_load_cbm || 0) / (item.total_capacity_cbm || 1)) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="font-medium text-gray-900">
                        {Math.round(
                          ((item.current_load_cbm || 0) /
                            (item.total_capacity_cbm || 1)) *
                          100,
                        )}
                        %
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 py-2 px-4 bg-gray-50 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm">
                    Modifier
                  </button>
                  <button className="flex-1 py-2 px-4 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors text-sm">
                    Voir Détails
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateConsolidationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadConsolidations}
      />

      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={loadConsolidations}
        type="consolidations"
      />
    </div>
  );
}
