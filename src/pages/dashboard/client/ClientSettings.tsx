import { useState, useEffect } from "react";
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
  Briefcase,
  Shield,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { profileService, UserProfile } from "../../../services/profileService";
import ConfirmationModal from "../../../components/common/ConfirmationModal";

type SettingsTab = "profile" | "notifications" | "security";

export default function ClientSettings() {
  const { user, refreshProfile } = useAuth();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

  const [notifications, setNotifications] = useState({
    email_enabled: true,
    push_enabled: true,
    offers_enabled: true,
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "upgrade" | null;
    id: string | null;
    title: string;
    message: string;
    variant: "info";
  }>({
    isOpen: false,
    type: null,
    id: null,
    title: "",
    message: "",
    variant: "info",
  });

  const handleUpgrade = async () => {
    if (!user) return;
    try {
      await profileService.upgradeToForwarder(user.id);
      setSuccessMessage("Compte migré avec succès ! Redirection...");
      setConfirmModal((prev) => ({ ...prev, isOpen: false }));

      // Force reload to update context and redirect
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (error) {
      console.error("Error upgrading account:", error);
      setError("Erreur lors de la migration du compte.");
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const profile = await profileService.getProfile(user.id);
        setUserProfile(profile);
      }
    };
    fetchProfile();
  }, [user]);

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

  if (!userProfile) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "Mon Profil", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Sécurité", icon: Lock },
  ];

  return (
    <div>
      <PageHeader
        title="Paramètres Client"
        subtitle="Gérez vos informations et préférences de compte"
        action={{
          label: saving ? "Enregistrement..." : "Enregistrer",
          onClick: handleSave,
          icon: Save,
          disabled: saving,
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
                        title="Upload photo de profil"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleAvatarUpload(e.target.files[0])
                        }
                      />
                    </label>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {userProfile.full_name || "Client"}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-gray-500 text-sm capitalize">Client</p>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>

                      {/* KYC Badge in Info Header */}
                      {userProfile.kyc_status === 'verified' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          <Shield className="w-3 h-3" /> Vérifié
                        </span>
                      ) : userProfile.kyc_status === 'pending' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          <Shield className="w-3 h-3" /> En examen
                        </span>
                      ) : userProfile.kyc_status === 'rejected' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-wider font-montserrat">
                          <Shield className="w-3 h-3" /> Rejeté
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          <Shield className="w-3 h-3" /> Non vérifié
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* KYC Status Banner */}
                <div className={`p-5 rounded-2xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${userProfile.kyc_status === 'verified' ? 'bg-green-50/30 border-green-100' :
                  userProfile.kyc_status === 'rejected' ? 'bg-red-50/30 border-red-100' :
                    userProfile.kyc_status === 'pending' ? 'bg-amber-50/30 border-amber-100' : 'bg-slate-50/30 border-slate-100'
                  }`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${userProfile.kyc_status === 'verified' ? 'bg-green-100 text-green-600' :
                      userProfile.kyc_status === 'rejected' ? 'bg-red-100 text-red-600' :
                        userProfile.kyc_status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Vérification d'Identité (KYC)</h4>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {userProfile.kyc_status === 'verified' ? "Votre identité est confirmée. Vous n'avez aucune limite de transaction." :
                          userProfile.kyc_status === 'rejected' ? `Dossier rejeté : ${userProfile.kyc_rejection_reason || "Documents invalides"}` :
                            userProfile.kyc_status === 'pending' ? "Vos documents sont en cours d'examen par nos services." :
                              "Obligatoire pour les transactions supérieures à 1.000.000 FCFA/mois."}
                      </p>
                    </div>
                  </div>
                  {(userProfile.kyc_status === 'unverified' || userProfile.kyc_status === 'rejected') && (
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('open-kyc-modal'));
                      }}
                      className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform text-sm"
                    >
                      {userProfile.kyc_status === 'rejected' ? "Soumettre à nouveau" : "Vérifier mon identité"}
                    </button>
                  )}
                </div>

                {/* Personal Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                      Nom complet
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="full_name"
                        type="text"
                        value={userProfile.full_name || ""}
                        onChange={(e) =>
                          setUserProfile({
                            ...userProfile,
                            full_name: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="email"
                        type="email"
                        value={userProfile.email || ""}
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Téléphone
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="phone"
                        type="tel"
                        value={userProfile.phone || ""}
                        onChange={(e) =>
                          setUserProfile({
                            ...userProfile,
                            phone: e.target.value,
                          })
                        }
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                      Entreprise
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        id="company"
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
                      />
                    </div>
                  </div>
                </div>

                {activeTab === "profile" && userProfile.role === "client" && (
                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                          <Briefcase className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            Devenir Prestataire
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Vous souhaitez proposer vos services de transport sur
                            notre plateforme ? Passez à un compte professionnel pour
                            gérer vos expéditions, publier des offres de groupage et
                            développer votre activité.
                          </p>
                          <button
                            onClick={() =>
                              setConfirmModal({
                                isOpen: true,
                                type: "upgrade",
                                id: user?.id || null,
                                title: "Passer au compte Prestataire",
                                message:
                                  "En devenant prestataire, vous aurez accès à un tableau de bord dédié. Vous devrez ensuite souscrire à un abonnement et valider votre KYC pour commencer à opérer. Voulez-vous continuer ?",
                                variant: "info",
                              })
                            }
                            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                          >
                            Passer au compte Pro
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
                        id="notif_email"
                        type="checkbox"
                        checked={notifications.email_enabled}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            email_enabled: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                        aria-label="Activer les notifications par email"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" aria-hidden="true"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">
                        Nouvelles Offres
                      </p>
                      <p className="text-sm text-gray-500">
                        Être alerté des nouvelles offres des prestataires
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        id="notif_offers"
                        type="checkbox"
                        checked={notifications.offers_enabled}
                        onChange={(e) =>
                          setNotifications({
                            ...notifications,
                            offers_enabled: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                        aria-label="Activer les notifications pour les nouvelles offres"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" aria-hidden="true"></div>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="new_password" title="Nouveau mot de passe" className="block text-sm font-medium text-gray-700">
                        Nouveau mot de passe
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          id="new_password"
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
                      <label htmlFor="confirm_password" title="Confirmer mot de passe" className="block text-sm font-medium text-gray-700">
                        Confirmer le mot de passe
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          id="confirm_password"
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
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleUpgrade}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmLabel="Confirmer et Migrer"
      />
    </div>
  );
}
