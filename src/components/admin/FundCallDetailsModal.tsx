import {
  X,
  FileText,
  Calendar,
  User,
  Wallet,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { FundCall } from "../../services/fundCallService";

interface FundCallDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fundCall: FundCall | null;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export default function FundCallDetailsModal({
  isOpen,
  onClose,
  fundCall,
  onApprove,
  onReject,
}: FundCallDetailsModalProps) {
  if (!isOpen || !fundCall) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Approuvé
          </span>
        );
      case "rejected":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Rejeté
          </span>
        );
      case "paid":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1">
            <Wallet className="w-3 h-3" /> Payé
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 flex items-center gap-1">
            <Calendar className="w-3 h-3" /> En attente
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Appel de Fonds {fundCall.reference}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Soumis le {new Date(fundCall.created_at).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Header Info */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-gray-50 p-4 rounded-xl">
            <div>
              <p className="text-sm text-gray-500 mb-1">Montant demandé</p>
              <p className="text-2xl font-bold text-gray-900">
                {fundCall.amount.toLocaleString()} {fundCall.currency}
              </p>
            </div>
            <div>{getStatusBadge(fundCall.status)}</div>
          </div>

          {/* Requester Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" /> Demandeur
            </h3>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="font-medium text-gray-900">
                {fundCall.requester.name}
              </p>
              <p className="text-sm text-gray-500">
                {fundCall.requester.email}
              </p>
              <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                {fundCall.requester.role === "forwarder"
                  ? "Transitaire"
                  : "Partenaire"}
              </span>
            </div>
          </div>

          {/* Reason */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" /> Motif
            </h3>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {fundCall.reason}
              </p>
            </div>
          </div>

          {/* Documents */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" /> Pièces jointes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fundCall.attachments.length > 0 ? (
                fundCall.attachments.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                  >
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {doc}
                      </p>
                      <p className="text-xs text-gray-500">Document PDF</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">
                  Aucune pièce jointe
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {fundCall.status === "pending" && (
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={() => onReject(fundCall.id)}
              className="px-4 py-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Rejeter
            </button>
            <button
              onClick={() => onApprove(fundCall.id)}
              className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-xl font-medium shadow-lg shadow-green-600/20 transition-all flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" /> Approuver
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
