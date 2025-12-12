import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
  Users,
  Search,
  Check,
  X,
  FileText,
  ExternalLink,
  MoreVertical,
  CreditCard,
  XCircle,
} from "lucide-react";
import { profileService } from "../../../services/profileService";
import { useToast } from "../../../contexts/ToastContext";
import ConfirmationModal from "../../../components/common/ConfirmationModal";

export default function AdminForwarders() {
  const [forwarders, setForwarders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending_kyc, no_sub
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);

  // Modals
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    variant: "info" as "info" | "danger" | "warning",
    action: null as (() => Promise<void>) | null,
  });
  const [documentModal, setDocumentModal] = useState<{
    isOpen: boolean;
    forwarder: any | null;
  }>({
    isOpen: false,
    forwarder: null,
  });

  const { success, error: toastError } = useToast();

  useEffect(() => {
    fetchForwarders();
  }, []);

  const fetchForwarders = async () => {
    try {
      const profiles = await profileService.getAllProfiles();
      const forwarderProfiles = profiles.filter((p) => p.role === "forwarder");
      setForwarders(forwarderProfiles);
    } catch (error) {
      console.error("Error fetching forwarders:", error);
      toastError("Erreur lors du chargement des transitaires");
    } finally {
      setLoading(false);
    }
  };

  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (activeMenu === id) {
      setActiveMenu(null);
      setMenuPosition(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + window.scrollY + 5,
        right: window.innerWidth - rect.right,
      });
      setActiveMenu(id);
    }
  };

  const getKycBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Vérifié
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Rejeté
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            En attente
          </span>
        );
    }
  };

  const getSubBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Actif
          </span>
        );
      case "canceled":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Annulé
          </span>
        );
      case "past_due":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            Impayé
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Inactif
          </span>
        );
    }
  };

  const filteredForwarders = forwarders.filter((f) => {
    const matchesSearch =
      (f.company_name?.toLowerCase() || "").includes(
        searchQuery.toLowerCase(),
      ) ||
      (f.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (f.email?.toLowerCase() || "").includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "pending_kyc") return f.kyc_status === "pending";
    if (filter === "no_sub") return f.subscription_status !== "active";

    return true;
  });

  const handleAction = (action: string, forwarder: any) => {
    setActiveMenu(null);
    switch (action) {
      case "verify_kyc":
        setConfirmModal({
          isOpen: true,
          title: "Valider le KYC",
          message: `Êtes-vous sûr de vouloir valider le KYC pour ${forwarder.company_name || forwarder.full_name} ?`,
          variant: "info",
          action: async () => {
            await profileService.updateProfile(forwarder.id, {
              kyc_status: "verified",
            });
            success("KYC validé avec succès");
          },
        });
        break;
      case "reject_kyc":
        setConfirmModal({
          isOpen: true,
          title: "Rejeter le KYC",
          message: `Êtes-vous sûr de vouloir rejeter le KYC pour ${forwarder.company_name || forwarder.full_name} ?`,
          variant: "danger",
          action: async () => {
            await profileService.updateProfile(forwarder.id, {
              kyc_status: "rejected",
            });
            success("KYC rejeté");
          },
        });
        break;
      case "activate_sub":
        setConfirmModal({
          isOpen: true,
          title: "Activer l'abonnement",
          message: `Activer l'abonnement Premium pour ${forwarder.company_name || forwarder.full_name} ?`,
          variant: "info",
          action: async () => {
            await profileService.updateProfile(forwarder.id, {
              subscription_status: "active",
            });
            success("Abonnement activé");
          },
        });
        break;
      case "cancel_sub":
        setConfirmModal({
          isOpen: true,
          title: "Suspendre l'abonnement",
          message: `Suspendre l'abonnement de ${forwarder.company_name || forwarder.full_name} ?`,
          variant: "warning",
          action: async () => {
            await profileService.updateProfile(forwarder.id, {
              subscription_status: "canceled",
            });
            success("Abonnement suspendu");
          },
        });
        break;
    }
  };

  const confirmAction = async () => {
    if (confirmModal.action) {
      try {
        await confirmModal.action();
        await fetchForwarders();
      } catch (error) {
        console.error("Action failed:", error);
        toastError("Une erreur est survenue");
      } finally {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      }
    }
  };

  const openDocuments = (forwarder: any) => {
    setDocumentModal({ isOpen: true, forwarder });
    setActiveMenu(null);
  };

  const activeForwarder = forwarders.find((f) => f.id === activeMenu);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Transitaires"
        subtitle="Validez les comptes, KYC et abonnements"
      />

      {/* Filters */}
      <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un transitaire..."
            className="w-full pl-9 pr-8 py-2 bg-transparent hover:bg-gray-50 focus:bg-white border border-transparent focus:border-primary/20 rounded-xl text-sm focus:outline-none transition-all"
          />
        </div>
        <div className="w-px bg-gray-100 hidden sm:block mx-1 h-8"></div>
        <div className="flex bg-gray-50 rounded-xl p-1">
          {[
            { id: "all", label: "Tous" },
            { id: "pending_kyc", label: "KYC en attente" },
            { id: "no_sub", label: "Sans abonnement" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilter(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter === opt.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Transitaire
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    KYC
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Abonnement
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Inscription
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredForwarders.map((f) => (
                  <tr
                    key={f.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                          {f.company_name
                            ? f.company_name.charAt(0)
                            : f.full_name?.charAt(0) || "T"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {f.company_name || "Société Inconnue"}
                          </p>
                          <p className="text-sm text-gray-500">{f.full_name}</p>
                          <p className="text-xs text-gray-400">{f.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getKycBadge(f.kyc_status)}</td>
                    <td className="px-6 py-4">
                      {getSubBadge(f.subscription_status)}
                      {f.subscription_plan && (
                        <span className="text-xs text-gray-400 ml-2">
                          ({f.subscription_plan})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {f.created_at
                        ? new Date(f.created_at).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => toggleMenu(e, f.id)}
                        className={`p-2 rounded-full transition-colors ${activeMenu === f.id ? "bg-gray-100 text-gray-900" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredForwarders.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <div className="p-4 bg-gray-50 rounded-full mb-3">
                          <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <p>Aucun transitaire trouvé</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Fixed Dropdown Menu */}
      {activeMenu && activeForwarder && menuPosition && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setActiveMenu(null)}
          ></div>
          <div
            className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-100 py-1 animate-in fade-in zoom-in duration-200 w-56"
            style={{
              top: menuPosition.top,
              right: menuPosition.right,
            }}
          >
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">
              KYC
            </div>
            <button
              onClick={() => openDocuments(activeForwarder)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <FileText className="w-4 h-4" /> Voir Documents
            </button>
            {activeForwarder.kyc_status !== "verified" && (
              <button
                onClick={() => handleAction("verify_kyc", activeForwarder)}
                className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Valider KYC
              </button>
            )}
            {activeForwarder.kyc_status !== "rejected" && (
              <button
                onClick={() => handleAction("reject_kyc", activeForwarder)}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <X className="w-4 h-4" /> Rejeter KYC
              </button>
            )}

            <div className="border-t border-gray-100 my-1"></div>
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase">
              Abonnement
            </div>

            {activeForwarder.subscription_status !== "active" ? (
              <button
                onClick={() => handleAction("activate_sub", activeForwarder)}
                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" /> Activer Premium
              </button>
            ) : (
              <button
                onClick={() => handleAction("cancel_sub", activeForwarder)}
                className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Suspendre
              </button>
            )}
          </div>
        </>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmAction}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmLabel="Confirmer"
      />

      {/* Document Viewer Modal */}
      {documentModal.isOpen && documentModal.forwarder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Documents de {documentModal.forwarder.company_name}
                </h3>
                <p className="text-sm text-gray-500">
                  Vérifiez les pièces justificatives
                </p>
              </div>
              <button
                onClick={() =>
                  setDocumentModal({ isOpen: false, forwarder: null })
                }
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {!documentModal.forwarder.documents ||
              documentModal.forwarder.documents.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">
                    Aucun document envoyé
                  </p>
                  <p className="text-sm text-gray-400">
                    Le transitaire n'a pas encore uploadé de documents.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(documentModal.forwarder.documents || []).map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {doc.document_type?.replace(/_/g, " ") ||
                              "Document"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Envoyé le{" "}
                            {new Date(doc.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            doc.status === "verified"
                              ? "bg-green-100 text-green-700"
                              : doc.status === "rejected"
                                ? "bg-red-100 text-red-700"
                                : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {doc.status === "verified"
                            ? "Vérifié"
                            : doc.status === "rejected"
                              ? "Rejeté"
                              : "En attente"}
                        </span>
                        <a
                          href={doc.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-500 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                          title="Ouvrir le document"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() =>
                  setDocumentModal({ isOpen: false, forwarder: null })
                }
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-xl transition-colors"
              >
                Fermer
              </button>
              {documentModal.forwarder.kyc_status !== "verified" && (
                <button
                  onClick={() => {
                    setDocumentModal({ isOpen: false, forwarder: null });
                    handleAction("verify_kyc", documentModal.forwarder);
                  }}
                  className="px-4 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                >
                  Tout Valider (KYC)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
