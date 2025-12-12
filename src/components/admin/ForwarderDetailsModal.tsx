import {
  X,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Check,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Building2,
  Clock,
  Ban,
  PowerOff,
  PauseCircle,
  Trash2,
  Power,
  Edit,
  Star,
  TrendingUp,
} from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { ForwarderProfile } from "../../services/forwarderService";
import { QRCodeSVG } from "qrcode.react";

interface ForwarderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  forwarder: ForwarderProfile | null;
  onStatusUpdate: (
    id: string,
    status: "verified" | "rejected",
  ) => Promise<void>;
  onSuspend?: (id: string) => Promise<void>;
  onDeactivate?: (id: string) => Promise<void>;
  onActivate?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onUpdateInfo?: (id: string) => void;
  onContact?: (id: string) => void;
  onToggleFeature?: (id: string) => void;
  onTogglePromote?: (id: string) => void;
}

export default function ForwarderDetailsModal({
  isOpen,
  onClose,
  forwarder,
  onStatusUpdate,
  onSuspend,
  onDeactivate,
  onActivate,
  onDelete,
  onUpdateInfo,
  onContact,
  onToggleFeature,
  onTogglePromote,
}: ForwarderDetailsModalProps) {
  const { error: toastError } = useToast();
  if (!isOpen || !forwarder) return null;

  const getStatusBadge = (status: string, accountStatus: string) => {
    if (accountStatus === "suspended") {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
          <PauseCircle className="w-4 h-4" /> Suspendu
        </span>
      );
    }
    if (accountStatus === "inactive") {
      return (
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
          <PowerOff className="w-4 h-4" /> Inactif
        </span>
      );
    }

    switch (status) {
      case "verified":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <ShieldCheck className="w-4 h-4" /> Vérifié
          </span>
        );
      case "pending":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
            <Clock className="w-4 h-4" /> En attente
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <AlertTriangle className="w-4 h-4" /> Rejeté
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold text-xl">
              {forwarder.company_name.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {forwarder.company_name}
              </h2>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>ID: {forwarder.id}</span>
                <span>•</span>
                <span>
                  Inscrit le{" "}
                  {new Date(forwarder.joined_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(
              forwarder.verification_status,
              forwarder.account_status,
            )}
            <div className="bg-white p-1 rounded-lg border border-gray-100 shadow-sm">
              <QRCodeSVG
                value={`https://nextmove.com/forwarder/${forwarder.id}`}
                size={40}
              />
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Overview Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Informations de Contact
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a
                    href={`mailto:${forwarder.email}`}
                    className="hover:text-primary transition-colors"
                  >
                    {forwarder.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <a
                    href={`tel:${forwarder.phone}`}
                    className="hover:text-primary transition-colors"
                  >
                    {forwarder.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>
                    {forwarder.address}, {forwarder.country}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                Détails de l'Entreprise
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium text-gray-900">Transitaire</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Secteur</span>
                  <span className="font-medium text-gray-900">
                    Logistique Internationale
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Licence</span>
                  <span className="font-medium text-gray-900">Validée</span>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Documents Légaux
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {forwarder.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center p-4 border border-gray-200 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-all group cursor-pointer"
                >
                  <div className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm group-hover:shadow-md transition-all">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="ml-4 flex-1">
                    <h4 className="font-medium text-gray-900">{doc.name}</h4>
                    <p className="text-xs text-gray-500 uppercase">
                      {doc.type} • {doc.status}
                    </p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (doc.url === "#") {
                          toastError(
                            "Aperçu du document non disponible en mode démo",
                          );
                        } else {
                          window.open(doc.url, "_blank");
                        }
                      }}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Voir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions Footer */}
          <div className="bg-gray-50 -mx-6 -mb-6 p-6 border-t border-gray-100 flex flex-col gap-4 mt-8">
            {/* Primary Actions */}
            <div className="flex flex-wrap justify-end gap-3">
              {forwarder.verification_status === "pending" ? (
                <>
                  <button
                    onClick={() => onStatusUpdate(forwarder.id, "rejected")}
                    className="px-4 py-2 text-red-700 bg-red-50 hover:bg-red-100 rounded-xl font-medium transition-colors"
                  >
                    Rejeter la demande
                  </button>
                  <button
                    onClick={() => onStatusUpdate(forwarder.id, "verified")}
                    className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-xl font-medium shadow-lg shadow-green-600/20 transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Approuver le compte
                  </button>
                </>
              ) : (
                <>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(forwarder.id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Supprimer
                    </button>
                  )}

                  {forwarder.account_status === "active" ? (
                    <>
                      {onDeactivate && (
                        <button
                          onClick={() => onDeactivate(forwarder.id)}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors flex items-center gap-2"
                        >
                          <PowerOff className="w-4 h-4" /> Désactiver
                        </button>
                      )}
                      {onSuspend && (
                        <button
                          onClick={() => onSuspend(forwarder.id)}
                          className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-xl font-medium transition-colors flex items-center gap-2"
                        >
                          <PauseCircle className="w-4 h-4" /> Suspendre
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      {onActivate && (
                        <button
                          onClick={() => onActivate(forwarder.id)}
                          className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-xl font-medium shadow-lg shadow-green-600/20 transition-all flex items-center gap-2"
                        >
                          <Power className="w-4 h-4" /> Réactiver
                        </button>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Secondary Actions (Marketing & Management) */}
            {forwarder.verification_status === "verified" && (
              <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => onUpdateInfo && onUpdateInfo(forwarder.id)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <Edit className="w-4 h-4" /> Mettre à jour les infos
                </button>
                <button
                  onClick={() => onContact && onContact(forwarder.id)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" /> Contacter
                </button>
                <button
                  onClick={() =>
                    onToggleFeature && onToggleFeature(forwarder.id)
                  }
                  className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${forwarder.isFeatured ? "bg-yellow-50 text-yellow-700 border border-yellow-200" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  <Star
                    className={`w-4 h-4 ${forwarder.isFeatured ? "fill-yellow-500 text-yellow-500" : ""}`}
                  />
                  {forwarder.isFeatured ? "En vedette" : "Mettre en vedette"}
                </button>
                <button
                  onClick={() =>
                    onTogglePromote && onTogglePromote(forwarder.id)
                  }
                  className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${forwarder.isPromoted ? "bg-purple-50 text-purple-700 border border-purple-200" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  <TrendingUp
                    className={`w-4 h-4 ${forwarder.isPromoted ? "text-purple-600" : ""}`}
                  />
                  {forwarder.isPromoted ? "Promu" : "Promouvoir"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
