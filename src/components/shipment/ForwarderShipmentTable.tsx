import { Shipment } from "../../services/shipmentService";
import {
  MoreHorizontal,
  MapPin,
  Calendar,
  Package,
  ArrowRight,
  Eye,
  Trash2,
} from "lucide-react";

interface ForwarderShipmentTableProps {
  shipments: Shipment[];
  onViewDetails?: (shipment: Shipment) => void;
  onUpdateStatus?: (shipment: Shipment) => void;
  onDelete?: (shipment: Shipment) => void;
}

export default function ForwarderShipmentTable({
  shipments,
  onViewDetails,
  onUpdateStatus,
  onDelete,
}: ForwarderShipmentTableProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-50 text-green-700 border-green-200";
      case "in_transit":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "customs":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "delivered":
        return "Livré";
      case "in_transit":
        return "En Transit";
      case "customs":
        return "Douane";
      case "cancelled":
        return "Annulé";
      case "pending":
        return "En Attente";
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Référence
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Route
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                ETA
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {shipments.map((shipment) => (
              <tr
                key={shipment.id}
                className="hover:bg-gray-50/50 transition-colors group"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-mono font-bold text-sm text-gray-900">
                      {shipment.tracking_number}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                      <Package className="w-3 h-3" />
                      {shipment.cargo.packages} colis •{" "}
                      {shipment.transport_mode === "sea"
                        ? `${shipment.cargo.volume} m³`
                        : `${shipment.cargo.weight} kg`}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">
                      {shipment.origin.port}
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-400" />
                    <span className="font-medium text-gray-700">
                      {shipment.destination.port}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {shipment.origin.country} → {shipment.destination.country}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {shipment.client?.full_name?.charAt(0) ||
                        shipment.client?.email?.charAt(0) ||
                        "C"}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {shipment.client?.full_name || "Client Inconnu"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {shipment.client?.email}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(shipment.status)}`}
                  >
                    {getStatusLabel(shipment.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {new Date(
                      shipment.dates.arrival_estimated,
                    ).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onViewDetails?.(shipment)}
                      className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                      title="Voir détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {shipment.status === "pending" && (
                      <button
                        onClick={() => onDelete?.(shipment)}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer (En Attente uniquement)"
                        aria-label="Supprimer l'expédition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onUpdateStatus?.(shipment)}
                      className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                    >
                      Mettre à jour
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
