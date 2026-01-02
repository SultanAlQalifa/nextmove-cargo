import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import {
  Bell,
  Lock,
  Save,
  AlertTriangle,
  User,
  Camera,
  Mail,
  Phone,
  Key,
  Building,
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  CreditCard,
  Star,
  Check,
  Anchor,
  Send,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { profileService, UserProfile } from "../../../services/profileService";
import { forwarderService } from "../../../services/forwarderService";
import { subscriptionService } from "../../../services/subscriptionService";
import {
  SubscriptionPlan,
  UserSubscription,
} from "../../../types/subscription";
import PaymentModal from "../../../components/payment/PaymentModal";
import KYCBadge from "../../../components/common/KYCBadge";
import TransportBadge from "../../../components/common/TransportBadge";


type SettingsTab =
  | "profile"
  | "notifications"
  | "security"
  | "documents"
  | "subscription";

export default function ForwarderSettings() {
  const { user, refreshProfile } = useAuth();
  const [searchParams] = useSearchParams();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab &&
      [
        "profile",
        "notifications",
        "security",
        "documents",
        "subscription",
      ].includes(tab)
    ) {
      setActiveTab(tab as SettingsTab);
    }
  }, [searchParams]);
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

  // Documents State
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Subscription State
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] =
    useState<UserSubscription | null>(null);
  const [loadingSub, setLoadingSub] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    plan: SubscriptionPlan | null;
  }>({
    isOpen: false,
    plan: null,
  });

  // Local state for notifications (mocked for now as it might be in a different table or jsonb in profile)
  const [notifications, setNotifications] = useState({
    email_enabled: true,
    sms_enabled: false,
    push_enabled: true,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const profile = await profileService.getProfile(user.id);
        setUserProfile(profile);
        if (profile?.role === "forwarder") {
          fetchDocuments(user.id);
          fetchSubscriptionData(user.id);
        }
      }
    };
    fetchProfile();
  }, [user]);

  const fetchDocuments = async (userId: string) => {
    setLoadingDocs(true);
    try {
      const docs = await forwarderService.getDocuments(userId);
      setDocuments(docs);
    } catch (err) {
      console.error("Error fetching documents:", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const fetchSubscriptionData = async (userId: string) => {
    setLoadingSub(true);
    try {
      const [fetchedPlans, sub] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getUserSubscription(userId),
      ]);
      setPlans(fetchedPlans);
      setCurrentSubscription(sub);
    } catch (err) {
      console.error("Error fetching subscription data:", err);
    } finally {
      setLoadingSub(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      if (activeTab === "profile") {
        if (!userProfile || !user) return;

        await profileService.updateProfile(user.id, {
          full_name: userProfile.full_name,
          phone: userProfile.phone,
          company_name: userProfile.company_name,
          website_url: userProfile.website_url,
          transport_modes: userProfile.transport_modes || [],
        });

        setSuccessMessage("Profil mis à jour avec succès !");
      } else if (activeTab === "security") {
        if (passwordData.new) {
          if (passwordData.new !== passwordData.confirm) {
            throw new Error("Les mots de passe ne correspondent pas");
          }
          if (passwordData.new.length < 8) {
            throw new Error(
              "Le mot de passe doit contenir au moins 8 caractères.",
            );
          }

          await profileService.updatePassword(passwordData.new);
          setPasswordData({ current: "", new: "", confirm: "" });
          setSuccessMessage("Mot de passe mis à jour !");
        }
      } else if (activeTab === "notifications") {
        // Save notifications preferences (mock implementation)
        setSuccessMessage("Préférences de notifications enregistrées !");
      }

      setTimeout(() => setSuccessMessage(""), 3000);
      await refreshProfile();
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setError(err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setUserProfile((prev) =>
          prev ? { ...prev, avatar_url: result } : null,
        );
        setImageError(false);
      }
    };
    reader.readAsDataURL(file);

    try {
      setSaving(true);
      const url = await profileService.uploadAvatar(user.id, file);
      await profileService.updateProfile(user.id, { avatar_url: url });
      await refreshProfile();
      setSuccessMessage("Photo de profil mise à jour !");
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setSuccessMessage("Photo de profil mise à jour (local) !");
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentUpload = async (file: File, type: string) => {
    if (!user) return;
    try {
      setSaving(true);
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

  const handleSubscribe = async () => {
    if (!user || !paymentModal.plan) return;
    try {
      setSaving(true);
      // 1. Create Subscription
      await subscriptionService.subscribeToPlan(user.id, paymentModal.plan.id);

      // 2. Refresh Data
      await fetchSubscriptionData(user.id);
      await refreshProfile();

      setSuccessMessage(
        `Abonnement ${paymentModal.plan.name} activé avec succès !`,
      );
    } catch (err: any) {
      console.error("Error subscribing:", err);
      setError(err.message || "Erreur lors de l'activation de l'abonnement");
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

  if (!userProfile) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "Mon Profil", icon: User },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "subscription", label: "Abonnement", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Sécurité", icon: Lock },
  ];

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
    <div>
      <PageHeader
        title="Paramètres du Compte"
        subtitle="Gérez vos informations personnelles et préférences"
        action={{
          label: saving ? "Enregistrement..." : "Enregistrer",
          onClick: handleSave,
          icon: Save,
          disabled:
            saving || activeTab === "documents" || activeTab === "subscription", // Auto-save for docs & sub
        }}
      />

      {successMessage && (
        <div className="mb-6 bg-green-50 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${isActive ? "bg-primary/5 text-primary border-l-4 border-primary" : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent"}`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-primary" : "text-gray-400"}`}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            {activeTab === "profile" && (
              <div className="space-y-8">
                {/* Avatar Section */}
                <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg relative">
                      {userProfile.avatar_url && !imageError ? (
                        <img
                          src={userProfile.avatar_url}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <User className="w-10 h-10 text-gray-400" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-md">
                      <Camera className="w-4 h-4" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleAvatarUpload(e.target.files[0])
                        }
                        aria-label="Changer la photo de profil"
                        title="Changer la photo de profil"
                      />
                    </label>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {userProfile.full_name || "Utilisateur"}
                      </h3>
                      {userProfile.role === "forwarder" && (
                        <div className="flex items-center gap-2">
                          {(userProfile as any).kyc_status && (
                            <KYCBadge
                              status={(userProfile as any).kyc_status}
                              size="sm"
                            />
                          )}

                        </div>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm capitalize">
                      {userProfile.role === "forwarder"
                        ? "Prestataire"
                        : userProfile.role}
                    </p>

                    {userProfile.role === "forwarder" && (userProfile as any).transport_modes && (userProfile as any).transport_modes.length > 0 && (
                      <div className="mt-3 flex flex-col gap-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                          Opère en
                          {(userProfile as any).transport_modes.includes('sea') && (userProfile as any).transport_modes.includes('air')
                            ? " Maritime et Aérien"
                            : (userProfile as any).transport_modes.includes('sea')
                              ? " Maritime"
                              : " Aérien"}
                        </p>
                        <div className="flex gap-2">
                          <TransportBadge
                            modes={(userProfile as any).transport_modes}
                            size="sm"
                            showLabel={true}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Nom complet
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={userProfile.full_name || ""}
                        onChange={(e) =>
                          setUserProfile({
                            ...userProfile,
                            full_name: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Votre nom complet"
                        aria-label="Nom complet"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={userProfile.email || ""}
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                        aria-label="Email"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Téléphone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="tel"
                        value={userProfile.phone || ""}
                        onChange={(e) =>
                          setUserProfile({
                            ...userProfile,
                            phone: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        aria-label="Téléphone"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Entreprise
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={userProfile.company_name || ""}
                        onChange={(e) =>
                          setUserProfile({
                            ...userProfile,
                            company_name: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Nom de votre société"
                        aria-label="Nom de l'entreprise"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Site Internet
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 font-bold flex items-center justify-center text-xs">W</div>
                      <input
                        type="url"
                        value={userProfile.website_url || ""}
                        onChange={(e) =>
                          setUserProfile({
                            ...userProfile,
                            website_url: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="https://www.mon-site.com"
                        aria-label="Site Internet"
                      />
                    </div>
                  </div>
                </div>

                {/* Transport Modes */}
                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <h4 className="font-bold text-gray-900">
                    Modes de Transport Supportés
                  </h4>
                  <p className="text-sm text-gray-500">
                    Sélectionnez les modes de transport que vous proposez.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      onClick={() => {
                        const current = userProfile.transport_modes || [];
                        const newModes = current.includes("sea")
                          ? current.filter((m) => m !== "sea")
                          : [...current, "sea"];
                        setUserProfile({
                          ...userProfile,
                          transport_modes: newModes,
                        });
                      }}
                      className={`cursor-pointer p-4 rounded-xl border flex items-center gap-4 transition-all ${(userProfile.transport_modes || []).includes("sea")
                        ? "bg-blue-50 border-blue-200 ring-1 ring-blue-500/20"
                        : "bg-white border-gray-200 hover:border-blue-100"
                        }`}
                      aria-label="Sélectionner le mode de transport Maritime"
                    >
                      <div
                        className={`p-2 rounded-lg ${(userProfile.transport_modes || []).includes("sea") ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}
                      >
                        <Anchor size={24} />
                      </div>
                      <div>
                        <p
                          className={`font-bold ${(userProfile.transport_modes || []).includes("sea") ? "text-blue-900" : "text-gray-600"}`}
                        >
                          Maritime
                        </p>
                        <p className="text-xs text-gray-400">
                          Transport par conteneur/groupage
                        </p>
                      </div>
                      {(userProfile.transport_modes || []).includes("sea") && (
                        <CheckCircle className="ml-auto text-blue-600 w-5 h-5" />
                      )}
                    </div>

                    <div
                      onClick={() => {
                        const current = userProfile.transport_modes || [];
                        const newModes = current.includes("air")
                          ? current.filter((m) => m !== "air")
                          : [...current, "air"];
                        setUserProfile({
                          ...userProfile,
                          transport_modes: newModes,
                        });
                      }}
                      className={`cursor-pointer p-4 rounded-xl border flex items-center gap-4 transition-all ${(userProfile.transport_modes || []).includes("air")
                        ? "bg-orange-50 border-orange-200 ring-1 ring-orange-500/20"
                        : "bg-white border-gray-200 hover:border-orange-100"
                        }`}
                      aria-label="Sélectionner le mode de transport Aérien"
                    >
                      <div
                        className={`p-2 rounded-lg ${(userProfile.transport_modes || []).includes("air") ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-400"}`}
                      >
                        <Send size={24} className="rotate-[-45deg]" />
                      </div>
                      <div>
                        <p
                          className={`font-bold ${(userProfile.transport_modes || []).includes("air") ? "text-orange-900" : "text-gray-600"}`}
                        >
                          Aérien
                        </p>
                        <p className="text-xs text-gray-400">
                          Fret aérien rapide
                        </p>
                      </div>
                      {(userProfile.transport_modes || []).includes("air") && (
                        <CheckCircle className="ml-auto text-orange-600 w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Préférences de Notifications
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">
                        Notifications Email
                      </p>
                      <p className="text-sm text-gray-500">
                        Recevoir les mises à jour par email
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.email_enabled}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            email_enabled: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                        aria-label="Activation Email"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">
                        Notifications Push
                      </p>
                      <p className="text-sm text-gray-500">
                        Recevoir des notifications sur l'application
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.push_enabled}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            push_enabled: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                        aria-label="Activation Push"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Sécurité du Compte
                </h3>
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="flex items-start gap-3">
                      <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">
                          Mot de passe
                        </p>
                        <p className="text-sm text-blue-700 mt-1">
                          Pour votre sécurité, utilisez un mot de passe fort
                          contenant au moins 8 caractères, des chiffres et des
                          symboles.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Nouveau mot de passe
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="password"
                          autoComplete="new-password"
                          value={passwordData.new}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              new: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Confirmer le mot de passe
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="password"
                          autoComplete="new-password"
                          value={passwordData.confirm}
                          onChange={(e) =>
                            setPasswordData({
                              ...passwordData,
                              confirm: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "documents" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Documents Légaux & KYC
                  </h3>
                  <p className="text-sm text-gray-500">
                    Pour être certifié "Vérifié" et accéder à toutes les
                    fonctionnalités, veuillez fournir les documents requis.
                  </p>
                </div>

                {loadingDocs ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requiredDocuments.map((docType) => {
                      const status = getDocumentStatus(docType.id);
                      const url = getDocumentUrl(docType.id);

                      return (
                        <div
                          key={docType.id}
                          className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl gap-4 hover:border-gray-200 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${status === 'approved' ? 'bg-green-100 text-green-600' :
                              status === 'pending' ? 'bg-orange-100 text-orange-600' :
                                status === 'rejected' ? 'bg-red-100 text-red-600' :
                                  'bg-white border border-gray-200 text-gray-400'
                              }`}>
                              <FileText className="w-6 h-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-gray-900">
                                  {docType.label}
                                </h4>
                                {status === 'approved' && (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center gap-1">
                                    <CheckCircle size={10} /> Validé
                                  </span>
                                )}
                                {status === 'pending' && (
                                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full flex items-center gap-1">
                                    <Clock size={10} /> En attente
                                  </span>
                                )}
                                {status === 'rejected' && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1">
                                    <XCircle size={10} /> Refusé
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                {docType.description}
                              </p>
                              {status === 'rejected' && (
                                <p className="text-xs text-red-600 mt-1 font-medium">
                                  Ce document a été refusé. Veuillez en soumettre un nouveau.
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {url && (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-500 hover:text-primary bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                title="Voir le document"
                              >
                                <Eye size={18} />
                              </a>
                            )}

                            {status !== 'approved' && status !== 'pending' && (
                              <label className="cursor-pointer px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 shadow-sm">
                                <Upload size={16} />
                                <span>{url ? "Remplacer" : "Importer"}</span>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  onChange={(e) =>
                                    e.target.files?.[0] &&
                                    handleDocumentUpload(e.target.files[0], docType.id)
                                  }
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === "subscription" && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Abonnement & Facturation
                  </h3>
                  <p className="text-sm text-gray-500">
                    Gérez votre abonnement et vos informations de paiement.
                  </p>
                </div>

                {/* Current Plan Card */}
                <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl text-white shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold border border-white/10 backdrop-blur-sm">
                          {currentSubscription?.status === "active" ? "Actif" : "Inactif"}
                        </span>
                        {currentSubscription?.plan && (
                          <span className="text-gray-400 text-sm">
                            Expire le {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <h3 className="text-3xl font-bold mb-1">
                        {currentSubscription?.plan?.name || "Aucun abonnement"}
                      </h3>
                      <p className="text-gray-400">
                        {currentSubscription?.plan
                          ? `Plan ${currentSubscription.plan.interval === 'month' ? 'Mensuel' : 'Annuel'}`
                          : "Souscrivez à un plan pour accéder aux fonctionnalités avancées."}
                      </p>
                    </div>

                    {!currentSubscription?.plan || currentSubscription.status !== 'active' ? (
                      <button
                        onClick={() => document.getElementById('plans-grid')?.scrollIntoView({ behavior: 'smooth' })}
                        className="px-6 py-3 bg-white text-gray-900 rounded-xl font-bold hover:bg-gray-100 transition-colors shadow-lg"
                      >
                        Voir les plans
                      </button>
                    ) : (
                      <div className="flex flex-col items-end gap-2">
                        <button className="text-sm text-gray-300 hover:text-white underline decoration-white/30">
                          Gérer la facturation
                        </button>
                        <button className="text-sm text-red-400 hover:text-red-300">
                          Annuler l'abonnement
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Plans Grid */}
                {(!currentSubscription?.plan || currentSubscription.status !== 'active' || true) && (
                  <div id="plans-grid" className="space-y-6 pt-6 border-t border-gray-100">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      Plans disponibles
                    </h4>

                    {loadingSub ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan) => {
                          const isCurrent = currentSubscription?.plan?.id === plan.id;
                          return (
                            <div
                              key={plan.id}
                              className={`relative p-6 rounded-2xl border transition-all hover:shadow-lg ${isCurrent
                                ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                                }`}
                            >
                              {isCurrent && (
                                <div className="absolute top-0 right-0 -mt-3 -mr-3 bg-primary text-white p-1 rounded-full shadow-sm">
                                  <Check size={16} />
                                </div>
                              )}

                              <h5 className="font-bold text-lg text-gray-900 mb-2">{plan.name}</h5>
                              <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-2xl font-bold text-gray-900">{formatCurrency(plan.price, plan.currency)}</span>
                                <span className="text-gray-500 text-sm">/{plan.interval === 'month' ? 'mois' : 'an'}</span>
                              </div>

                              <ul className="space-y-3 mb-6">
                                {(plan.features || []).map((feature: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>

                              <button
                                onClick={() => setPaymentModal({ isOpen: true, plan })}
                                disabled={isCurrent}
                                className={`w-full py-2.5 rounded-xl font-medium transition-all ${isCurrent
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-900/20'
                                  }`}
                              >
                                {isCurrent ? 'Plan Actuel' : 'Choisir ce plan'}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {paymentModal.plan && (
        <PaymentModal
          isOpen={paymentModal.isOpen}
          onClose={() => setPaymentModal({ isOpen: false, plan: null })}
          onSuccess={handleSubscribe}
          planName={paymentModal.plan.name}
          amount={paymentModal.plan.price}
          currency={paymentModal.plan.currency}
        />
      )}
    </div>
  );
}
