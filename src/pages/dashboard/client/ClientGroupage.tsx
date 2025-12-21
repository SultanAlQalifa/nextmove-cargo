import { useState, useEffect } from "react";
import { Plus, Lock, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "../../../hooks/useSubscription";
import ConsolidationList from "../../../components/consolidation/ConsolidationList";
import CreateConsolidationModal from "../../../components/consolidation/CreateConsolidationModal";
import { Consolidation } from "../../../types/consolidation";
import { supabase } from "../../../lib/supabase";
import { consolidationService } from "../../../services/consolidationService";
import { useDataSync } from "../../../contexts/DataSyncContext";

export default function ClientGroupage() {
  const [activeTab, setActiveTab] = useState<"marketplace" | "my_requests">(
    "marketplace",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedConsolidation, setSelectedConsolidation] = useState<
    Consolidation | undefined
  >(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Live Sync
  useDataSync("consolidations", () => setRefreshTrigger(prev => prev + 1));

  const handleCreate = () => {
    setModalMode("create");
    setSelectedConsolidation(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (consolidation: Consolidation) => {
    setModalMode("edit");
    setSelectedConsolidation(consolidation);
    setIsModalOpen(true);
  };

  const { features, loading, isStarter } = useSubscription();
  const navigate = useNavigate();
  const [userRequestsCount, setUserRequestsCount] = useState(0);

  useEffect(() => {
    const fetchUserRequestsCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const requests = await consolidationService.getMyConsolidations(user.id);
          // Count only non-cancelled requests for the limit
          setUserRequestsCount(requests.filter(r => r.status !== 'cancelled').length);
        }
      } catch (err) {
        console.error("Error fetching user requests:", err);
      }
    };
    fetchUserRequestsCount();
  }, [refreshTrigger]);

  if (loading) return (
    <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="text-slate-500 animate-pulse font-medium">Chargement...</p>
    </div>
  );

  const isLimitReached = isStarter && userRequestsCount >= (features.groupageLimit || 1);

  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setActiveTab("my_requests");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Groupage Marketplace
          </h1>
          <p className="text-gray-500 mt-1">
            Rejoignez ou créez des offres de groupage pour optimiser vos coûts.
          </p>
          {isStarter && (
            <p className="text-xs font-medium text-amber-600 mt-2 bg-amber-50 px-2 py-1 rounded w-fit border border-amber-100 italic">
              Plan Starter : Limite de {features.groupageLimit} demande active {userRequestsCount >= (features.groupageLimit || 1) ? "(Limite atteinte)" : ""}
            </p>
          )}
        </div>
        <button
          onClick={handleCreate}
          disabled={isLimitReached}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${isLimitReached
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          title={isLimitReached ? "Limite de demande atteinte pour votre plan" : "Créer une demande"}
        >
          <Plus className="h-4 w-4" />
          {isLimitReached ? "Limite atteinte" : "Créer une Demande"}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("marketplace")}
            className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                            ${activeTab === "marketplace"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }
                        `}
          >
            Marketplace Offers
          </button>
          <button
            onClick={() => setActiveTab("my_requests")}
            className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                            ${activeTab === "my_requests"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }
                        `}
          >
            My Requests
          </button>
        </nav>
      </div>

      <ConsolidationList
        key={`${activeTab}-${refreshTrigger}`}
        type={
          activeTab === "marketplace" ? "forwarder_offer" : "client_request"
        }
        showActions={activeTab === "my_requests"}
        onEdit={handleEdit}
      />

      <CreateConsolidationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        mode={modalMode}
        initialData={selectedConsolidation}
        defaultType="client_request"
      />
    </div>
  );
}
