import { useState, useEffect } from "react";
import {
  X,
  FileText,
  DollarSign,
  Calendar,
  Truck,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

interface QuoteDetailsModalProps {
  rfqId: string;
  onClose: () => void;
}

export default function QuoteDetailsModal({
  rfqId,
  onClose,
}: QuoteDetailsModalProps) {
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuote() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("quotes")
          .select(`
            *,
            forwarder:forwarder_id(
              company_name,
              rating
            )
          `)
          .eq("rfq_id", rfqId)
          .single();

        if (error) {
          console.error("No quote found", error);
        } else {
          setQuote(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchQuote();
  }, [rfqId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-2xl flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-2xl max-w-sm w-full text-center">
          <h3 className="text-xl font-bold mb-4">Aucun devis trouvé</h3>
          <p className="text-gray-500 mb-6">Ce RFQ n'a pas encore de devis associé ou une erreur s'est produite.</p>
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-xl w-full min-h-[44px]">Fermer</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden max-h-[90vh] overflow-y-auto">
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
                Proposé par {quote.forwarder?.company_name || "Prestataire inconnu"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            title="Fermer"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors min-h-[44px]"
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
                {quote.amount?.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: quote.currency || "XOF",
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Validité</span>
              </div>
              <p className="font-semibold text-gray-900">
                {quote.valid_until ? new Date(quote.valid_until).toLocaleDateString() : "Non spécifié"}
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Truck className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Transit</span>
              </div>
              <p className="font-semibold text-gray-900">
                {quote.transit_time || "Standard"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              Notes du prestataire
            </h3>
            <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-600 italic border border-gray-100">
              "{quote.notes || "Aucune note additionnelle."}"
            </div>
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
          <button className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/20 flex items-center gap-2 min-h-[44px]">
            <FileText className="w-4 h-4" />
            Télécharger PDF
          </button>
        </div>
      </div>
    </div>
  );
}
