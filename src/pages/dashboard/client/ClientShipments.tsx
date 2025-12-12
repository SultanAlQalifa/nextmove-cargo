import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import { Package, Search, Filter, RefreshCw } from "lucide-react";
import { shipmentService, Shipment } from "../../../services/shipmentService";
import ShipmentCard from "../../../components/shipment/ShipmentCard";
import PaymentModal from "../../../components/payment/PaymentModal";
import { useToast } from "../../../contexts/ToastContext";

export default function ClientShipments() {
  const { success } = useToast();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "delivered">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShipmentForPayment, setSelectedShipmentForPayment] = useState<Shipment | null>(null);

  useEffect(() => {
    loadShipments();
  }, []);

  const loadShipments = async () => {
    setLoading(true);
    try {
      const data = await shipmentService.getClientShipments();
      setShipments(data);
    } catch (error) {
      console.error("Error loading shipments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setSelectedShipmentForPayment(null);
    success("Paiement initié avec succès !");
    loadShipments(); // Refresh list to update status
  };

  const filteredShipments = shipments.filter((shipment) => {
    const matchesSearch =
      shipment.tracking_number
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      shipment.origin.port.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.destination.port
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "active")
      return !["delivered", "completed", "cancelled"].includes(shipment.status);
    if (filter === "delivered")
      return ["delivered", "completed"].includes(shipment.status);

    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mes Expéditions"
        subtitle="Suivez vos marchandises en temps réel"
        action={{
          label: "Nouvelle Expédition",
          onClick: () =>
            (window.location.href = "/dashboard/client/rfq/create"),
        }}
      />

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === "all"
              ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20"
              : "text-gray-500 hover:bg-gray-50"
              }`}
          >
            Toutes
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

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="N° Suivi, Port..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <button
            onClick={loadShipments}
            title="Actualiser les expéditions"
            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 bg-gray-100 rounded-2xl animate-pulse"
            ></div>
          ))}
        </div>
      ) : filteredShipments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShipments.map((shipment) => (
            <ShipmentCard
              key={shipment.id}
              shipment={shipment}
              onPay={() => setSelectedShipmentForPayment(shipment)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            Aucune expédition trouvée
          </h3>
          <p className="text-gray-500 mt-1">
            Essayez de modifier vos filtres ou créez une nouvelle demande.
          </p>
        </div>
      )}

      {selectedShipmentForPayment && (
        <PaymentModal
          isOpen={!!selectedShipmentForPayment}
          onClose={() => setSelectedShipmentForPayment(null)}
          onSuccess={handlePaymentSuccess}
          planName={`Expédition ${selectedShipmentForPayment.tracking_number}`}
          amount={selectedShipmentForPayment.price}
          currency={selectedShipmentForPayment.service_type === 'express' ? 'XOF' : 'XOF'}
          allowedMethods={['wave', 'wallet', 'cash']} // Enforcing strict methods from list
        />
      )}
    </div>
  );
}
