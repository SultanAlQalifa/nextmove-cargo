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
import { motion, AnimatePresence } from "framer-motion";

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ staggerChildren: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          onClick={() => setActiveTab("announcements")}
          className={`p-6 rounded-3xl border cursor-pointer transition-all relative overflow-hidden group ${activeTab === "announcements"
            ? "bg-blue-600 border-transparent shadow-xl shadow-blue-500/30"
            : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/50 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-900/50 shadow-lg"
            }`}
        >
          {activeTab === "announcements" && (
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          )}
          <div className="flex items-center gap-5 mb-4 relative z-10">
            <div
              className={`p-3.5 rounded-2xl shadow-inner transition-colors ${activeTab === "announcements" ? "bg-white/20 text-white" : "bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 group-hover:scale-110"}`}
            >
              <AlertCircle
                className="w-7 h-7"
              />
            </div>
            <div>
              <p className={`text-xs font-black uppercase tracking-widest ${activeTab === "announcements" ? "text-blue-100" : "text-slate-500 dark:text-slate-400"}`}>
                Annonces (En Attente)
              </p>
              <h3 className={`text-4xl font-black tracking-tighter mt-1 ${activeTab === "announcements" ? "text-white" : "text-slate-900 dark:text-white"}`}>
                {stats.announcements}
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          onClick={() => {
            setActiveTab("shipments");
            setFilter("active");
          }}
          className={`p-6 rounded-3xl border cursor-pointer transition-all relative overflow-hidden group ${activeTab === "shipments" && filter !== "delivered"
            ? "bg-orange-600 border-transparent shadow-xl shadow-orange-500/30"
            : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/50 dark:border-white/5 hover:border-orange-200 dark:hover:border-orange-900/50 shadow-lg"
            }`}
        >
          {activeTab === "shipments" && filter !== "delivered" && (
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          )}
          <div className="flex items-center gap-5 mb-4 relative z-10">
            <div
              className={`p-3.5 rounded-2xl shadow-inner transition-colors ${activeTab === "shipments" && filter !== "delivered" ? "bg-white/20 text-white" : "bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 group-hover:scale-110"}`}
            >
              <Clock
                className="w-7 h-7"
              />
            </div>
            <div>
              <p className={`text-xs font-black uppercase tracking-widest ${activeTab === "shipments" && filter !== "delivered" ? "text-orange-100" : "text-slate-500 dark:text-slate-400"}`}>
                Expéditions En Cours
              </p>
              <h3 className={`text-4xl font-black tracking-tighter mt-1 ${activeTab === "shipments" && filter !== "delivered" ? "text-white" : "text-slate-900 dark:text-white"}`}>
                {stats.active}
              </h3>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -5, scale: 1.02 }}
          onClick={() => {
            setActiveTab("shipments");
            setFilter("delivered");
          }}
          className={`p-6 rounded-3xl border cursor-pointer transition-all relative overflow-hidden group ${activeTab === "shipments" && filter === "delivered"
            ? "bg-emerald-600 border-transparent shadow-xl shadow-emerald-500/30"
            : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-white/50 dark:border-white/5 hover:border-emerald-200 dark:hover:border-emerald-900/50 shadow-lg"
            }`}
        >
          {activeTab === "shipments" && filter === "delivered" && (
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          )}
          <div className="flex items-center gap-5 mb-4 relative z-10">
            <div
              className={`p-3.5 rounded-2xl shadow-inner transition-colors ${activeTab === "shipments" && filter === "delivered" ? "bg-white/20 text-white" : "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-110"}`}
            >
              <CheckCircle2
                className="w-7 h-7"
              />
            </div>
            <div>
              <p className={`text-xs font-black uppercase tracking-widest ${activeTab === "shipments" && filter === "delivered" ? "text-emerald-100" : "text-slate-500 dark:text-slate-400"}`}>
                Historique (Livrées)
              </p>
              <h3 className={`text-4xl font-black tracking-tighter mt-1 ${activeTab === "shipments" && filter === "delivered" ? "text-white" : "text-slate-900 dark:text-white"}`}>
                {stats.delivered}
              </h3>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Tabs & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 rounded-3xl border border-white/50 dark:border-white/5 shadow-lg"
      >
        {/* Tabs */}
        <div className="flex bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab("announcements")}
            className={`px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === "announcements"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5"
              }`}
          >
            Annonces
          </button>
          <button
            onClick={() => setActiveTab("shipments")}
            className={`px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === "shipments"
              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-white/5"
              }`}
          >
            Mes Expéditions
          </button>
        </div>

        {/* Sub-Filters (Only visible for Shipments) */}
        {activeTab === "shipments" && (
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            <button
              onClick={() => setFilter("all")}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === "all"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg shadow-slate-900/20"
                : "bg-slate-50/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
            >
              Tout
            </button>
            <button
              onClick={() => setFilter("active")}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === "active"
                ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                : "bg-slate-50/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 dark:hover:text-orange-400"
                }`}
            >
              En cours
            </button>
            <button
              onClick={() => setFilter("delivered")}
              className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${filter === "delivered"
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                : "bg-slate-50/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400"
                }`}
            >
              Livrées
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 w-full md:w-auto" />
        <div className="relative flex-1 md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={
              activeTab === "announcements"
                ? "Rechercher une annonce..."
                : "N° Suivi, Client..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <button
          onClick={loadShipments}
          className="p-3 bg-slate-100/80 dark:bg-slate-800 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all shadow-sm"
          aria-label="Rafraîchir"
          title="Rafraîchir"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>

      </motion.div>

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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/50 dark:border-white/5 overflow-hidden"
        >
          <ForwarderShipmentTable
            shipments={filteredShipments}
            onUpdateStatus={handleUpdateStatus}
            onViewDetails={handleViewDetails}
            onDelete={(s) => confirmDelete(s.id)}
          />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200 dark:border-white/10"
        >
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            {activeTab === "announcements" ? (
              <AlertCircle className="w-10 h-10 text-blue-500" />
            ) : (
              <Truck className="w-10 h-10 text-slate-400" />
            )}
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {activeTab === "announcements"
              ? "Aucune annonce en attente"
              : "Aucune expédition trouvée"}
          </h3>
          <p className="text-slate-500 font-medium mt-2">
            {activeTab === "announcements"
              ? "Toutes les demandes ont été traitées ou il n'y en a pas encore."
              : "Aucune expédition ne correspond à vos filtres actuels."}
          </p>
        </motion.div>
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
