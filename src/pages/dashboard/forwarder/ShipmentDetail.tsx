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
  AlertCircle,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import { shipmentService, Shipment, ShipmentDocument } from "../../../services/shipmentService";
import { useToast } from "../../../contexts/ToastContext";
import { useCurrency } from "../../../contexts/CurrencyContext";
import EditShipmentModal from "../../../components/dashboard/EditShipmentModal";
import AddShipmentModal from "../../../components/dashboard/AddShipmentModal";
import ConfirmationModal from "../../../components/common/ConfirmationModal";

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
  const [newStatus, setNewStatus] = useState<string>("");

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
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate("/dashboard/forwarder/shipments")}
          className="flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Retour aux expéditions
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Clock className="w-4 h-4" />
            Changer Statut
          </button>

          {shipment.status === "pending" && (
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 text-red-600 font-medium rounded-xl hover:bg-red-100 transition-colors shadow-sm"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          )}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Edit className="w-4 h-4" />
            Modifier
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            {shipment.tracking_number}
            <StatusBadge status={shipment.status} />
          </h1>
          <p className="text-gray-500 mt-1">
            Créée le {new Date(shipment.created_at || "").toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="md:col-span-2 space-y-6">
          {/* Route Info */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-400" />
              Itinéraire
            </h3>
            <div className="flex flex-col md:flex-row items-center gap-8 relative">
              <div className="flex-1 w-full text-center md:text-left">
                <span className="block text-xs uppercase text-gray-400 font-medium tracking-wider mb-1">
                  Origine
                </span>
                <div className="text-xl font-bold text-gray-900">
                  {shipment.origin.port}
                </div>
                <div className="text-sm text-gray-600">
                  {shipment.origin.country}
                </div>
              </div>

              <div className="hidden md:flex flex-col items-center flex-1">
                <div className="w-full h-0.5 bg-gray-200 relative top-3">
                  <div className="absolute right-0 -top-1.5 w-3 h-3 bg-gray-300 rounded-full"></div>
                  <div className="absolute left-0 -top-1.5 w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
                <div className="mt-4 bg-gray-50 px-3 py-1 rounded-full text-xs font-medium text-gray-600 flex items-center gap-1">
                  {shipment.transport_mode === "air" ? (
                    <p>✈️ Aérien</p>
                  ) : (
                    <p>🚢 Maritime</p>
                  )}
                </div>
              </div>

              <div className="flex-1 w-full text-center md:text-right">
                <span className="block text-xs uppercase text-gray-400 font-medium tracking-wider mb-1">
                  Destination
                </span>
                <div className="text-xl font-bold text-gray-900">
                  {shipment.destination.port}
                </div>
                <div className="text-sm text-gray-600">
                  {shipment.destination.country}
                </div>
              </div>
            </div>
          </div>

          {/* Capacity & Limits */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-400" />
                Capacité & Limites (Groupage)
              </h3>
              <button
                onClick={() => setIsAddPackageModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
              >
                <Plus className="w-3 h-3" />
                Ajouter un Colis
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {shipment.transport_mode === "air" && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="text-xs text-blue-600 font-medium mb-1 uppercase tracking-wide">
                    Poids Max Autorisé
                  </div>
                  <div className="font-bold text-blue-900 text-lg">
                    {shipment.cargo.weight} kg
                  </div>
                </div>
              )}

              {shipment.transport_mode === "sea" && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                  <div className="text-xs text-blue-600 font-medium mb-1 uppercase tracking-wide">
                    Volume Max Autorisé
                  </div>
                  <div className="font-bold text-blue-900 text-lg">
                    {shipment.cargo.volume} m³
                  </div>
                </div>
              )}

              {/* Current Load Progress */}
              <div className="col-span-2 p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                    Remplissage Actuel
                  </span>
                  <span className="text-xs font-bold text-gray-700">
                    {shipment.transport_mode === "air"
                      ? `${(shipment.children || []).reduce((sum, c) => sum + (c.cargo?.weight || 0), 0)} / ${shipment.cargo.weight} kg`
                      : `${(shipment.children || []).reduce((sum, c) => sum + (c.cargo?.volume || 0), 0)} / ${shipment.cargo.volume} m³`}
                  </span>
                </div>

                {(() => {
                  const current = (shipment.children || []).reduce(
                    (sum, c) =>
                      sum +
                      (c.cargo?.[
                        shipment.transport_mode === "air" ? "weight" : "volume"
                      ] || 0),
                    0,
                  );
                  const max =
                    shipment.cargo?.[
                    shipment.transport_mode === "air" ? "weight" : "volume"
                    ] || 1;
                  const percentage = Math.min(
                    100,
                    Math.max(0, (current / max) * 100),
                  );
                  const isOverLimit = percentage > 90;

                  return (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${isOverLimit ? "bg-red-500" : "bg-blue-600"}`}
                        ref={(el) => {
                          if (el) el.style.width = `${percentage}%`;
                        }}
                      />
                    </div>
                  );
                })()}
                <div className="text-xs text-gray-400 text-right">
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
                  % rempli
                </div>
              </div>

              <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                <div className="text-xs text-gray-500 font-medium mb-1">
                  Type de Conteneur
                </div>
                <div className="font-semibold text-gray-900 text-sm">
                  {shipment.cargo.type || "Standard"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Carrier & Service */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Transporteur
            </h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {shipment.carrier.name || "Nom non défini"}
                </div>
                <div className="text-xs text-gray-500">
                  {shipment.service_type === "express"
                    ? "Service Express"
                    : "Service Standard"}
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Prix estimé</span>
                <span className="font-bold text-gray-900">
                  {formatPrice(shipment.price)}
                </span>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Planning
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <div className="text-sm text-gray-500">Départ Prévu</div>
                  <div className="font-medium text-gray-900">
                    {shipment.dates.departure
                      ? new Date(shipment.dates.departure).toLocaleDateString()
                      : "Non défini"}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <div className="text-sm text-gray-500">Arrivée Estimée</div>
                  <div className="font-medium text-gray-900">
                    {shipment.dates.arrival_estimated
                      ? new Date(
                        shipment.dates.arrival_estimated,
                      ).toLocaleDateString()
                      : "Non défini"}
                  </div>
                </div>
              </div>
              {shipment.dates.arrival_actual && (
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />
                  <div>
                    <div className="text-sm text-gray-500">Arrivée Réelle</div>
                    <div className="font-medium text-gray-900">
                      {new Date(
                        shipment.dates.arrival_actual,
                      ).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Documents
              </h3>
              <label className="cursor-pointer flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100">
                <Plus className="w-3 h-3" />
                Ajouter
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            </div>

            <div className="space-y-3">
              {documents.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Aucun document</p>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg border border-gray-200">
                        <FileText className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        <p className="text-xs text-gray-500">{new Date(doc.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4 rotate-180" /> {/* Download/External Link Icon substitute */}
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
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
    </div >
  );
}
