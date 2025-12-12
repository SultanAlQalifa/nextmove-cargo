import {
  X,
  Package,
  MapPin,
  Calendar,
  Truck,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface ShipmentDetailsModalProps {
  shipment: {
    id: string;
    client: string;
    origin: string;
    destination: string;
    status: string;
    created_at: string;
    weight: string;
    type: string;
  };
  onClose: () => void;
  onTrack: () => void;
}

export default function ShipmentDetailsModal({
  shipment,
  onClose,
  onTrack,
}: ShipmentDetailsModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Livré":
        return "bg-green-100 text-green-700";
      case "En transit":
        return "bg-blue-100 text-blue-700";
      case "En attente":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Livré":
        return <CheckCircle className="w-5 h-5" />;
      case "En transit":
        return <Truck className="w-5 h-5" />;
      case "En attente":
        return <Clock className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Détails de l'expédition
              </h2>
              <p className="text-sm text-gray-500">{shipment.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg border border-gray-100 shadow-sm">
              <QRCodeSVG
                value={`https://nextmove.com/track/${shipment.id}`}
                size={48}
              />
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Status Banner */}
          <div
            className={`flex items-center gap-3 p-4 rounded-xl ${getStatusColor(shipment.status)} bg-opacity-50`}
          >
            {getStatusIcon(shipment.status)}
            <div>
              <p className="font-medium">Statut: {shipment.status}</p>
              <p className="text-xs opacity-80">
                Dernière mise à jour:{" "}
                {new Date(shipment.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Route Info */}
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-100 -z-10"></div>

            <div className="bg-white pr-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  Origine
                </span>
              </div>
              <p className="font-semibold text-gray-900">{shipment.origin}</p>
            </div>

            <div className="bg-white px-2">
              <div className="p-2 bg-gray-50 rounded-full">
                <Truck className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="bg-white pl-4 text-right">
              <div className="flex items-center gap-2 text-gray-500 mb-1 justify-end">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Destination
                </span>
                <MapPin className="w-4 h-4" />
              </div>
              <p className="font-semibold text-gray-900">
                {shipment.destination}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Client</p>
                  <p className="text-gray-900">{shipment.client}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Date de création
                  </p>
                  <p className="text-gray-900">
                    {new Date(shipment.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Détails du colis
                  </p>
                  <p className="text-gray-900">
                    {shipment.type} • {shipment.weight}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
          >
            Fermer
          </button>
          <button
            onClick={onTrack}
            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/20"
          >
            Suivre le colis
          </button>
        </div>
      </div>
    </div>
  );
}
