import {
  X,
  FileText,
  MapPin,
  Calendar,
  Package,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface RFQDetailsModalProps {
  rfq: {
    id: string;
    client: string;
    destination: string;
    origin: string;
    status: string;
    created_at: string;
    items: number;
  };
  onClose: () => void;
  onViewQuote: () => void;
}

export default function RFQDetailsModal({
  rfq,
  onClose,
  onViewQuote,
}: RFQDetailsModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Pending Quote":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-blue-100 text-blue-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="w-5 h-5" />;
      case "Pending Quote":
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
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Détails de la RFQ
              </h2>
              <p className="text-sm text-gray-500">{rfq.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Status Banner */}
          <div
            className={`flex items-center gap-3 p-4 rounded-xl ${getStatusColor(rfq.status)} bg-opacity-50`}
          >
            {getStatusIcon(rfq.status)}
            <div>
              <p className="font-medium">Statut: {rfq.status}</p>
              <p className="text-xs opacity-80">
                Dernière mise à jour:{" "}
                {new Date(rfq.created_at).toLocaleDateString()}
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
              <p className="font-semibold text-gray-900">{rfq.origin}</p>
            </div>

            <div className="bg-white px-2">
              <div className="p-2 bg-gray-50 rounded-full">
                <Package className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div className="bg-white pl-4 text-right">
              <div className="flex items-center gap-2 text-gray-500 mb-1 justify-end">
                <span className="text-xs font-medium uppercase tracking-wider">
                  Destination
                </span>
                <MapPin className="w-4 h-4" />
              </div>
              <p className="font-semibold text-gray-900">{rfq.destination}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Client</p>
                  <p className="text-gray-900">{rfq.client}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Date de création
                  </p>
                  <p className="text-gray-900">
                    {new Date(rfq.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Package className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Marchandises
                  </p>
                  <p className="text-gray-900">{rfq.items} articles</p>
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
            onClick={onViewQuote}
            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/20"
          >
            Voir le devis
          </button>
        </div>
      </div>
    </div>
  );
}
