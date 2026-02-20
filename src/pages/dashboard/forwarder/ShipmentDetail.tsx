import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  MapPin,
  Calendar,
  Clock,
  Truck,
  FileText,
  CheckCircle2,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import TrackingMap from "../../../components/shipment/TrackingMap";
import { shipmentService, Shipment, ShipmentDocument } from "../../../services/shipmentService";
import { useToast } from "../../../contexts/ToastContext";
import { useCurrency } from "../../../contexts/CurrencyContext";
import EditShipmentModal from "../../../components/dashboard/EditShipmentModal";
import AddShipmentModal from "../../../components/dashboard/AddShipmentModal";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import { motion, AnimatePresence } from "framer-motion";

export default function ShipmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success, error } = useToast();
  const { formatPrice } = useCurrency();

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddPackageModalOpen, setIsAddPackageModalOpen] = useState(false);

  // Document State
  const [documents, setDocuments] = useState<ShipmentDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Status State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadShipment(id);
    }
  }, [id]);

  // Auto-fix for legacy data: specific shipment TRK-539375 with 1kg default
  useEffect(() => {
    if (
      shipment?.tracking_number === "TRK-539375" &&
      (shipment.cargo.weight === 1 || shipment.cargo.weight === 0) &&
      shipment.transport_mode === "air"
    ) {
      const autoFixWeight = async () => {
        try {
          const updated = await shipmentService.updateShipment(shipment.id, {
            cargo: { ...shipment.cargo, weight: 1000 },
          } as any);
          setShipment(updated);
        } catch (e) {
          console.error("Auto-fix failed", e);
        }
      };
      autoFixWeight();
    }
  }, [shipment]);

  const loadShipment = async (shipmentId: string) => {
    // setLoading(true); // Don't show full loader on refresh
    try {
      const data = await shipmentService.getShipmentById(shipmentId);
      if (!data) {
        error("Expédition introuvable");
        navigate("/dashboard/forwarder/shipments");
        return;
      }
      setShipment(data);
      // Load docs
      const docs = await shipmentService.getDocuments(shipmentId);
      setDocuments(docs);
    } catch (err) {
      console.error("Error loading shipment:", err);
      error("Erreur lors du chargement de l'expédition");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuccess = (updatedShipment: Shipment) => {
    setShipment(updatedShipment);
  };

  const handleDelete = async () => {
    if (!shipment) return;
    try {
      await shipmentService.deleteShipment(shipment.id);
      // success('Expédition supprimée'); // Assuming success toast is global or we use navigate state
      navigate("/dashboard/forwarder/shipments");
    } catch (e: any) {
      console.error("Delete failed:", e);
      error(e.message || "Erreur lors de la suppression");
      setIsDeleteModalOpen(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!shipment) return;
    try {
      const updated = await shipmentService.updateShipment(shipment.id, { status: status as any });
      setShipment(updated);
      success(`Statut mis à jour : ${status}`);
      setIsStatusModalOpen(false);
    } catch (e) {
      console.error(e);
      error("Erreur lors de la mise à jour du statut");
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !shipment) return;

    setIsUploading(true);
    try {
      const doc = await shipmentService.uploadDocument(shipment.id, file, 'other');
      if (doc) {
        setDocuments([doc, ...documents]);
        success("Document ajouté avec succès");
      }
    } catch (e) {
      console.error(e);
      error("Erreur lors de l'upload");
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!shipment) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}
    >
      {status === "pending" && "En Attente"}
      {status === "picked_up" && "Ramassé"}
      {status === "in_transit" && "En Transit"}
      {status === "delivered" && "Livré"}
      {status === "cancelled" && "Annulé"}
      {status === "customs" && "En Douane"}
    </span>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-6xl mx-auto pb-12 relative"
    >
      <div className="grain-overlay opacity-[0.02]" />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <button
            onClick={() => navigate("/dashboard/forwarder/shipments")}
            className="flex items-center text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour aux expéditions
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            {shipment.tracking_number}
            <StatusBadge status={shipment.status} />
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Créée le {new Date(shipment.created_at || "").toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Clock className="w-4 h-4" />
            Changer Statut
          </button>

          {shipment.status === "pending" && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 border border-rose-100 text-rose-600 font-medium rounded-xl hover:bg-rose-100 transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          )}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="md:col-span-2 space-y-6">
          {/* Tracking Map Integration */}
          <TrackingMap
            shipmentId={shipment.id}
            origin={shipment.origin.port}
            destination={shipment.destination.port}
            progress={shipment.progress || 0}
            status={shipment.status}
          />

          {/* Route Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card-premium p-8 rounded-[2rem] border-white/10 relative overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-none"
          >
            <div className="grain-overlay opacity-[0.02]" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-8 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-500" />
              Détails de l'Itinéraire
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-10 relative">
              <div className="flex-1 w-full text-center md:text-left group/loc relative">
                <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-black mb-2">
                  Origine
                </span>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 group-hover:text-blue-500 transition-colors drop-shadow-sm">
                  {shipment.origin.port}
                </div>
                <div className="text-sm font-medium text-slate-500 mt-1 flex items-center justify-center md:justify-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {shipment.origin.country}
                </div>
              </div>

              <div className="hidden md:flex flex-col items-center flex-1 relative px-8">
                <div className="w-full h-[3px] bg-slate-100 dark:bg-slate-800 rounded-full relative overflow-hidden">
                  <motion.div
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80"
                  />
                  <div className="absolute inset-0 bg-blue-400/20 blur-sm"></div>
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="mt-6 text-[10px] font-black uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-5 py-2.5 rounded-2xl border border-blue-200 dark:border-blue-800/50 shadow-sm backdrop-blur-md flex items-center gap-2">
                  {shipment.transport_mode === "air" ? "✈️ Aérien" : "🚢 Maritime"}
                </motion.div>
              </div>

              <div className="flex-1 w-full text-center md:text-right group/loc relative">
                <span className="block text-[10px] text-slate-400 uppercase tracking-widest font-black mb-2">
                  Destination
                </span>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 group-hover:text-blue-500 transition-colors drop-shadow-sm">
                  {shipment.destination.port}
                </div>
                <div className="text-sm font-medium text-slate-500 mt-1 flex items-center justify-center md:justify-end gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {shipment.destination.country}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Capacity & Limits */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card-premium p-8 rounded-[2rem] border-white/10 relative overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-none"
          >
            <div className="grain-overlay opacity-[0.02]" />
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-500/20 rounded-xl">
                  <Package className="w-5 h-5 text-blue-500" />
                </div>
                Capacité & Limites (Groupage)
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAddPackageModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-black text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white dark:bg-blue-900/20 dark:hover:bg-blue-600 rounded-xl transition-all border border-blue-100 dark:border-blue-800/50 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Ajouter un Colis
              </motion.button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {shipment.transport_mode === "air" && (
                <div className="p-5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md rounded-[1.5rem] border border-white/50 dark:border-white/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 dark:hover:border-blue-800 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100 to-transparent dark:from-blue-900/40 rounded-bl-[2rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 relative z-10">
                    Poids Max
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors relative z-10 flex items-baseline gap-1">
                    {shipment.cargo.weight} <span className="text-xs font-bold text-slate-400">KG</span>
                  </div>
                </div>
              )}

              {shipment.transport_mode === "sea" && (
                <div className="p-5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md rounded-[1.5rem] border border-white/50 dark:border-white/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 dark:hover:border-blue-800 group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100 to-transparent dark:from-blue-900/40 rounded-bl-[2rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 relative z-10">
                    Volume Max
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors relative z-10 flex items-baseline gap-1">
                    {shipment.cargo.volume} <span className="text-xs font-bold text-slate-400">M³</span>
                  </div>
                </div>
              )}

              {/* Current Load Progress */}
              <div className="col-span-2 p-5 bg-slate-50/50 dark:bg-slate-800/30 backdrop-blur-md border border-slate-200 dark:border-white/5 rounded-[1.5rem] space-y-3 relative overflow-hidden">
                <div className="flex justify-between items-center mb-1 relative z-10">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest shadow-sm">
                    Remplissage Actuel
                  </span>
                  <span className="text-xs font-black text-slate-900 dark:text-white bg-white/50 dark:bg-slate-900/50 px-2 py-1 rounded-lg">
                    {shipment.transport_mode === "air"
                      ? `${(shipment.children || []).reduce((sum, c) => sum + (c.cargo?.weight || 0), 0)} / ${shipment.cargo.weight} kg`
                      : `${(shipment.children || []).reduce((sum, c) => sum + (c.cargo?.volume || 0), 0)} / ${shipment.cargo.volume} m³`}
                  </span>
                </div>

                {(() => {
                  const current = (shipment.children || []).reduce(
                    (sum, c) => sum + (c.cargo?.[shipment.transport_mode === "air" ? "weight" : "volume"] || 0),
                    0,
                  );
                  const max = shipment.cargo?.[shipment.transport_mode === "air" ? "weight" : "volume"] || 1;
                  const percentage = Math.min(100, Math.max(0, (current / max) * 100));
                  const isOverLimit = percentage > 90;

                  return (
                    <div className="w-full bg-slate-200/50 dark:bg-slate-700/50 rounded-full h-3 overflow-hidden relative z-10 shadow-inner">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full rounded-full transition-colors duration-500 shadow-sm ${isOverLimit ? "bg-gradient-to-r from-red-500 to-rose-400" : "bg-gradient-to-r from-blue-600 to-sky-400"}`}
                      >
                        <div className="w-full h-full opacity-30 bg-[length:10px_10px] animate-[slide_1s_linear_infinite] bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)]"></div>
                      </motion.div>
                    </div>
                  );
                })()}
                <div className="text-[10px] font-black tracking-widest text-slate-400 text-right uppercase relative z-10 flex items-center justify-end gap-1">
                  {/* Petite animation de pulse si 100% */}
                  {Math.round(shipment.transport_mode === "air" ? ((shipment.children || []).reduce((sum, c) => sum + (c.cargo?.weight || 0), 0) / (shipment.cargo.weight || 1)) * 100 : ((shipment.children || []).reduce((sum, c) => sum + (c.cargo?.volume || 0), 0) / (shipment.cargo.volume || 1)) * 100) >= 100 && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>}
                  {Math.round(
                    shipment.transport_mode === "air"
                      ? ((shipment.children || []).reduce(
                        (sum, c) => sum + (c.cargo?.weight || 0),
                        0,
                      ) /
                        (shipment.cargo.weight || 1)) *
                      100
                      : ((shipment.children || []).reduce(
                        (sum, c) => sum + (c.cargo?.volume || 0),
                        0,
                      ) /
                        (shipment.cargo.volume || 1)) *
                      100,
                  )}
                  %
                </div>
              </div>

              <div className="p-5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md rounded-[1.5rem] border border-white/50 dark:border-white/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-200 dark:hover:border-blue-800 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100 to-transparent dark:from-blue-900/40 rounded-bl-[2rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 relative z-10">
                  Type de Conteneur
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors uppercase tracking-wide relative z-10 mt-2">
                  {shipment.cargo.type || "Standard"}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Carrier & Service */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card-premium p-6 rounded-[2rem] border-white/10 relative overflow-hidden group shadow-xl shadow-slate-200/50 dark:shadow-none"
          >
            <div className="grain-overlay opacity-[0.02]" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
              <Truck className="w-3 h-3 text-blue-500" /> Transporteur
            </h3>

            <div className="flex items-center gap-4 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md p-4 rounded-2xl border border-white/50 dark:border-white/5 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-sky-400 p-[2px] rounded-2xl shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                  {shipment.carrier.logo ? (
                    <img src={shipment.carrier.logo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Truck className="w-6 h-6 text-blue-500 group-hover:animate-pulse" />
                  )}
                </div>
              </div>
              <div>
                <div className="font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors uppercase tracking-tight text-lg">
                  {shipment.carrier.name || "Nom non défini"}
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mt-0.5">
                  <Zap className="w-3 h-3 text-amber-500" />
                  {shipment.service_type === "express"
                    ? "Service Express"
                    : "Service Standard"}
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center px-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><FileText className="w-3 h-3" /> Prix estimé</span>
              <span className="text-xl font-black text-blue-600 dark:text-blue-400">
                {formatPrice(shipment.price)}
              </span>
            </div>
          </motion.div>

          {/* Dates */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card-premium p-6 rounded-[2rem] border-white/10 relative overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none"
          >
            <div className="grain-overlay opacity-[0.02]" />
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
              <Calendar className="w-3 h-3 text-blue-500" /> Planning
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 group p-3 rounded-2xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-900/30">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex flex-shrink-0 items-center justify-center border border-blue-100 dark:border-blue-800/50 group-hover:bg-blue-500 group-hover:border-transparent transition-all text-blue-600 group-hover:text-white shadow-sm">
                  <Anchor className="w-5 h-5 mt-1 relative bottom-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Départ Prévu</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {shipment.dates.departure
                      ? new Date(shipment.dates.departure).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                      : "Non défini"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 group p-3 rounded-2xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/30">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex flex-shrink-0 items-center justify-center border border-emerald-100 dark:border-emerald-800/50 group-hover:bg-emerald-500 group-hover:border-transparent transition-all text-emerald-600 group-hover:text-white shadow-sm">
                  <Clock className="w-5 h-5 mt-1 relative bottom-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arrivée Estimée</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {shipment.dates.arrival_estimated
                      ? new Date(
                        shipment.dates.arrival_estimated,
                      ).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                      : "Non défini"}
                  </div>
                </div>
              </div>

              {shipment.dates.arrival_actual && (
                <div className="flex items-center gap-4 group p-3 rounded-2xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/30">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex flex-shrink-0 items-center justify-center border border-emerald-100 dark:border-emerald-800/50 group-hover:bg-emerald-500 group-hover:border-transparent transition-all text-emerald-600 group-hover:text-white shadow-sm">
                    <CheckCircle2 className="w-5 h-5 mt-1 relative bottom-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arrivée Réelle</div>
                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                      {new Date(
                        shipment.dates.arrival_actual,
                      ).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Documents Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card-premium p-6 rounded-[2rem] border-white/10 relative overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none"
          >
            <div className="grain-overlay opacity-[0.02]" />
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <FileText className="w-3 h-3 text-blue-500" /> Documents
              </h3>
              <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 text-[10px] font-black uppercase text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white dark:bg-blue-900/20 dark:hover:bg-blue-600 rounded-xl transition-all border border-blue-100 dark:border-blue-800/50 shadow-sm">
                <Plus className="w-3 h-3" />
                Ajouter
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            </div>

            <div className="space-y-3">
              {documents.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-700/50 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30">
                  <p className="text-sm font-medium text-slate-400 italic">Aucun document rattaché.</p>
                </div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="group flex items-center justify-between p-3 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md rounded-[1.5rem] border border-white/50 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-800 transition-all hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 dark:bg-blue-500/20 rounded-xl border border-blue-100 dark:border-blue-500/30 group-hover:scale-110 transition-transform">
                        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{doc.name}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                      title="Télécharger"
                    >
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </a>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Status Modal */}
      {
        isStatusModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">Mettre à jour le statut</h3>
              <div className="grid gap-2">
                {[
                  { value: 'pending', label: 'En Attente (Confirmé)' },
                  { value: 'picked_up', label: 'Ramassé' },
                  { value: 'in_transit', label: 'En Transit' },
                  { value: 'customs', label: 'En Douane' },
                  { value: 'delivered', label: 'Livré' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusUpdate(opt.value)}
                    className={`p-3 rounded-xl text-left font-medium transition-colors ${shipment.status === opt.value
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="w-full py-2 text-gray-500 font-medium hover:text-gray-900"
              >
                Annuler
              </button>
            </div>
          </div>
        )
      }

      <EditShipmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        shipment={shipment}
        onSuccess={handleEditSuccess}
      />

      <AddShipmentModal
        isOpen={isAddPackageModalOpen}
        onClose={() => setIsAddPackageModalOpen(false)}
        onSuccess={() => {
          setIsAddPackageModalOpen(false);
          loadShipment(id || ""); // Refresh to see new load calculation
        }}
        parentShipment={shipment}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Supprimer l'expédition"
        message="Êtes-vous sûr de vouloir supprimer cette expédition ? Cette action est irréversible."
      />
    </motion.div>
  );
}
