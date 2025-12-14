import { useState } from "react";
import ForwarderConsolidations from "../../../components/dashboard/ForwarderConsolidations";
import ConsolidationList from "../../../components/consolidation/ConsolidationList";
import { consolidationService } from "../../../services/consolidationService";
import { useToast } from "../../../contexts/ToastContext";
import ConfirmationModal from "../../../components/common/ConfirmationModal";

export default function ForwarderGroupage() {
  const [activeTab, setActiveTab] = useState<"my_offers" | "client_requests">("my_offers");
  const { success, error } = useToast();
  const [claimProps, setClaimProps] = useState<{ isOpen: boolean; id: string | null }>({ isOpen: false, id: null });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleClaimRequest = (id: string) => {
    setClaimProps({ isOpen: true, id });
  };

  const confirmClaim = async () => {
    if (!claimProps.id) return;
    try {
      await consolidationService.claimConsolidation(claimProps.id);
      success("Demande de groupage prise en charge avec succès !");
      setRefreshTrigger(prev => prev + 1); // Refresh list
    } catch (err) {
      console.error("Error claiming consolidation:", err);
      error("Erreur lors de la prise en charge.");
    } finally {
      setClaimProps({ isOpen: false, id: null });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Gestion du Groupage
        </h1>
        <p className="text-gray-500 mt-1">
          Gérez vos services de consolidation et trouvez de nouvelles opportunités.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("my_offers")}
            className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === "my_offers"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }
            `}
          >
            Mes Offres
          </button>
          <button
            onClick={() => setActiveTab("client_requests")}
            className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === "client_requests"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }
            `}
          >
            Demandes Clients (Marketplace)
          </button>
        </nav>
      </div>

      {activeTab === "my_offers" ? (
        <ForwarderConsolidations />
      ) : (
        <ConsolidationList
          key={`marketplace-${refreshTrigger}`}
          type="client_request"
          isForwarder
          onClaim={handleClaimRequest}
        />
      )}

      <ConfirmationModal
        isOpen={claimProps.isOpen}
        onClose={() => setClaimProps({ isOpen: false, id: null })}
        onConfirm={confirmClaim}
        title="Prendre en charge cette demande"
        message="Voulez-vous prendre en charge cette demande de groupage ? Un paiement de frais de service peut être requis."
        confirmLabel="Confirmer et Payer"
      />
    </div>
  );
}
