import {
  X,
  Truck,
  MapPin,
  CheckCircle,
  FileText,
} from "lucide-react";
import ShipmentTracker from "../shipment/ShipmentTracker";

interface TrackingDetailsModalProps {
  shipmentId: string;
  status: any;
  shipment?: any; // The full shipment object containing logs
  onClose: () => void;
  onViewDetails: () => void;
}

export default function TrackingDetailsModal({
  shipmentId,
  status,
  shipment,
  onClose,
  onViewDetails,
}: TrackingDetailsModalProps) {

  // Real tracking data parsed from the shipment object
  const trackingEvents = (shipment?.logs || []).map((log: any) => ({
    id: log.id || Math.random().toString(),
    status: log.status || "Mise à jour",
    location: log.location || "Localisation non spécifiée",
    timestamp: log.created_at || new Date().toISOString(),
    description: log.notes || "Suivi mis à jour",
    completed: true,
  })).sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // If no logs exist, provide a fallback generic "Created" event so the modal isn't totally empty
  if (trackingEvents.length === 0) {
    trackingEvents.push({
      id: "initial",
      status: "Expédition Créée",
      location: shipment?.origin?.port || "Origine",
      timestamp: shipment?.created_at || new Date().toISOString(),
      description: "L'expédition a été enregistrée dans notre système.",
      completed: true
    });
  }

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Suivi du colis
              </h2>
              <p className="text-sm text-gray-500">{shipmentId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            title="Fermer"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors min-h-[44px]"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="bg-white border-b border-gray-100">
          <ShipmentTracker status={status} className="px-6" />
        </div>

        <div className="p-6 max-h-[50vh] overflow-y-auto">
          <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
            {trackingEvents.map((event: any, index: number) => (
              <div key={event.id} className="relative">
                <div
                  className={`absolute -left-[34px] p-1.5 rounded-full border-4 border-white shadow-sm ${index === 0 ? "bg-green-500" : "bg-gray-200"}`}
                >
                  {index === 0 ? (
                    <CheckCircle className="w-3 h-3 text-white" />
                  ) : (
                    <div className="w-3 h-3 rounded-full" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p
                      className={`font-semibold ${index === 0 ? "text-gray-900" : "text-gray-500"}`}
                    >
                      {event.status}
                    </p>
                    <span className="text-xs text-gray-400">
                      {new Date(event.timestamp).toLocaleDateString()}{" "}
                      {new Date(event.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{event.description}</p>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <MapPin className="w-3 h-3" />
                    {event.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium min-h-[44px]"
          >
            Fermer
          </button>
          <button
            onClick={onViewDetails}
            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/20 flex items-center gap-2 min-h-[44px]"
          >
            <FileText className="w-4 h-4" />
            Voir Facture Intégrale
          </button>
        </div>
      </div>
    </div>
  );
}
