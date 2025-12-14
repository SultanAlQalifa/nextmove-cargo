import { useState, useEffect } from "react";
import { Plus, Lock, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "../../../hooks/useSubscription";
import ConsolidationList from "../../../components/consolidation/ConsolidationList";
import CreateConsolidationModal from "../../../components/consolidation/CreateConsolidationModal";
import { Consolidation } from "../../../types/consolidation";

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

  const { features, loading } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !features.groupageEnabled) {
      // Redirect or Show Block UI
    }
  }, [loading, features.groupageEnabled]);

  if (loading) return <div>Chargement...</div>;

  if (!features.groupageEnabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
          <div className="mb-6">
            <Lock className="w-16 h-16 mx-auto text-red-500" />
          </div>

          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Groupage réservé au plan Pro
          </h2>

          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Le groupage de colis permet de réduire vos coûts d'expédition en consolidant
            plusieurs envois. Cette fonctionnalité est disponible à partir du plan Pro.
          </p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Avec le plan Pro :</strong>
            </p>
            <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1 text-left">
              <li>✓ Groupage illimité</li>
              <li>✓ Réduction automatique de 5% sur tous vos envois</li>
              <li>✓ RFQ illimités</li>
              <li>✓ Support prioritaire sous 24h</li>
            </ul>
          </div>

          <button
            onClick={() => navigate("/subscription/plans")}
            className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition w-full sm:w-auto font-medium"
          >
            <Shield className="w-5 h-5 mr-2" />
            Passer au plan Pro
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="block mt-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 mx-auto text-sm"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    );
  }

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
            Find and join consolidation offers from verified forwarders.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Request
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
