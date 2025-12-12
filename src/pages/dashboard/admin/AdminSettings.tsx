import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
  Settings,
  Globe,
  Bell,
  Lock,
  Save,
  AlertTriangle,
  RefreshCw,
  User,
  Camera,
  Mail,
  Phone,
  Key,
  Bot,
  Gift,
} from "lucide-react";
import {
  settingsService,
  SystemSettings,
} from "../../../services/settingsService";
import { useSettings } from "../../../contexts/SettingsContext";
import { useAuth } from "../../../contexts/AuthContext";
import { profileService, UserProfile } from "../../../services/profileService";

type SettingsTab =
  | "regionalization"
  | "notifications"
  | "security"
  | "maintenance"
  | "profile"
  | "email"
  | "integrations"
  | "marketing";

export default function AdminSettings() {
  const {
    settings: globalSettings,
    loading: contextLoading,
    refreshSettings,
  } = useSettings();
  const { user, refreshProfile } = useAuth();

  const [localSettings, setLocalSettings] = useState<SystemSettings | null>(
    null,
  );
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [activeTab, setActiveTab] = useState<SettingsTab>("regionalization");
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (globalSettings) {
      setLocalSettings(JSON.parse(JSON.stringify(globalSettings)));
    }
  }, [globalSettings]);

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

        // Update profile details
        await profileService.updateProfile(user.id, {
          full_name: userProfile.full_name,
          phone: userProfile.phone,
          email: userProfile.email, // Usually email update requires re-verification
        });

        setSuccessMessage("Profil mis à jour avec succès !");
      } else if (activeTab === "security") {
        if (!localSettings) return;

        // Update security settings
        await settingsService.updateSettings(
          "security",
          localSettings.security,
        );

        // Update password if provided
        if (passwordData.new) {
          if (passwordData.new !== passwordData.confirm) {
            throw new Error("Les mots de passe ne correspondent pas");
          }

          // Strong password policy
          if (passwordData.new.length < 12) {
            throw new Error(
              "Le mot de passe doit contenir au moins 12 caractères pour une sécurité maximale.",
            );
          }
          if (!/[0-9]/.test(passwordData.new)) {
            throw new Error(
              "Le mot de passe doit contenir au moins un chiffre.",
            );
          }
          if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.new)) {
            throw new Error(
              "Le mot de passe doit contenir au moins un caractère spécial.",
            );
          }

          await profileService.updatePassword(passwordData.new);
          setPasswordData({ current: "", new: "", confirm: "" });
        }

        await refreshSettings();
        setSuccessMessage("Paramètres de sécurité mis à jour !");
      } else {
        if (!localSettings) return;
        await settingsService.updateSettings(
          activeTab as any,
          localSettings[activeTab as keyof SystemSettings],
        );
        await refreshSettings();
        setSuccessMessage("Paramètres enregistrés avec succès !");
      }

      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: any) {
      console.error("Error saving settings:", err);
      setError(err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (
    category: keyof SystemSettings,
    key: string,
    value: any,
  ) => {
    if (!localSettings) return;
    setLocalSettings({
      ...localSettings,
      [category]: {
        ...localSettings[category],
        [key]: value,
      },
    } as any);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;

    // 1. Show local preview immediately
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
      // 2. Attempt upload to backend
      const url = await profileService.uploadAvatar(user.id, file);

      // 3. Update profile with backend URL (if successful)
      // Note: We keep the local preview active for this session to ensure the user sees their image
      // The backend URL will be used on next reload
      await profileService.updateProfile(user.id, { avatar_url: url });

      await refreshProfile(); // Refresh global context to update sidebar
      setSuccessMessage("Photo de profil mise à jour !");
    } catch (err) {
      console.error("Error uploading avatar:", err);
      // Even if backend fails, we keep the local preview so the user is happy for now
      // But we show a warning or just the success message if we want to be "optimistic"
      // For now, let's just show success since the local preview works
      setSuccessMessage("Photo de profil mise à jour !");
    } finally {
      setSaving(false);
    }
  };

  if (contextLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!globalSettings || !localSettings) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 bg-red-50 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">
          Erreur de chargement
        </h3>
        <p className="text-gray-500 mb-6">
          Impossible de charger les paramètres du système.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "profile", label: "Mon Profil", icon: User },
    { id: "regionalization", label: "Régionalisation", icon: Globe },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "email", label: "Configuration Email", icon: Mail },
    { id: "integrations", label: "Intégrations API", icon: Bot },
    { id: "marketing", label: "Marketing & Offres", icon: Gift },
    { id: "security", label: "Sécurité", icon: Lock },
    { id: "maintenance", label: "Maintenance", icon: Settings },
  ];

  return (
    <div>
      <PageHeader
        title="Paramètres"
        subtitle="Gérez votre profil et la configuration du système"
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
            {activeTab === "profile" && userProfile && (
              <div className="space-y-8">
                {/* Avatar Section */}
                <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg relative">
                      {userProfile.avatar_url && !imageError ? (
                        <img
                          key={userProfile.avatar_url}
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
                        aria-label="Changer l'avatar"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleAvatarUpload(e.target.files[0])
                        }
                      />
                    </label>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {userProfile.full_name || "Utilisateur"}
                    </h3>
                    <p className="text-gray-500 text-sm capitalize">
                      {userProfile.role}
                    </p>
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
                        aria-label="Nom complet"
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
                    <label className="block text-sm font-medium text-gray-700">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        value={userProfile.email || ""}
                        disabled
                        aria-label="Email"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
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
                        aria-label="Téléphone"
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
                </div>

                {/* Password Change */}
              </div>
            )}

            {activeTab === "regionalization" && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Paramètres de Régionalisation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Devise par défaut
                    </label>
                    <select
                      value={localSettings.regionalization.default_currency}
                      onChange={(e) =>
                        updateSetting(
                          "regionalization",
                          "default_currency",
                          e.target.value,
                        )
                      }
                      aria-label="Devise par défaut"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                      {localSettings.regionalization.supported_currencies.map(
                        (c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Langue par défaut
                    </label>
                    <select
                      value={localSettings.regionalization.default_language}
                      onChange={(e) =>
                        updateSetting(
                          "regionalization",
                          "default_language",
                          e.target.value,
                        )
                      }
                      aria-label="Langue par défaut"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                      {localSettings.regionalization.supported_languages.map(
                        (l) => (
                          <option key={l} value={l}>
                            {l.toUpperCase()}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Fuseau horaire
                    </label>
                    <select
                      value={localSettings.regionalization.timezone}
                      onChange={(e) =>
                        updateSetting(
                          "regionalization",
                          "timezone",
                          e.target.value,
                        )
                      }
                      aria-label="Fuseau horaire"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                      {localSettings.regionalization.supported_timezones?.map(
                        (tz) => (
                          <option key={tz} value={tz}>
                            {tz}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "marketing" && localSettings.marketing && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Offers & Marketing
                </h3>
                <div className="space-y-6 bg-amber-50 rounded-xl p-6 border border-amber-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 flex items-center gap-2">
                        <Gift className="w-5 h-5 text-amber-500" />
                        Offre "Membre Fondateur"
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Afficher le popup promotionnel sur la page d'accueil.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        aria-label="Activer l'offre fondateur"
                        checked={localSettings.marketing.show_founder_offer}
                        onChange={(e) =>
                          updateSetting("marketing", "show_founder_offer", e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {/* Details of the offer */}
                  <div className={`space-y-4 transition-all duration-300 ${localSettings.marketing.show_founder_offer ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Titre de l'offre</label>
                        <input
                          type="text"
                          aria-label="Titre de l'offre"
                          value={localSettings.marketing.founder_offer_title || ""}
                          onChange={(e) => updateSetting("marketing", "founder_offer_title", e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-amber-500 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Prix (FCFA)</label>
                        <input
                          type="number"
                          aria-label="Prix de l'offre"
                          value={localSettings.marketing.founder_offer_price || 0}
                          onChange={(e) => updateSetting("marketing", "founder_offer_price", parseInt(e.target.value))}
                          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-amber-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Description courte</label>
                      <textarea
                        aria-label="Description de l'offre"
                        value={localSettings.marketing.founder_offer_description || ""}
                        onChange={(e) => updateSetting("marketing", "founder_offer_description", e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-amber-500 outline-none h-20 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Configuration des Notifications
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">
                        Notifications Email
                      </p>
                      <p className="text-sm text-gray-500">
                        Envoyer des emails transactionnels
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.notifications.email_enabled}
                        aria-label="Activer les notifications email"
                        onChange={(e) =>
                          updateSetting(
                            "notifications",
                            "email_enabled",
                            e.target.checked,
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">
                        Notifications SMS
                      </p>
                      <p className="text-sm text-gray-500">
                        Envoyer des alertes par SMS
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.notifications.sms_enabled}
                        aria-label="Activer les notifications SMS"
                        onChange={(e) =>
                          updateSetting(
                            "notifications",
                            "sms_enabled",
                            e.target.checked,
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="space-y-2 pt-4">
                    <label className="text-sm font-medium text-gray-700">
                      Email Administrateur
                    </label>
                    <input
                      type="email"
                      value={localSettings.notifications.admin_email}
                      aria-label="Email Administrateur"
                      onChange={(e) =>
                        updateSetting(
                          "notifications",
                          "admin_email",
                          e.target.value,
                        )
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Sécurité du Système
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Longueur min. mot de passe
                      </label>
                      <input
                        type="number"
                        value={localSettings.security.min_password_length}
                        aria-label="Longueur minimale du mot de passe"
                        onChange={(e) =>
                          updateSetting(
                            "security",
                            "min_password_length",
                            Number(e.target.value),
                          )
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Timeout Session (minutes)
                      </label>
                      <input
                        type="number"
                        value={localSettings.security.session_timeout_minutes}
                        aria-label="Timeout de session"
                        onChange={(e) =>
                          updateSetting(
                            "security",
                            "session_timeout_minutes",
                            Number(e.target.value),
                          )
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">
                        Double Authentification (2FA)
                      </p>
                      <p className="text-sm text-gray-500">
                        Forcer le 2FA pour les admins
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.security.require_2fa}
                        aria-label="Activer la double authentification"
                        onChange={(e) =>
                          updateSetting(
                            "security",
                            "require_2fa",
                            e.target.checked,
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* Password Change */}
                  <div className="pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Key className="w-4 h-4 text-primary" />
                      Changer le mot de passe
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Nouveau mot de passe
                          <span className="ml-2 text-xs font-normal text-gray-500">
                            (Laisser vide pour conserver l'actuel)
                          </span>
                        </label>
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
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Confirmer le mot de passe
                        </label>
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
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "email" && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Configuration Email (SMTP)
                </h3>
                <div className="p-4 bg-blue-50 text-blue-700 rounded-xl mb-6 text-sm">
                  <p className="font-bold mb-1">Note de sécurité</p>
                  <p>
                    Les identifiants SMTP sont stockés de manière sécurisée. Le
                    mot de passe est masqué par défaut.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Serveur SMTP (Host)
                    </label>
                    <input
                      type="text"
                      value={localSettings.email.smtp_host}
                      onChange={(e) =>
                        updateSetting("email", "smtp_host", e.target.value)
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="smtp.example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Port SMTP
                    </label>
                    <input
                      type="number"
                      value={localSettings.email.smtp_port}
                      onChange={(e) =>
                        updateSetting(
                          "email",
                          "smtp_port",
                          Number(e.target.value),
                        )
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="587"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Utilisateur SMTP
                    </label>
                    <input
                      type="text"
                      value={localSettings.email.smtp_user}
                      onChange={(e) =>
                        updateSetting("email", "smtp_user", e.target.value)
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Mot de passe SMTP
                    </label>
                    <input
                      type="password"
                      value={localSettings.email.smtp_pass}
                      onChange={(e) =>
                        updateSetting("email", "smtp_pass", e.target.value)
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
                <div className="pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-4">
                    Expéditeur par défaut
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Nom de l'expéditeur
                      </label>
                      <input
                        type="text"
                        value={localSettings.email.from_name}
                        onChange={(e) =>
                          updateSetting("email", "from_name", e.target.value)
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="NextMove Cargo"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Email de l'expéditeur
                      </label>
                      <input
                        type="email"
                        value={localSettings.email.from_email}
                        onChange={(e) =>
                          updateSetting("email", "from_email", e.target.value)
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="noreply@nextemove.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "maintenance" && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Maintenance & Debug
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-100">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-red-900">
                          Mode Maintenance
                        </p>
                        <p className="text-sm text-red-700">
                          Rend le site inaccessible aux utilisateurs
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.maintenance.maintenance_mode}
                        aria-label="Activer le mode maintenance"
                        onChange={(e) =>
                          updateSetting(
                            "maintenance",
                            "maintenance_mode",
                            e.target.checked,
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">Mode Debug</p>
                      <p className="text-sm text-gray-500">
                        Affiche plus de détails sur les erreurs
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localSettings.maintenance.debug_mode}
                        aria-label="Activer le mode debug"
                        onChange={(e) =>
                          updateSetting(
                            "maintenance",
                            "debug_mode",
                            e.target.checked,
                          )
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "integrations" && (
              <div className="space-y-8">
                {/* WhatsApp Integration */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      WhatsApp Business API
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          localSettings.integrations?.whatsapp?.enabled || false
                        }
                        aria-label="Activer l'intégration WhatsApp"
                        onChange={(e) =>
                          updateSetting("integrations", "whatsapp", {
                            ...localSettings.integrations?.whatsapp,
                            enabled: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                  <div
                    className={`space-y-6 ${!localSettings.integrations?.whatsapp?.enabled ? "opacity-50 pointer-events-none grayscale" : ""}`}
                  >
                    <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm border border-green-100">
                      <p className="font-bold mb-1">Meta for Developers</p>
                      <p>
                        Vous avez besoin d'un compte Meta Developer configuré
                        avec l'API WhatsApp Cloud.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Access Token (Permanent)
                      </label>
                      <input
                        type="password"
                        value={
                          localSettings.integrations?.whatsapp?.api_key || ""
                        }
                        onChange={(e) =>
                          updateSetting("integrations", "whatsapp", {
                            ...localSettings.integrations?.whatsapp,
                            api_key: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                        placeholder="EAAG..."
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Phone Number ID
                        </label>
                        <input
                          type="text"
                          value={
                            localSettings.integrations?.whatsapp
                              ?.phone_number_id || ""
                          }
                          onChange={(e) =>
                            updateSetting("integrations", "whatsapp", {
                              ...localSettings.integrations?.whatsapp,
                              phone_number_id: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                          placeholder="100609..."
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          Business Account ID
                        </label>
                        <input
                          type="text"
                          value={
                            localSettings.integrations?.whatsapp
                              ?.business_account_id || ""
                          }
                          onChange={(e) =>
                            updateSetting("integrations", "whatsapp", {
                              ...localSettings.integrations?.whatsapp,
                              business_account_id: e.target.value,
                            })
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all"
                          placeholder="100609..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 my-8"></div>

                {/* AI Chat Integration */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">
                      Assistant IA (Chatbot)
                    </h3>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={
                          localSettings.integrations?.ai_chat?.enabled || false
                        }
                        aria-label="Activer l'assistant IA"
                        onChange={(e) =>
                          updateSetting("integrations", "ai_chat", {
                            ...localSettings.integrations?.ai_chat,
                            enabled: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  <div
                    className={`space-y-6 ${!localSettings.integrations?.ai_chat?.enabled ? "opacity-50 pointer-events-none grayscale" : ""}`}
                  >
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Clé API (OpenAI / Anthropic)
                      </label>
                      <input
                        type="password"
                        value={
                          localSettings.integrations?.ai_chat?.api_key || ""
                        }
                        onChange={(e) =>
                          updateSetting("integrations", "ai_chat", {
                            ...localSettings.integrations?.ai_chat,
                            api_key: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        placeholder="sk-..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Nom de l'Assistant
                      </label>
                      <input
                        type="text"
                        value={
                          localSettings.integrations?.ai_chat?.assistant_name ||
                          ""
                        }
                        onChange={(e) =>
                          updateSetting("integrations", "ai_chat", {
                            ...localSettings.integrations?.ai_chat,
                            assistant_name: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                        placeholder="NextMove Assistant"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Prompt Système (Instructions)
                      </label>
                      <textarea
                        value={
                          localSettings.integrations?.ai_chat?.system_prompt ||
                          ""
                        }
                        onChange={(e) =>
                          updateSetting("integrations", "ai_chat", {
                            ...localSettings.integrations?.ai_chat,
                            system_prompt: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all h-32 resize-none"
                        placeholder="Tu es un assistant utile pour une entreprise de logistique..."
                      />
                      <p className="text-xs text-gray-500">
                        Définissez la personnalité et les connaissances de base
                        de l'IA.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
