import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import {
  Truck,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Upload,
} from "lucide-react";
import { shipmentService, Shipment } from "../../../services/shipmentService";
import { useToast } from "../../../contexts/ToastContext";
import ForwarderShipmentTable from "../../../components/shipment/ForwarderShipmentTable";
import AddShipmentModal from "../../../components/dashboard/AddShipmentModal";
import BulkUploadModal from "../../../components/dashboard/BulkUploadModal";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import EditShipmentModal from "../../../components/dashboard/EditShipmentModal";

export default function ForwarderShipments() {
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "active" | "delivered" | "delayed"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null,
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"announcements" | "shipments">(
    "announcements",
  );

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    setLoading(true);
    try {
      const data = await shipmentService.getForwarderShipments();
      setShipments(data);
    } catch (error) {
      console.error("Error loading shipments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (updatedShipment: Shipment) => {
    // Optimistic or fresh reload
    setShipments((prev) =>
      prev.map((s) => (s.id === updatedShipment.id ? updatedShipment : s)),
    );
  };

  const handleViewDetails = (shipment: Shipment) => {
    navigate(`/dashboard/forwarder/shipments/${shipment.id}`);
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await shipmentService.deleteShipment(deleteId);
      success("Expédition supprimée avec succès");
      setDeleteId(null);
      loadShipments();
    } catch (error: any) {
      console.error("Error deleting shipment:", error);
      // Use toast error if available, or just log
      toastError(error.message || "Erreur lors de la suppression");
    }
  };

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch =
      (shipment.tracking_number || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (shipment.origin?.port || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shipment.destination?.port || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (shipment.client?.full_name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (shipment.client?.email || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    // Tab Logic
    const isAnnouncement = (s: Shipment) => s.status === "pending" && !s.rfq_id;

    if (activeTab === "announcements") {
      return isAnnouncement(shipment);
    } else {
      // Shipments Tab (Everything NOT an announcement)
      if (isAnnouncement(shipment)) return false;

      // Sub-filters for Shipments Tab
      if (filter === "active")
        return !["delivered", "completed", "cancelled"].includes(shipment.status);
      if (filter === "delivered")
        return ["delivered", "completed"].includes(shipment.status);
      // 'all' includes active + delivered (and cancelled if any)
      return true;
    }
  });

  const isAnnouncement = (s: Shipment) => s.status === "pending" && !s.rfq_id;

  const stats = {
    announcements: shipments.filter(isAnnouncement).length,
    active: shipments.filter((s) => !isAnnouncement(s) && !["delivered", "completed", "cancelled"].includes(s.status)).length,
    delivered: shipments.filter((s) => s.status === "delivered").length,
  };

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Gestion des Expéditions"
        subtitle="Suivez et mettez à jour les expéditions de vos clients"
        action={{
          label: "Ajouter une Expédition",
          onClick: () => setIsAddModalOpen(true),
          icon: Plus,
        }}
      >
        <button
          onClick={() => setIsBulkModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
        >
          <Upload className="w-5 h-5" />
          <span className="font-medium">Importer Excel</span>
        </button>
      </PageHeader>

      <AddShipmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadShipments}
      />

      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={loadShipments}
        type="shipments"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => setActiveTab("announcements")}
          className={`p-6 rounded-2xl border cursor-pointer transition-all ${activeTab === "announcements"
            ? "bg-blue-50 border-blue-200 ring-2 ring-blue-500/20"
            : "bg-white border-gray-100 hover:border-blue-100 hover:shadow-sm"
            }`}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`p-3 rounded-xl ${activeTab === "announcements" ? "bg-blue-100" : "bg-gray-50"}`}
            >
              <AlertCircle
                className={`w-6 h-6 ${activeTab === "announcements" ? "text-blue-600" : "text-gray-400"}`}
              />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">
                Annonces (En Attente)
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats.announcements}
              </h3>
            </div>
          </div>
        </div>

        <div
          onClick={() => {
            setActiveTab("shipments");
            setFilter("active");
          }}
          className={`p-6 rounded-2xl border cursor-pointer transition-all ${activeTab === "shipments" && filter !== "delivered"
            ? "bg-orange-50 border-orange-200 ring-2 ring-orange-500/20"
            : "bg-white border-gray-100 hover:border-orange-100 hover:shadow-sm"
            }`}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`p-3 rounded-xl ${activeTab === "shipments" && filter !== "delivered" ? "bg-orange-100" : "bg-gray-50"}`}
            >
              <Clock
                className={`w-6 h-6 ${activeTab === "shipments" && filter !== "delivered" ? "text-orange-600" : "text-gray-400"}`}
              />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">
                Expéditions En Cours
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats.active}
              </h3>
            </div>
          </div>
        </div>

        <div
          onClick={() => {
            setActiveTab("shipments");
            setFilter("delivered");
          }}
          className={`p-6 rounded-2xl border cursor-pointer transition-all ${activeTab === "shipments" && filter === "delivered"
            ? "bg-green-50 border-green-200 ring-2 ring-green-500/20"
            : "bg-white border-gray-100 hover:border-green-100 hover:shadow-sm"
            }`}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`p-3 rounded-xl ${activeTab === "shipments" && filter === "delivered" ? "bg-green-100" : "bg-gray-50"}`}
            >
              <CheckCircle2
                className={`w-6 h-6 ${activeTab === "shipments" && filter === "delivered" ? "text-green-600" : "text-gray-400"}`}
              />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">
                Historique (Livrées)
              </p>
              <h3 className="text-2xl font-bold text-gray-900">
                {stats.delivered}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        {/* Tabs */}
        <div className="flex bg-gray-100/50 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("announcements")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "announcements"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Annonces
          </button>
          <button
            onClick={() => setActiveTab("shipments")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === "shipments"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
              }`}
          >
            Mes Expéditions
          </button>
        </div>

        {/* Sub-Filters (Only visible for Shipments) */}
        {activeTab === "shipments" && (
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === "all"
                ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20"
                : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              Tout
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === "active"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              En cours
            </button>
            <button
              onClick={() => setFilter("delivered")}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === "delivered"
                ? "bg-green-600 text-white shadow-lg shadow-green-600/20"
                : "text-gray-500 hover:bg-gray-50"
                }`}
            >
              Livrées
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={
                activeTab === "announcements"
                  ? "Rechercher une annonce..."
                  : "N° Suivi, Client..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <button
            onClick={loadShipments}
            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
            aria-label="Rafraîchir"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Content & Empty States */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-gray-100 rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : filteredShipments.length > 0 ? (
        <ForwarderShipmentTable
          shipments={filteredShipments}
          onUpdateStatus={handleUpdateStatus}
          onViewDetails={handleViewDetails}
          onDelete={(s) => confirmDelete(s.id)}
        />
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            {activeTab === "announcements" ? (
              <AlertCircle className="w-8 h-8 text-blue-400" />
            ) : (
              <Truck className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            {activeTab === "announcements"
              ? "Aucune annonce en attente"
              : "Aucune expédition trouvée"}
          </h3>
          <p className="text-gray-500 mt-1">
            {activeTab === "announcements"
              ? "Toutes les demandes ont été traitées ou il n'y en a pas encore."
              : "Aucune expédition ne correspond à vos filtres actuels."}
          </p>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Supprimer l'expédition"
        message="Êtes-vous sûr de vouloir supprimer cette expédition ? Cette action est irréversible et n'est possible que pour les statuts 'En Attente'."
      />

      <EditShipmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        shipment={selectedShipment}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
