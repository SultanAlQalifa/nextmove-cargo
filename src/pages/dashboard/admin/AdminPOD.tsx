import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
  FileCheck,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Search,
  Calendar,
  X,
  Filter,
} from "lucide-react";
import { podService, POD } from "../../../services/podService";
import PODDetailsModal from "../../../components/admin/PODDetailsModal";
import PODRejectionModal from "../../../components/admin/PODRejectionModal";
import PODValidationModal from "../../../components/admin/PODValidationModal";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import { exportToCSV } from "../../../utils/exportUtils";

export default function AdminPOD() {
  const [pods, setPods] = useState<POD[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "verified" | "rejected"
  >("all");

  // Unified Filter State
  const [timeRange, setTimeRange] = useState<
    "7d" | "30d" | "3m" | "1y" | "all" | "custom"
  >("30d");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: "",
  });
  const [searchTerm, setSearchTerm] = useState("");

  // Details Modal State
  const [selectedPOD, setSelectedPOD] = useState<POD | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [podToReject, setPodToReject] = useState<POD | null>(null);
  const [podToValidate, setPodToValidate] = useState<POD | null>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "verify" | "reject" | null;
    id: string | null;
    title: string;
    message: string;
    variant: "danger" | "warning" | "info" | "success";
  }>({
    isOpen: false,
    type: null,
    id: null,
    title: "",
    message: "",
    variant: "info",
  });

  const handleExport = () => {
    const headers = [
      { label: "Expédition", key: "shipment_id" },
      { label: "Numéro de suivi", key: "tracking_number" },
      { label: "Prestataire", key: "forwarder.name" },
      { label: "Client", key: "client.name" },
      {
        label: "Date Soumission",
        key: (item: POD) => new Date(item.submitted_at).toLocaleDateString(),
      },
      { label: "Statut", key: "status" },
      { label: "Notes", key: "notes" },
    ];
    exportToCSV(filteredPODs, headers, "preuves_de_livraison");
  };

  const fetchPODs = async () => {
    try {
      const data = await podService.getPODs();
      setPods(data);
    } catch (error) {
      console.error("Error fetching PODs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPODs();
  }, []);

  const handleVerify = async (id: string, status: "verified" | "rejected") => {
    const pod = pods.find((p) => p.id === id);
    if (!pod) return;

    if (status === "rejected") {
      setPodToReject(pod);
      setIsRejectionModalOpen(true);
    } else {
      setPodToValidate(pod);
      setIsValidationModalOpen(true);
    }
  };

  const handleValidateConfirm = async (id: string, note: string) => {
    try {
      await podService.verifyPOD(id, "verified", note);

      // Refresh data
      const updatedData = await podService.getPODs();
      setPods(updatedData);

      // Update selected item if modal is open
      if (selectedPOD && selectedPOD.id === id) {
        const updatedItem = updatedData.find((p) => p.id === id);
        if (updatedItem) setSelectedPOD(updatedItem);
      }

      setIsValidationModalOpen(false);
      setPodToValidate(null);

      // Close details modal if action was taken from there
      if (isDetailsModalOpen) {
        setIsDetailsModalOpen(false);
      }
    } catch (error) {
      console.error("Error validating POD:", error);
    }
  };

  const handleRejectConfirm = async (id: string, reason: string) => {
    try {
      await podService.reviewPOD(selectedPOD.id, 'rejected', reason);

      // Refresh data
      const updatedData = await podService.getPODs();
      setPods(updatedData);

      // Update selected item if modal is open
      if (selectedPOD && selectedPOD.id === id) {
        const updatedItem = updatedData.find((p) => p.id === id);
        if (updatedItem) setSelectedPOD(updatedItem);
      }

      setIsRejectionModalOpen(false);
      setPodToReject(null);

      // Close details modal if action was taken from there
      if (isDetailsModalOpen) {
        setIsDetailsModalOpen(false);
      }
    } catch (error) {
      console.error("Error rejecting POD:", error);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.id || !confirmModal.type) return;

    try {
      const status = confirmModal.type === "verify" ? "verified" : "rejected";
      await podService.verifyPOD(confirmModal.id, status);

      // Refresh data
      const updatedData = await podService.getPODs();
      setPods(updatedData);

      // Update selected item if modal is open
      if (selectedPOD && selectedPOD.id === confirmModal.id) {
        const updatedItem = updatedData.find((p) => p.id === confirmModal.id);
        if (updatedItem) setSelectedPOD(updatedItem);
      }

      setConfirmModal((prev) => ({ ...prev, isOpen: false }));

      // Close details modal if action was taken from there
      if (isDetailsModalOpen) {
        setIsDetailsModalOpen(false);
      }
    } catch (error) {
      console.error("Error updating POD status:", error);
    }
  };

  const openDetailsModal = (pod: POD) => {
    setSelectedPOD(pod);
    setIsDetailsModalOpen(true);
  };

  const filteredPODs = pods.filter((pod) => {
    const matchesFilter = filter === "all" || pod.status === filter;
    const matchesSearch =
      pod.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pod.shipment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pod.forwarder.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Date Filtering
    let matchesDate = true;
    if (timeRange !== "all") {
      const date = new Date(pod.submitted_at);
      const now = new Date();
      if (timeRange === "7d") {
        const past = new Date(now.setDate(now.getDate() - 7));
        matchesDate = date >= past;
      } else if (timeRange === "30d") {
        const past = new Date(now.setDate(now.getDate() - 30));
        matchesDate = date >= past;
      } else if (timeRange === "3m") {
        const past = new Date(now.setMonth(now.getMonth() - 3));
        matchesDate = date >= past;
      } else if (timeRange === "1y") {
        const past = new Date(now.setFullYear(now.getFullYear() - 1));
        matchesDate = date >= past;
      } else if (
        timeRange === "custom" &&
        customDateRange.start &&
        customDateRange.end
      ) {
        const start = new Date(customDateRange.start);
        const end = new Date(customDateRange.end);
        matchesDate = date >= start && date <= end;
      }
    }

    return matchesFilter && matchesSearch && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Vérifié
          </span>
        );
      case "rejected":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            Rejeté
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            En attente
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Preuves de Livraison (POD)"
        subtitle="Vérification et archivage des documents de livraison"
        action={{
          label: "Exporter",
          onClick: handleExport,
          icon: Download,
        }}
      />

      {/* Unified Filter Segment */}
      <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center mb-6">
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
                                ${timeRange === period.id
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
              aria-label="Date de début"
              className="pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-28"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={customDateRange.end}
              onChange={(e) =>
                setCustomDateRange({ ...customDateRange, end: e.target.value })
              }
              aria-label="Date de fin"
              className="pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-28"
            />
          </div>
        )}

        <div className="w-px bg-gray-100 hidden sm:block mx-1 h-8"></div>

        {/* Status Filter Dropdown */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            aria-label="Filtrer par statut"
            title="Filtrer par statut"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="pl-9 pr-8 py-2 bg-gray-50 border border-transparent hover:bg-white hover:border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="verified">Vérifié</option>
            <option value="rejected">Rejeté</option>
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

        <div className="w-px bg-gray-100 hidden sm:block mx-1 h-8"></div>

        {/* Search */}
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-8 py-2 bg-transparent hover:bg-gray-50 focus:bg-white border border-transparent focus:border-primary/20 rounded-xl text-sm focus:outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              aria-label="Effacer la recherche"
              title="Effacer la recherche"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expédition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prestataire
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Soumission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPODs.map((pod) => (
                <tr key={pod.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {pod.shipment_id}
                    </div>
                    <div className="text-xs text-gray-500">
                      {pod.tracking_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pod.forwarder.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pod.client.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(pod.submitted_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {pod.documents.map((doc, idx) => (
                        <a
                          key={idx}
                          href={doc.url}
                          className="p-1.5 bg-gray-100 rounded hover:bg-gray-200 text-gray-600 transition-colors"
                          title={doc.name}
                        >
                          <FileCheck className="w-4 h-4" />
                        </a>
                      ))}
                      <span className="text-xs text-gray-500">
                        ({pod.documents.length})
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(pod.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openDetailsModal(pod)}
                        className="p-1.5 text-gray-400 hover:text-primary transition-colors"
                        title="Voir détails"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {pod.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleVerify(pod.id, "verified")}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Valider"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleVerify(pod.id, "rejected")}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Rejeter"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPODs.length === 0 && (
          <div className="text-center py-12">
            <FileCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              Aucun POD trouvé
            </h3>
            <p className="text-gray-500">
              Aucun document ne correspond à votre recherche.
            </p>
          </div>
        )}
      </div>

      <PODDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        pod={selectedPOD}
        onVerify={(id) => handleVerify(id, "verified")}
        onReject={(id) => handleVerify(id, "rejected")}
      />

      <PODRejectionModal
        isOpen={isRejectionModalOpen}
        onClose={() => {
          setIsRejectionModalOpen(false);
          setPodToReject(null);
        }}
        pod={podToReject}
        onConfirm={handleRejectConfirm}
      />

      <PODValidationModal
        isOpen={isValidationModalOpen}
        onClose={() => {
          setIsValidationModalOpen(false);
          setPodToValidate(null);
        }}
        pod={podToValidate}
        onConfirm={handleValidateConfirm}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmLabel={confirmModal.type === "verify" ? "Valider" : "Rejeter"}
      />
    </div>
  );
}
