import {
  X,
  FileText,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Package,
  Truck,
  Download,
} from "lucide-react";
import { POD } from "../../services/podService";
import DocumentPreviewModal from "../common/DocumentPreviewModal";
import { useState } from "react";

interface PODDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pod: POD | null;
  onVerify: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

export default function PODDetailsModal({
  isOpen,
  onClose,
  pod,
  onVerify,
  onReject,
}: PODDetailsModalProps) {
  if (!isOpen || !pod) return null;

  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreview = (doc: { url: string; name: string; type: string }) => {
    setPreviewDoc(doc);
    setIsPreviewOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Vérifié
          </span>
        );
      case "rejected":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Rejeté
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
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                POD - Expédition {pod.shipment_id}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Soumis le {new Date(pod.submitted_at).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={onClose}
              title="Fermer"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            {/* Header Info */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-gray-50 p-4 rounded-xl">
              <div>
                <p className="text-sm text-gray-500 mb-1">Numéro de suivi</p>
                <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Package className="w-5 h-5 text-gray-400" />
                  {pod.tracking_number}
                </p>
              </div>
              <div>{getStatusBadge(pod.status)}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Forwarder Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gray-400" /> Prestataire
                </h3>
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <p className="font-medium text-gray-900">
                    {pod.forwarder.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {pod.forwarder.id}
                  </p>
                </div>
              </div>

              {/* Client Info */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" /> Client
                </h3>
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <p className="font-medium text-gray-900">{pod.client.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {pod.client.id}
                  </p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" /> Documents
                Justificatifs
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pod.documents.length > 0 ? (
                  pod.documents.map((doc, index) => (
                    <div
                      key={index}
                      onClick={() => handlePreview(doc)}
                      className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
                    >
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {doc.name}
                        </p>
                        <p className="text-xs text-gray-500">{doc.type}</p>
                      </div>
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex"
                      >
                        <a
                          href={doc.url}
                          download
                          title={`Télécharger ${doc.name}`}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-white rounded-lg transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Aucun document joint
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            {pod.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Notes
                </h3>
                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl text-sm">
                  {pod.notes}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {pod.status === "pending" && (
            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => onReject(pod.id)}
                className="px-4 py-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Rejeter
              </button>
              <button
                onClick={() => onVerify(pod.id)}
                className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-xl font-medium shadow-lg shadow-green-600/20 transition-all flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Valider
              </button>
            </div>
          )}
        </div>
      </div>

      <DocumentPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        document={previewDoc}
      />
    </>
  );
}
