import {
  X,
  FileText,
  DollarSign,
  Calendar,
  Truck,
} from "lucide-react";

interface QuoteDetailsModalProps {
  rfqId: string;
  onClose: () => void;
}

export default function QuoteDetailsModal({
  rfqId,
  onClose,
}: QuoteDetailsModalProps) {
  // Mock quote data
  const quote = {
    id: "Q-2024-001",
    amount: 1250.0,
    currency: "EUR",
    valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    forwarder: {
      name: "Global Freight Solutions",
      rating: 4.8,
    },
    transit_time: "14-18 jours",
    incoterms: "CIF",
    notes: "Inclut tous les frais de port et de douane à l'origine.",
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Devis pour {rfqId}
              </h2>
              <p className="text-sm text-gray-500">
                Proposé par {quote.forwarder.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Fermer"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-center py-6 bg-green-50 rounded-2xl border border-green-100">
            <div className="text-center">
              <p className="text-sm text-green-600 font-medium mb-1">
                Montant Total
              </p>
              <p className="text-4xl font-bold text-green-700">
                {quote.amount.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: quote.currency,
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Validité</span>
              </div>
              <p className="font-semibold text-gray-900">
                {new Date(quote.valid_until).toLocaleDateString()}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Truck className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Transit</span>
              </div>
              <p className="font-semibold text-gray-900">
                {quote.transit_time}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              Notes du prestataire
            </h3>
            <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600 italic border border-gray-100">
              "{quote.notes}"
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
          <button className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/20 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Télécharger PDF
          </button>
        </div>
      </div>
    </div>
  );
}
