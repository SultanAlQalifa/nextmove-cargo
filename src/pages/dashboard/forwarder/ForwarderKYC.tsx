import { useState, useEffect } from "react";
import {
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  Save,
} from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import { useAuth } from "../../../contexts/AuthContext";
import { forwarderService } from "../../../services/forwarderService";

export default function ForwarderKYC() {
  const { user } = useAuth();

  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      fetchDocuments(user.id);
    }
  }, [user]);

  const fetchDocuments = async (userId: string) => {
    setLoadingDocs(true);
    try {
      const docs = await forwarderService.getDocuments(userId);
      setDocuments(docs);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Impossible de charger les documents.");
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleDocumentUpload = async (file: File, type: string) => {
    if (!user) return;
    try {
      setSaving(true);
      setSuccessMessage("");
      setError("");

      await forwarderService.uploadDocument(user.id, file, type);
      setSuccessMessage(`Document "${type}" envoyé avec succès !`);
      fetchDocuments(user.id);
    } catch (err: any) {
      console.error("Error uploading document:", err);
      setError(err.message || "Erreur lors de l'envoi du document");
    } finally {
      setSaving(false);
    }
  };

  const getDocumentStatus = (type: string) => {
    const doc = documents.find((d) => d.name === type);
    if (!doc) return "missing";
    return doc.status;
  };

  const getDocumentUrl = (type: string) => {
    const doc = documents.find((d) => d.name === type);
    return doc?.url;
  };

  const requiredDocuments = [
    {
      id: "registre_commerce",
      label: "Registre de Commerce (RC)",
      description: "Document officiel d'immatriculation",
    },
    {
      id: "ninea",
      label: "NINEA",
      description:
        "Numéro d'Identification Nationale des Entreprises et Associations",
    },
    {
      id: "carte_import_export",
      label: "Carte Import-Export",
      description: "Carte valide pour l'année en cours",
    },
    {
      id: "assurance_rc",
      label: "Assurance RC Pro",
      description: "Attestation d'assurance responsabilité civile",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents Légaux (KYC)"
        subtitle="Ces documents sont requis pour valider votre compte transitaire"
        action={{
          label: saving ? "Envoi en cours..." : "Actualiser",
          onClick: () => user && fetchDocuments(user.id),
          icon: FileText,
          disabled: saving,
        }}
      />

      {successMessage && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {loadingDocs ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {requiredDocuments.map((doc) => {
              const status = getDocumentStatus(doc.id);
              const url = getDocumentUrl(doc.id);

              return (
                <div
                  key={doc.id}
                  className="border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-gray-200 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-3 rounded-xl ${
                        status === "verified"
                          ? "bg-green-50 text-green-600"
                          : status === "rejected"
                            ? "bg-red-50 text-red-600"
                            : status === "pending"
                              ? "bg-orange-50 text-orange-600"
                              : "bg-gray-50 text-gray-400"
                      }`}
                    >
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{doc.label}</h4>
                      <p className="text-sm text-gray-500">{doc.description}</p>
                      <div className="mt-2">
                        {status === "verified" && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Vérifié
                          </span>
                        )}
                        {status === "pending" && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> En attente de
                            validation
                          </span>
                        )}
                        {status === "rejected" && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3" /> Rejeté
                          </span>
                        )}
                        {status === "missing" && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                            Non envoyé
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-500 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                        title="Voir le document"
                      >
                        <Eye className="w-5 h-5" />
                      </a>
                    )}

                    {(status === "missing" || status === "rejected") && (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) =>
                            e.target.files?.[0] &&
                            handleDocumentUpload(e.target.files[0], doc.id)
                          }
                        />
                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm">
                          <Upload className="w-4 h-4" />
                          {status === "rejected" ? "Renvoyer" : "Envoyer"}
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
