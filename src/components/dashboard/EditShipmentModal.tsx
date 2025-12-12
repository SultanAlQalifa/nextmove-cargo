import { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { shipmentService, Shipment } from "../../services/shipmentService";
import { useToast } from "../../contexts/ToastContext";
import { useCurrency } from "../../contexts/CurrencyContext";

interface EditShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  onSuccess: (updatedShipment: Shipment) => void;
}

export default function EditShipmentModal({
  isOpen,
  onClose,
  shipment,
  onSuccess,
}: EditShipmentModalProps) {
  const { success, error } = useToast();
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    status: "pending",
    carrier_name: "",
    price: "",
    cargo_weight: "",
    cargo_volume: "",
    cargo_packages: "",
    cargo_type: "",
    departure_date: "",
    arrival_estimated_date: "",
    arrival_actual_date: "",
  });

  useEffect(() => {
    if (shipment) {
      setFormData({
        status: shipment.status,
        carrier_name: shipment.carrier.name || "",
        price: shipment.price?.toString() || "0",
        cargo_weight: shipment.cargo.weight?.toString() || "0",
        cargo_volume: shipment.cargo.volume?.toString() || "0",
        cargo_packages: shipment.cargo.packages?.toString() || "0",
        cargo_type: shipment.cargo.type || "",
        departure_date: shipment.dates.departure || "",
        arrival_estimated_date: shipment.dates.arrival_estimated || "",
        arrival_actual_date: shipment.dates.arrival_actual || "",
      });
    }
  }, [shipment, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipment) return;

    setLoading(true);
    try {
      const updates: Partial<Shipment> = {
        status: formData.status as any,
        carrier: { name: formData.carrier_name },
        price: parseFloat(formData.price) || 0,
        cargo: {
          ...shipment.cargo,
          weight: parseFloat(formData.cargo_weight) || 0,
          volume: parseFloat(formData.cargo_volume) || 0,
          packages: parseInt(formData.cargo_packages) || 0,
          type: formData.cargo_type,
        },
        dates: {
          departure: formData.departure_date,
          arrival_estimated: formData.arrival_estimated_date,
          arrival_actual: formData.arrival_actual_date,
        },
      };

      const updated = await shipmentService.updateShipment(
        shipment.id,
        updates,
      );
      success("Expédition mise à jour avec succès");
      onSuccess(updated);
      onClose();
    } catch (err) {
      console.error("Update error:", err);
      error("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">
            Modifier l'expédition
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Fermer"
            title="Fermer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Status & Carrier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Statut
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                aria-label="Statut de l'expédition"
                title="Statut de l'expédition"
              >
                <option value="pending">En Attente</option>
                <option value="picked_up">Ramassé</option>
                <option value="in_transit">En Transit</option>
                <option value="customs">En Douane</option>
                <option value="delivered">Livré</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Transporteur
              </label>
              <input
                type="text"
                value={formData.carrier_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    carrier_name: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="Nom du transporteur"
                aria-label="Nom du transporteur"
                title="Nom du transporteur"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Départ Prévu
              </label>
              <input
                type="date"
                value={formData.departure_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    departure_date: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                aria-label="Date de départ prévue"
                title="Date de départ prévue"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Arrivée Estimée
              </label>
              <input
                type="date"
                value={formData.arrival_estimated_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    arrival_estimated_date: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                aria-label="Date d'arrivée estimée"
                title="Date d'arrivée estimée"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Arrivée Réelle
              </label>
              <input
                type="date"
                value={formData.arrival_actual_date}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    arrival_actual_date: e.target.value,
                  }))
                }
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
                aria-label="Date d'arrivée réelle"
                title="Date d'arrivée réelle"
              />
            </div>
          </div>

          {/* Cargo */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">
              Détails Colis
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {shipment?.transport_mode === "air" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">
                    Poids Max (kg)
                  </label>
                  <input
                    type="number"
                    value={formData.cargo_weight}
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 text-gray-500 rounded-lg border border-gray-200 text-sm cursor-not-allowed"
                    aria-label="Poids maximum (Lecture seule)"
                    title="Cette limite est définie par l'administrateur"
                  />
                </div>
              )}

              {shipment?.transport_mode === "sea" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500">
                    Volume Max (m³)
                  </label>
                  <input
                    type="number"
                    value={formData.cargo_volume}
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 text-gray-500 rounded-lg border border-gray-200 text-sm cursor-not-allowed"
                    aria-label="Volume maximum (Lecture seule)"
                    title="Cette limite est définie par l'administrateur"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">
                  Nombre Colis
                </label>
                <input
                  type="number"
                  value={formData.cargo_packages}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cargo_packages: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm"
                  aria-label="Nombre de colis"
                  title="Nombre de colis"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-500">
                  Type de Colis
                </label>
                <input
                  type="text"
                  value={formData.cargo_type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cargo_type: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm"
                  aria-label="Type de colis"
                  title="Type de colis"
                />
              </div>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Prix Total
            </label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, price: e.target.value }))
              }
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              aria-label="Prix total de l'expédition"
              title="Prix total de l'expédition"
            />
            <p className="text-xs text-gray-500">
              Le prix sera affiché comme{" "}
              {formatPrice(parseFloat(formData.price) || 0)}
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors"
              aria-label="Annuler les modifications"
              title="Annuler les modifications"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-2.5 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 ${loading ? "opacity-75 cursor-not-allowed" : ""}`}
            >
              <Save className="w-4 h-4" />
              {loading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
