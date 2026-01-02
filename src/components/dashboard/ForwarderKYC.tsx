import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { forwarderService } from "../../services/forwarderService";
import { storageService } from "../../services/storageService";
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Shield,
} from "lucide-react";

export default function ForwarderKYC() {
  const { user } = useAuth();
  const { error: toastError } = useToast();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const REQUIRED_DOCUMENTS = [
    {
      id: "registre_commerce",
      label: "Registre de Commerce (RCCM)",
      description: "Copie du registre de commerce de l'entreprise.",
    },
    {
      id: "ninea",
      label: "NINEA",
      description:
        "Numéro d'Identification Nationale des Entreprises et Associations.",
    },
    {
      id: "licence_transport",
      label: "Licence de Transport",
      description: "Agrément ou licence de prestataire valide.",
    },
    {
      id: "assurance_rc",
      label: "Assurance RC Pro",
      description:
        "Attestation d'assurance Responsabilité Civile Professionnelle.",
    },
  ];

  useEffect(() => {
    loadDocuments();
  }, [user]);

  const loadDocuments = async () => {
    if (!user) return;
    try {
      const docs = await forwarderService.getDocuments(user.id);
      setDocuments(docs);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (docType: string, file: File) => {
    if (!user) return;
    setUploading(docType);
    try {
      // Upload to storage
      await storageService.uploadDocument(user.id, docType, file);

      // Update database record (mock service call for now, but passing the real path)
      await forwarderService.uploadDocument(user.id, file, docType);

      await loadDocuments(); // Refresh list
    } catch (error) {
      console.error("Error uploading document:", error);
      toastError("Erreur lors du téléchargement du document.");
    } finally {
      setUploading(null);
    }
  };

  const getDocStatus = (docType: string) => {
    // Find the most recent document of this type
    // Note: In a real app, we might have specific types in the DB.
    // Here we match by name as per the mock service implementation.
    const doc = documents.find((d) => d.name === docType);
    return doc ? doc.status : "missing";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-orange-500" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return (
          <div className="w-5 h-5 rounded-full border-2 border-gray-200"></div>
        );
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="text-green-600 font-medium text-sm">Validé</span>
        );
      case "pending":
        return (
          <span className="text-orange-600 font-medium text-sm">En cours</span>
        );
      case "rejected":
        return <span className="text-red-600 font-medium text-sm">Rejeté</span>;
      default:
        return (
          <span className="text-gray-400 font-medium text-sm">Manquant</span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Vérification d'Identité (KYC)
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Pour garantir la sécurité de la plateforme, nous devons vérifier
              les documents légaux de votre entreprise. Une fois validés, vous
              obtiendrez le badge "Vérifié".
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {REQUIRED_DOCUMENTS.map((doc) => {
            const status = getDocStatus(doc.label); // Matching by label as mock service uses type as name
            const isUploaded = status !== "missing";

            return (
              <div
                key={doc.id}
                className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getStatusIcon(status)}</div>
                    <div>
                      <h3 className="font-medium text-gray-900">{doc.label}</h3>
                      <p className="text-sm text-gray-500">{doc.description}</p>
                      {status === "rejected" && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Document rejeté.
                          Veuillez en soumettre un nouveau.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {isUploaded && (
                      <div className="flex flex-col items-end">
                        {getStatusLabel(status)}
                        <span className="text-xs text-gray-400">
                          {new Date().toLocaleDateString()} {/* Mock date */}
                        </span>
                      </div>
                    )}

                    {(status === "missing" || status === "rejected") && (
                      <label
                        className={`
                                                cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                                                ${uploading === doc.label
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm"
                          }
                                            `}
                      >
                        {uploading === doc.label ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {uploading === doc.label ? "Envoi..." : "Importer"}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(doc.label, e.target.files[0]);
                            }
                          }}
                          disabled={!!uploading}
                        />
                      </label>
                    )}

                    {status === "pending" && (
                      <div className="px-4 py-2 bg-orange-50 text-orange-600 rounded-lg text-sm font-medium border border-orange-100">
                        En attente de validation
                      </div>
                    )}

                    {status === "approved" && (
                      <div className="px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium border border-green-100 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Voir
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex items-start gap-3">
        <div className="p-1 bg-blue-100 rounded-full text-blue-600 mt-0.5">
          <CheckCircle className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-blue-900">
            Pourquoi ces documents ?
          </h4>
          <p className="text-sm text-blue-700 mt-1">
            Ces documents sont nécessaires pour vérifier la légalité de votre
            entreprise et assurer la confiance des clients sur la plateforme.
            Vos données sont sécurisées et ne seront partagées qu'avec les
            administrateurs pour validation.
          </p>
        </div>
      </div>
    </div>
  );
}
