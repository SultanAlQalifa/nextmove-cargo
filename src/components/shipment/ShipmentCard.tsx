import { Shipment } from "../../services/shipmentService";
import {
  Truck,
  Ship,
  Plane,
  Package,
  MapPin,
  Calendar,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  CreditCard
} from "lucide-react";
import ShipmentTracker from "./ShipmentTracker";
import { generateInvoicePDF } from "../../utils/invoiceGenerator";

interface ShipmentCardProps {
  shipment: Shipment;
  onClick?: () => void;
  onPay?: () => void;
}

export default function ShipmentCard({ shipment, onClick, onPay }: ShipmentCardProps) {
  const getStatusColor = (status: string) => {
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

  const handleDownloadInvoice = () => {
    generateInvoicePDF({
      invoiceNumber: `INV-${shipment.tracking_number}`,
      date: new Date(shipment.created_at || Date.now()),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // Net 30
      client: {
        name: shipment.client?.full_name || "Client",
        phone: shipment.client?.phone || "",
        email: shipment.client?.email || "",
      },
      shipment: {
        trackingNumber: shipment.tracking_number,
        origin: `${shipment.origin.port}, ${shipment.origin.country}`,
        destination: `${shipment.destination.port}, ${shipment.destination.country}`,
        weight: `${shipment.cargo.weight} kg`,
        packages: shipment.cargo.packages,
      },
      items: [
        {
          description: `Fret ${shipment.transport_mode === "air" ? "Aérien" : "Maritime"}`,
          amount: shipment.price,
        },
        { description: "Frais de dossier", amount: 15000 }, // Example fixed fee
      ],
      total: shipment.price + 15000,
      currency: "XOF",
      status: shipment.status === "delivered" ? "PAID" : "UNPAID",
    });
  };

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 cursor-pointer overflow-hidden group"
    >
      {/* Header */}
      <div className="p-5 border-b border-gray-50 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-sm font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {shipment.tracking_number}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(shipment.status)}`}
            >
              {getStatusLabel(shipment.status)}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <Package className="w-3 h-3" /> {shipment.carrier.name}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">ETA</p>
          <p className="font-bold text-gray-900">
            {new Date(shipment.dates.arrival_estimated).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Route */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-6 relative">
          {/* Progress Line Background */}
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-100 -z-10"></div>

          {/* Origin */}
          <div className="flex flex-col items-start bg-white pr-2">
            <div className="w-3 h-3 rounded-full bg-gray-300 mb-2 border-2 border-white shadow-sm"></div>
            <p className="font-bold text-gray-900 text-sm">
              {shipment.origin.port}
            </p>
            <p className="text-xs text-gray-500">{shipment.origin.country}</p>
          </div>

          {/* Transport Icon */}
          <div className="bg-white px-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary transform group-hover:scale-110 transition-transform">
              <Ship className="w-4 h-4" />
            </div>
          </div>

          {/* Destination */}
          <div className="flex flex-col items-end bg-white pl-2">
            <div
              className={`w-3 h-3 rounded-full mb-2 border-2 border-white shadow-sm ${shipment.status === "delivered" ? "bg-green-500" : "bg-gray-300"}`}
            ></div>
            <p className="font-bold text-gray-900 text-sm">
              {shipment.destination.port}
            </p>
            <p className="text-xs text-gray-500">
              {shipment.destination.country}
            </p>
          </div>
        </div>

        {/* Visual Tracker */}
        <div className="mt-4">
          <ShipmentTracker status={shipment.status as any} />
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-50 flex justify-between items-center">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Package className="w-3 h-3" /> {shipment.cargo.packages} colis
          </span>
          <span className="flex items-center gap-1">
            <span className="font-bold">{shipment.cargo.weight}</span> kg
          </span>
        </div>
        <div className="flex items-center gap-3">
          {shipment.status === 'pending_payment' && onPay && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPay();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm animate-pulse"
              title="Payer l'expédition"
            >
              <CreditCard className="w-3 h-3" /> Payer
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadInvoice();
            }}
            className="text-gray-400 hover:text-gray-600 text-xs font-bold hover:underline flex items-center gap-1 transition-colors"
            title="Télécharger la facture"
          >
            <FileText className="w-3 h-3" /> Facture
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Default to client view if not specified, 
              // or rely on the parent onClick if provided, but specifically for explicit action:
              if (onClick) onClick();
              else window.location.href = `/dashboard/client/shipments/${shipment.id}`;
            }}
            className="text-primary text-xs font-bold hover:underline flex items-center gap-1"
          >
            Voir détails <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
