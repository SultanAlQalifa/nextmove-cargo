import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
  Palette,
  Upload,
  Layout,
  Type,
  Save,
  RotateCcw,
  Image as ImageIcon,
  Star,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Globe,
  Smartphone,
  FileText,
  Share2,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Video,
  Search,
  Printer,
} from "lucide-react";
import {
  brandingService,
  BrandingSettings,
} from "../../../services/brandingService";
import { storageService } from "../../../services/storageService";
import { useBranding } from "../../../contexts/BrandingContext";
import { useToast } from "../../../contexts/ToastContext";
import ConfirmationModal from "../../../components/common/ConfirmationModal";

export default function AdminBranding() {
  const { error: toastError } = useToast();
  const [settings, setSettings] = useState<BrandingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("identity");

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await brandingService.getBranding();
        setSettings(data);
      } catch (error) {
        console.error("Error fetching branding:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const { refreshBranding } = useBranding();

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await brandingService.updateBranding(settings);
      await refreshBranding();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving branding:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    if (!settings) return;

    if (key.includes(".")) {
      const parts = key.split(".");

      setSettings((prev) => {
        if (!prev) return prev;
        const newSettings = { ...prev };
        let current: any = newSettings;

        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!current[part]) {
            current[part] = {};
          }
          // Create a shallow copy of the nested object to ensure immutability
          current[part] = { ...current[part] };
          current = current[part];
        }

        current[parts[parts.length - 1]] = value;
        return newSettings;
      });
    } else {
      setSettings({ ...settings, [key]: value });
    }
  };

  const handleFileUpload = async (key: string, file: File) => {
    setSaving(true);
    try {
      // Determine type based on key
      let type: "logo" | "banner" | "icon" = "logo";
      if (key.includes("favicon")) type = "icon";
      else if (key.includes("background")) type = "banner";

      const publicUrl = await storageService.uploadBrandingAsset(type, file);
      handleChange(key, publicUrl);
    } catch (error) {
      console.error("Error uploading branding asset:", error);
      toastError("Erreur lors du téléchargement de l'image.");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "identity", label: "Identité", icon: Layout },
    { id: "hero", label: "Hero", icon: ImageIcon },
    { id: "stats", label: "Statistiques", icon: Star },
    { id: "features", label: "Fonctionnalités", icon: ShieldCheck },
    { id: "howItWorks", label: "Comment ça marche", icon: CheckCircle },
    { id: "testimonials", label: "Témoignages", icon: Star },
    { id: "cta", label: "Appel à l'action", icon: ArrowRight },
    { id: "footer", label: "Pied de page", icon: Globe },
    { id: "social", label: "Réseaux Sociaux", icon: Share2 },
    { id: "seo", label: "Référencement (SEO)", icon: Search },
    { id: "documents", label: "Documents & Factures", icon: Printer },
    { id: "pages", label: "Pages", icon: FileText },
    { id: "pwa", label: "PWA & Mobile", icon: Smartphone },
  ];

  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
  }>({ isOpen: false });

  const handleReset = async () => {
    setConfirmation({ isOpen: true });
  };

  const confirmReset = async () => {
    setLoading(true);
    try {
      const defaults = await brandingService.resetToDefaults();
      setSettings(defaults);
      setConfirmation({ isOpen: false });
    } catch (error) {
      console.error("Error resetting branding:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="relative">
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in-down">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">
            Modifications enregistrées avec succès !
          </span>
        </div>
      )}
      <PageHeader
        title="Personnalisation & Branding"
        subtitle="Gérez l'identité visuelle de votre plateforme"
        action={{
          label: saving ? "Enregistrement..." : "Enregistrer les modifications",
          onClick: handleSave,
          icon: Save,
          disabled: saving,
        }}
      >
        <button
          onClick={handleReset}
          disabled={saving || loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          <span className="font-medium">Réinitialiser par défaut</span>
        </button>
      </PageHeader>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                  : "text-gray-600 hover:bg-gray-50 border-l-4 border-transparent"
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
          {activeTab === "documents" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Paramètres des Documents (Factures)
              </h3>
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 text-blue-700 rounded-xl mb-6 text-sm">
                  <p className="font-bold mb-1">Information</p>
                  <p>
                    Ces informations seront utilisées pour générer les en-têtes
                    et pieds de page des factures PDF.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Logo Facture (Optionnel)
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="w-32 h-12 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                      {settings.documents?.invoice_logo ? (
                        <img
                          src={settings.documents.invoice_logo}
                          alt="Logo Facture"
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">
                          Par défaut
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        id="invoice-logo-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleFileUpload(
                            "documents.invoice_logo",
                            e.target.files[0],
                          )
                        }
                      />
                      <label
                        htmlFor="invoice-logo-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700 shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        Changer le logo
                      </label>
                      <p className="mt-1 text-xs text-gray-500">
                        Si non défini, le logo principal sera utilisé.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="company_name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Nom de la Société (Légal)
                    </label>
                    <input
                      id="company_name"
                      type="text"
                      value={settings.documents?.company_name || ""}
                      onChange={(e) =>
                        handleChange("documents.company_name", e.target.value)
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="Ex: NextMove Cargo SARL"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="company_tax_id"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      NINEA / RC
                    </label>
                    <input
                      id="company_tax_id"
                      type="text"
                      value={settings.documents?.company_tax_id || ""}
                      onChange={(e) =>
                        handleChange("documents.company_tax_id", e.target.value)
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="company_address"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Adresse Complète
                  </label>
                  <input
                    id="company_address"
                    type="text"
                    value={settings.documents?.company_address || ""}
                    onChange={(e) =>
                      handleChange("documents.company_address", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="default_tax_rate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    TVA par défaut (%)
                  </label>
                  <input
                    id="default_tax_rate"
                    type="number"
                    value={settings.documents?.default_tax_rate || 0}
                    onChange={(e) =>
                      handleChange("documents.default_tax_rate", e.target.value)
                    }
                    className="w-32 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="invoice_footer_text"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Pied de page des factures
                  </label>
                  <textarea
                    id="invoice_footer_text"
                    value={settings.documents?.invoice_footer_text || ""}
                    onChange={(e) =>
                      handleChange(
                        "documents.invoice_footer_text",
                        e.target.value,
                      )
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all h-24 resize-none"
                    placeholder="Mentions légales, conditions de paiement..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "identity" && (
            <>
              {/* Identity Section */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  Identité de la Plateforme
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="platform_name"
                      className="text-sm font-medium text-gray-700"
                    >
                      Nom de la plateforme
                    </label>
                    <input
                      id="platform_name"
                      type="text"
                      value={settings.platform_name}
                      onChange={(e) =>
                        handleChange("platform_name", e.target.value)
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo
                      </label>
                      <div className="flex items-start gap-4">
                        <div className="w-32 h-12 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                          {settings.logo_url ? (
                            <img
                              src={settings.logo_url}
                              alt="Logo"
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <span className="text-xs text-gray-400">
                              Aucun logo
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            id="logo-upload"
                            className="hidden"
                            accept="image/*,application/pdf"
                            onChange={(e) =>
                              e.target.files?.[0] &&
                              handleFileUpload("logo_url", e.target.files[0])
                            }
                          />
                          <label
                            htmlFor="logo-upload"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700 shadow-sm"
                          >
                            <Upload className="w-4 h-4" />
                            Changer le logo
                          </label>
                          <p className="mt-1 text-xs text-gray-500">
                            PNG, JPG, SVG (max. 2MB)
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Logo Icone (Sidebar)
                      </label>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                          {settings.logo_nexus_url ? (
                            <img
                              src={settings.logo_nexus_url}
                              alt="Nexus Logo"
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <span className="text-xs text-gray-400">
                              Aucun
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            id="logo-nexus-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) =>
                              e.target.files?.[0] &&
                              handleFileUpload("logo_nexus_url", e.target.files[0])
                            }
                          />
                          <label
                            htmlFor="logo-nexus-upload"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700 shadow-sm"
                          >
                            <Upload className="w-4 h-4" />
                            Changer l'icône
                          </label>
                          <p className="mt-1 text-xs text-gray-500">
                            SVG, PNG Carré (pour Sidebar réduite)
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Favicon
                      </label>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                          {settings.favicon_url ? (
                            <img
                              src={settings.favicon_url}
                              alt="Favicon"
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <span className="text-xs text-gray-400">Aucun</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <input
                            type="file"
                            id="favicon-upload"
                            className="hidden"
                            accept="image/*,application/pdf"
                            onChange={(e) =>
                              e.target.files?.[0] &&
                              handleFileUpload("favicon_url", e.target.files[0])
                            }
                          />
                          <label
                            htmlFor="favicon-upload"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700 shadow-sm"
                          >
                            <Upload className="w-4 h-4" />
                            Changer l'icône
                          </label>
                          <p className="mt-1 text-xs text-gray-500">
                            PNG, ICO (32x32px)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Images & Media Section */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  Images & Médias
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image de fond (Connexion)
                    </label>
                    <div className="flex items-start gap-4">
                      <div className="w-32 h-20 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                        {settings.images?.login_background ? (
                          <img
                            src={settings.images.login_background}
                            alt="Login Background"
                            className="max-w-full max-h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">
                            Aucune image
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          id="login-bg-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) =>
                            e.target.files?.[0] &&
                            handleFileUpload(
                              "images.login_background",
                              e.target.files[0],
                            )
                          }
                        />
                        <label
                          htmlFor="login-bg-upload"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700 shadow-sm"
                        >
                          <Upload className="w-4 h-4" />
                          Changer l'image
                        </label>
                        <p className="mt-1 text-xs text-gray-500">
                          JPG, PNG (1920x1080px)
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image de fond (Sidebar)
                    </label>
                    <div className="flex items-start gap-4">
                      <div className="w-32 h-20 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                        {settings.images?.sidebar_background ? (
                          <img
                            src={settings.images.sidebar_background}
                            alt="Sidebar Background"
                            className="max-w-full max-h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">
                            Aucune image
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          id="sidebar-bg-upload"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) =>
                            e.target.files?.[0] &&
                            handleFileUpload(
                              "images.sidebar_background",
                              e.target.files[0],
                            )
                          }
                        />
                        <label
                          htmlFor="sidebar-bg-upload"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700 shadow-sm"
                        >
                          <Upload className="w-4 h-4" />
                          Changer l'image
                        </label>
                        <p className="mt-1 text-xs text-gray-500">
                          JPG, PNG (Vertical)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Colors Section */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Palette className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Couleurs & Thème
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur Principale
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="primary_color_picker"
                        type="color"
                        value={settings.primary_color}
                        onChange={(e) =>
                          handleChange("primary_color", e.target.value)
                        }
                        className="w-12 h-12 rounded-xl border-0 p-1 cursor-pointer"
                        title="Choose primary color"
                      />
                      <input
                        id="primary_color_text"
                        type="text"
                        value={settings.primary_color}
                        onChange={(e) =>
                          handleChange("primary_color", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
                        aria-label="Primary color hex code"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur Secondaire
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="secondary_color_picker"
                        type="color"
                        value={settings.secondary_color}
                        onChange={(e) =>
                          handleChange("secondary_color", e.target.value)
                        }
                        className="w-12 h-12 rounded-xl border-0 p-1 cursor-pointer"
                        title="Choose secondary color"
                      />
                      <input
                        id="secondary_color_text"
                        type="text"
                        value={settings.secondary_color}
                        onChange={(e) =>
                          handleChange("secondary_color", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
                        aria-label="Secondary color hex code"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Couleur d'Accent
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="accent_color_picker"
                        type="color"
                        value={settings.accent_color}
                        onChange={(e) =>
                          handleChange("accent_color", e.target.value)
                        }
                        className="w-12 h-12 rounded-xl border-0 p-1 cursor-pointer"
                        title="Choose accent color"
                      />
                      <input
                        id="accent_color_text"
                        type="text"
                        value={settings.accent_color}
                        onChange={(e) =>
                          handleChange("accent_color", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
                        aria-label="Accent color hex code"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography Section */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Type className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Typographie
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="font_family_select"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Police de caractères (Google Fonts)
                    </label>
                    <select
                      id="font_family_select"
                      value={settings.font_family}
                      onChange={(e) =>
                        handleChange("font_family", e.target.value)
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    >
                      <option value="Inter, sans-serif">Inter</option>
                      <option value="Roboto, sans-serif">Roboto</option>
                      <option value="Poppins, sans-serif">Poppins</option>
                      <option value="Lato, sans-serif">Lato</option>
                      <option value="Montserrat, sans-serif">Montserrat</option>
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "hero" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Section Hero
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="hero_title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Titre Principal
                  </label>
                  <input
                    id="hero_title"
                    type="text"
                    value={settings.hero?.title || ""}
                    onChange={(e) => handleChange("hero.title", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="hero_subtitle"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Sous-titre
                  </label>
                  <textarea
                    id="hero_subtitle"
                    value={settings.hero?.subtitle || ""}
                    onChange={(e) =>
                      handleChange("hero.subtitle", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all h-24 resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="hero_cta1"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Bouton 1
                    </label>
                    <input
                      id="hero_cta1"
                      type="text"
                      value={settings.hero?.cta1 || ""}
                      onChange={(e) =>
                        handleChange("hero.cta1", e.target.value)
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="hero_cta2"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Bouton 2
                    </label>
                    <input
                      id="hero_cta2"
                      type="text"
                      value={settings.hero?.cta2 || ""}
                      onChange={(e) =>
                        handleChange("hero.cta2", e.target.value)
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "stats" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Statistiques
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="stats_shipments"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Label Expéditions
                  </label>
                  <input
                    id="stats_shipments"
                    type="text"
                    value={settings.stats?.shipments || ""}
                    onChange={(e) =>
                      handleChange("stats.shipments", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="stats_value"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Label Valeur
                  </label>
                  <input
                    id="stats_value"
                    type="text"
                    value={settings.stats?.value || ""}
                    onChange={(e) =>
                      handleChange("stats.value", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="stats_forwarders"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Label Transitaires
                  </label>
                  <input
                    id="stats_forwarders"
                    type="text"
                    value={settings.stats?.forwarders || ""}
                    onChange={(e) =>
                      handleChange("stats.forwarders", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="stats_success"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Label Succès
                  </label>
                  <input
                    id="stats_success"
                    type="text"
                    value={settings.stats?.success || ""}
                    onChange={(e) =>
                      handleChange("stats.success", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "features" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Fonctionnalités
              </h3>
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="features_title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Titre de la section
                  </label>
                  <input
                    id="features_title"
                    type="text"
                    value={settings.features?.title || ""}
                    onChange={(e) =>
                      handleChange("features.title", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="features_subtitle"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Sous-titre
                  </label>
                  <input
                    id="features_subtitle"
                    type="text"
                    value={settings.features?.subtitle || ""}
                    onChange={(e) =>
                      handleChange("features.subtitle", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="features_desc"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description
                  </label>
                  <textarea
                    id="features_desc"
                    value={settings.features?.description || ""}
                    onChange={(e) =>
                      handleChange("features.description", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all h-24 resize-none"
                  />
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">
                    Fonctionnalité 1: Séquestre
                  </h4>
                  <div className="grid gap-4">
                    <div>
                      <label
                        htmlFor="features_escrow_title"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Titre
                      </label>
                      <input
                        id="features_escrow_title"
                        type="text"
                        value={settings.features?.escrow_title || ""}
                        onChange={(e) =>
                          handleChange("features.escrow_title", e.target.value)
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="features_escrow_desc"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Description
                      </label>
                      <textarea
                        id="features_escrow_desc"
                        value={settings.features?.escrow_desc || ""}
                        onChange={(e) =>
                          handleChange("features.escrow_desc", e.target.value)
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all h-20 resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">
                    Fonctionnalité 2: Multimodal
                  </h4>
                  <div className="grid gap-4">
                    <div>
                      <label
                        htmlFor="features_multimodal_title"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Titre
                      </label>
                      <input
                        id="features_multimodal_title"
                        type="text"
                        value={settings.features?.multimodal_title || ""}
                        onChange={(e) =>
                          handleChange(
                            "features.multimodal_title",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="features_multimodal_desc"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Description
                      </label>
                      <textarea
                        id="features_multimodal_desc"
                        value={settings.features?.multimodal_desc || ""}
                        onChange={(e) =>
                          handleChange(
                            "features.multimodal_desc",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all h-20 resize-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h4 className="font-medium text-gray-900 mb-4">
                    Fonctionnalité 3: Suivi
                  </h4>
                  <div className="grid gap-4">
                    <div>
                      <label
                        htmlFor="features_tracking_title"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Titre
                      </label>
                      <input
                        id="features_tracking_title"
                        type="text"
                        value={settings.features?.tracking_title || ""}
                        onChange={(e) =>
                          handleChange(
                            "features.tracking_title",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="features_tracking_desc"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Description
                      </label>
                      <textarea
                        id="features_tracking_desc"
                        value={settings.features?.tracking_desc || ""}
                        onChange={(e) =>
                          handleChange("features.tracking_desc", e.target.value)
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all h-20 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "howItWorks" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Comment ça marche
              </h3>
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="howItWorks_title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Titre
                  </label>
                  <input
                    id="howItWorks_title"
                    type="text"
                    value={settings.howItWorks?.title || ""}
                    onChange={(e) =>
                      handleChange("howItWorks.title", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="howItWorks_subtitle"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Sous-titre
                  </label>
                  <input
                    id="howItWorks_subtitle"
                    type="text"
                    value={settings.howItWorks?.subtitle || ""}
                    onChange={(e) =>
                      handleChange("howItWorks.subtitle", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>

                {[1, 2, 3, 4].map((step) => (
                  <div key={step} className="border-t border-gray-100 pt-6">
                    <h4 className="font-medium text-gray-900 mb-4">
                      Étape {step}
                    </h4>
                    <div className="grid gap-4">
                      <div>
                        <label
                          htmlFor={`howItWorks_step${step}_title`}
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Titre
                        </label>
                        <input
                          id={`howItWorks_step${step}_title`}
                          type="text"
                          value={
                            settings.howItWorks?.[
                            `step${step}_title` as keyof typeof settings.howItWorks
                            ] || ""
                          }
                          onChange={(e) =>
                            handleChange(
                              `howItWorks.step${step}_title`,
                              e.target.value,
                            )
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`howItWorks_step${step}_desc`}
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Description
                        </label>
                        <textarea
                          id={`howItWorks_step${step}_desc`}
                          value={
                            settings.howItWorks?.[
                            `step${step}_desc` as keyof typeof settings.howItWorks
                            ] || ""
                          }
                          onChange={(e) =>
                            handleChange(
                              `howItWorks.step${step}_desc`,
                              e.target.value,
                            )
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all h-20 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "testimonials" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Témoignages
              </h3>
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="testimonials_title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Titre de la section
                  </label>
                  <input
                    id="testimonials_title"
                    type="text"
                    value={settings.testimonials?.title || ""}
                    onChange={(e) =>
                      handleChange("testimonials.title", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>

                {[1, 2, 3].map((review) => (
                  <div key={review} className="border-t border-gray-100 pt-6">
                    <h4 className="font-medium text-gray-900 mb-4">
                      Témoignage {review}
                    </h4>
                    <div className="grid gap-4">
                      <div>
                        <label
                          htmlFor={`testimonials_review${review}_name`}
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Nom
                        </label>
                        <input
                          id={`testimonials_review${review}_name`}
                          type="text"
                          value={
                            settings.testimonials?.[
                            `review${review}_name` as keyof typeof settings.testimonials
                            ] || ""
                          }
                          onChange={(e) =>
                            handleChange(
                              `testimonials.review${review}_name`,
                              e.target.value,
                            )
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`testimonials_review${review}_role`}
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Rôle
                        </label>
                        <input
                          id={`testimonials_review${review}_role`}
                          type="text"
                          value={
                            settings.testimonials?.[
                            `review${review}_role` as keyof typeof settings.testimonials
                            ] || ""
                          }
                          onChange={(e) =>
                            handleChange(
                              `testimonials.review${review}_role`,
                              e.target.value,
                            )
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor={`testimonials_review${review}_text`}
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Texte
                        </label>
                        <textarea
                          id={`testimonials_review${review}_text`}
                          value={
                            settings.testimonials?.[
                            `review${review}_text` as keyof typeof settings.testimonials
                            ] || ""
                          }
                          onChange={(e) =>
                            handleChange(
                              `testimonials.review${review}_text`,
                              e.target.value,
                            )
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all h-24 resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "cta" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Appel à l'action (CTA)
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="cta_title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Titre
                  </label>
                  <input
                    id="cta_title"
                    type="text"
                    value={settings.cta?.title || ""}
                    onChange={(e) => handleChange("cta.title", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cta_subtitle"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Sous-titre
                  </label>
                  <input
                    id="cta_subtitle"
                    type="text"
                    value={settings.cta?.subtitle || ""}
                    onChange={(e) =>
                      handleChange("cta.subtitle", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="cta_button"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Texte Bouton
                  </label>
                  <input
                    id="cta_button"
                    type="text"
                    value={settings.cta?.button || ""}
                    onChange={(e) => handleChange("cta.button", e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "footer" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Pied de page
              </h3>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="footer_tagline"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Slogan
                  </label>
                  <input
                    id="footer_tagline"
                    type="text"
                    value={settings.footer?.tagline || ""}
                    onChange={(e) =>
                      handleChange("footer.tagline", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="footer_rights"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Texte Copyright
                  </label>
                  <input
                    id="footer_rights"
                    type="text"
                    value={settings.footer?.rights || ""}
                    onChange={(e) =>
                      handleChange("footer.rights", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "social" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Réseaux Sociaux
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Ajoutez les liens vers vos profils sociaux pour les afficher
                dans le pied de page.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="social_media_facebook"
                    className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"
                  >
                    <Facebook className="w-4 h-4 text-blue-600" /> Facebook
                  </label>
                  <input
                    id="social_media_facebook"
                    type="url"
                    value={settings.social_media?.facebook || ""}
                    onChange={(e) =>
                      handleChange("social_media.facebook", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="https://facebook.com/votrepage"
                  />
                </div>
                <div>
                  <label
                    htmlFor="social_media_twitter"
                    className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"
                  >
                    <Twitter className="w-4 h-4 text-sky-400" /> Twitter / X
                  </label>
                  <input
                    id="social_media_twitter"
                    type="url"
                    value={settings.social_media?.twitter || ""}
                    onChange={(e) =>
                      handleChange("social_media.twitter", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="https://twitter.com/votrecompte"
                  />
                </div>
                <div>
                  <label
                    htmlFor="social_media_instagram"
                    className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"
                  >
                    <Instagram className="w-4 h-4 text-pink-600" /> Instagram
                  </label>
                  <input
                    id="social_media_instagram"
                    type="url"
                    value={settings.social_media?.instagram || ""}
                    onChange={(e) =>
                      handleChange("social_media.instagram", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="https://instagram.com/votrecompte"
                  />
                </div>
                <div>
                  <label
                    htmlFor="social_media_linkedin"
                    className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"
                  >
                    <Linkedin className="w-4 h-4 text-blue-700" /> LinkedIn
                  </label>
                  <input
                    id="social_media_linkedin"
                    type="url"
                    value={settings.social_media?.linkedin || ""}
                    onChange={(e) =>
                      handleChange("social_media.linkedin", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="https://linkedin.com/company/votrepage"
                  />
                </div>
                <div>
                  <label
                    htmlFor="social_media_tiktok"
                    className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"
                  >
                    <Video className="w-4 h-4 text-black" /> TikTok
                  </label>
                  <input
                    id="social_media_tiktok"
                    type="url"
                    value={settings.social_media?.tiktok || ""}
                    onChange={(e) =>
                      handleChange("social_media.tiktok", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="https://tiktok.com/@votrecompte"
                  />
                </div>
                <div>
                  <label
                    htmlFor="social_media_youtube"
                    className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"
                  >
                    <Youtube className="w-4 h-4 text-red-600" /> YouTube
                  </label>
                  <input
                    id="social_media_youtube"
                    type="url"
                    value={settings.social_media?.youtube || ""}
                    onChange={(e) =>
                      handleChange("social_media.youtube", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="https://youtube.com/c/votrechaine"
                  />
                </div>
                <div>
                  <label
                    htmlFor="social_media_whatsapp"
                    className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"
                  >
                    <Smartphone className="w-4 h-4 text-[#25D366]" /> WhatsApp (Support)
                  </label>
                  <input
                    id="social_media_whatsapp"
                    type="text"
                    value={settings.social_media?.whatsapp_number || ""}
                    onChange={(e) =>
                      handleChange("social_media.whatsapp_number", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="221770000000"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "seo" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Référencement Naturel (SEO)
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Optimisez votre visibilité sur les moteurs de recherche et les
                réseaux sociaux.
              </p>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="seo_meta_title_template"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Modèle de Titre
                  </label>
                  <input
                    id="seo_meta_title_template"
                    type="text"
                    value={settings.seo?.meta_title_template || ""}
                    onChange={(e) =>
                      handleChange("seo.meta_title_template", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="%s | NextMove Cargo"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    %s sera remplacé par le titre de la page actuelle.
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="seo_default_title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Titre par défaut (Site Name)
                  </label>
                  <input
                    id="seo_default_title"
                    type="text"
                    value={settings.seo?.default_title || ""}
                    onChange={(e) =>
                      handleChange("seo.default_title", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="seo_default_description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description par défaut
                  </label>
                  <textarea
                    id="seo_default_description"
                    value={settings.seo?.default_description || ""}
                    onChange={(e) =>
                      handleChange("seo.default_description", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all h-24 resize-none"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    150-160 caractères recommandés.
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="seo_default_keywords"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Mots-clés par défaut
                  </label>
                  <input
                    id="seo_default_keywords"
                    type="text"
                    value={settings.seo?.default_keywords || ""}
                    onChange={(e) =>
                      handleChange("seo.default_keywords", e.target.value)
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="logistique, transport, chine, afrique..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image de partage (OG Image)
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="w-48 h-28 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                      {settings.seo?.og_image ? (
                        <img
                          src={settings.seo.og_image}
                          alt="OG Image"
                          className="max-w-full max-h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">
                          Aucune image
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        id="og-image-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleFileUpload("seo.og_image", e.target.files[0])
                        }
                      />
                      <label
                        htmlFor="og-image-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700 shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        Changer l'image
                      </label>
                      <p className="mt-1 text-xs text-gray-500">
                        JPG, PNG (1200x630px recommandé pour Facebook/Twitter)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "pwa" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Paramètres PWA (Progressive Web App)
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="pwa_name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Nom de l'application
                    </label>
                    <input
                      id="pwa_name"
                      type="text"
                      value={settings.pwa?.name || ""}
                      onChange={(e) => handleChange("pwa.name", e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="NextMove Cargo"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Le nom complet affiché sur l'écran d'accueil.
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="pwa_short_name"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Nom court
                    </label>
                    <input
                      id="pwa_short_name"
                      type="text"
                      value={settings.pwa?.short_name || ""}
                      onChange={(e) =>
                        handleChange("pwa.short_name", e.target.value)
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="NextMove"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Utilisé quand l'espace est limité.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icône de l'application
                  </label>
                  <div className="flex items-start gap-4">
                    <div className="w-24 h-24 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                      {settings.pwa?.icon_url ? (
                        <img
                          src={settings.pwa.icon_url}
                          alt="App Icon"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Smartphone className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        id="pwa-icon-upload"
                        className="hidden"
                        accept="image/png,image/jpeg"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleFileUpload("pwa.icon_url", e.target.files[0])
                        }
                      />
                      <label
                        htmlFor="pwa-icon-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-sm font-medium text-gray-700 shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        Changer l'icône
                      </label>
                      <p className="mt-2 text-xs text-gray-500">
                        Format recommandé : PNG carré (512x512px).
                        <br />
                        Cette image sera utilisée pour l'icône sur l'écran
                        d'accueil et les favoris.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="pwa_theme_color"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Couleur du Thème
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        aria-label="Choisir la couleur du thème"
                        value={settings.pwa?.theme_color || "#1e40af"}
                        onChange={(e) =>
                          handleChange("pwa.theme_color", e.target.value)
                        }
                        className="w-12 h-12 rounded-xl border-0 p-1 cursor-pointer"
                      />
                      <input
                        id="pwa_theme_color"
                        type="text"
                        value={settings.pwa?.theme_color || "#1e40af"}
                        onChange={(e) =>
                          handleChange("pwa.theme_color", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Couleur de la barre d'état mobile.
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="pwa_background_color"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Couleur de Fond
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        aria-label="Choisir la couleur de fond"
                        value={settings.pwa?.background_color || "#ffffff"}
                        onChange={(e) =>
                          handleChange("pwa.background_color", e.target.value)
                        }
                        className="w-12 h-12 rounded-xl border-0 p-1 cursor-pointer"
                      />
                      <input
                        id="pwa_background_color"
                        type="text"
                        value={settings.pwa?.background_color || "#ffffff"}
                        onChange={(e) =>
                          handleChange("pwa.background_color", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Couleur de fond de l'écran de chargement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "pages" && (
            <div className="space-y-6">
              {/* About Page */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  Page À Propos
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="pages_about_title"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Titre Principal
                      </label>
                      <input
                        id="pages_about_title"
                        type="text"
                        value={settings.pages?.about?.title || ""}
                        onChange={(e) =>
                          handleChange("pages.about.title", e.target.value)
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="pages_about_subtitle"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Sous-titre
                      </label>
                      <input
                        id="pages_about_subtitle"
                        type="text"
                        value={settings.pages?.about?.subtitle || ""}
                        onChange={(e) =>
                          handleChange("pages.about.subtitle", e.target.value)
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Mission</h4>
                    <div className="space-y-3">
                      <input
                        aria-label="Titre Mission"
                        type="text"
                        value={settings.pages?.about?.mission_title || ""}
                        onChange={(e) =>
                          handleChange(
                            "pages.about.mission_title",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Titre Mission"
                      />
                      <textarea
                        aria-label="Description Mission"
                        value={settings.pages?.about?.mission_desc || ""}
                        onChange={(e) =>
                          handleChange(
                            "pages.about.mission_desc",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all h-20 resize-none"
                        placeholder="Description Mission"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Vision</h4>
                    <div className="space-y-3">
                      <input
                        aria-label="Titre Vision"
                        type="text"
                        value={settings.pages?.about?.vision_title || ""}
                        onChange={(e) =>
                          handleChange(
                            "pages.about.vision_title",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Titre Vision"
                      />
                      <textarea
                        aria-label="Description Vision"
                        value={settings.pages?.about?.vision_desc || ""}
                        onChange={(e) =>
                          handleChange(
                            "pages.about.vision_desc",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all h-20 resize-none"
                        placeholder="Description Vision"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Valeurs</h4>
                    <div className="space-y-3">
                      <input
                        aria-label="Titre Valeurs"
                        type="text"
                        value={settings.pages?.about?.values_title || ""}
                        onChange={(e) =>
                          handleChange(
                            "pages.about.values_title",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        placeholder="Titre Valeurs"
                      />
                      <textarea
                        aria-label="Description Valeurs"
                        value={settings.pages?.about?.values_desc || ""}
                        onChange={(e) =>
                          handleChange(
                            "pages.about.values_desc",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all h-20 resize-none"
                        placeholder="Description Valeurs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Page */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  Page Contact
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="pages_contact_title"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Titre
                      </label>
                      <input
                        id="pages_contact_title"
                        type="text"
                        value={settings.pages?.contact?.title || ""}
                        onChange={(e) =>
                          handleChange("pages.contact.title", e.target.value)
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="pages_contact_subtitle"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Sous-titre
                      </label>
                      <input
                        id="pages_contact_subtitle"
                        type="text"
                        value={settings.pages?.contact?.subtitle || ""}
                        onChange={(e) =>
                          handleChange("pages.contact.subtitle", e.target.value)
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div>
                        <label
                          htmlFor="pages_contact_email"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Email
                        </label>
                        <input
                          id="pages_contact_email"
                          type="text"
                          value={settings.pages?.contact?.email || ""}
                          onChange={(e) =>
                            handleChange("pages.contact.email", e.target.value)
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="pages_contact_phone"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Téléphone
                        </label>
                        <input
                          id="pages_contact_phone"
                          type="text"
                          value={settings.pages?.contact?.phone || ""}
                          onChange={(e) =>
                            handleChange("pages.contact.phone", e.target.value)
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="pages_contact_address"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Adresse
                        </label>
                        <input
                          id="pages_contact_address"
                          type="text"
                          value={settings.pages?.contact?.address || ""}
                          onChange={(e) =>
                            handleChange(
                              "pages.contact.address",
                              e.target.value,
                            )
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="pages_contact_hours"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Heures d'ouverture
                        </label>
                        <input
                          id="pages_contact_hours"
                          type="text"
                          value={settings.pages?.contact?.hours || ""}
                          onChange={(e) =>
                            handleChange("pages.contact.hours", e.target.value)
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Privacy Page */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">
                    Page Politique de Confidentialité
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="pages_privacy_title"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Titre
                      </label>
                      <input
                        id="pages_privacy_title"
                        type="text"
                        value={settings.pages?.privacy?.title || ""}
                        onChange={(e) =>
                          handleChange("pages.privacy.title", e.target.value)
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="pages_privacy_last_updated"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Dernière mise à jour
                      </label>
                      <input
                        id="pages_privacy_last_updated"
                        type="text"
                        value={settings.pages?.privacy?.last_updated || ""}
                        onChange={(e) =>
                          handleChange(
                            "pages.privacy.last_updated",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="pages_privacy_content"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Contenu (Texte brut pour l'instant)
                      </label>
                      <textarea
                        id="pages_privacy_content"
                        value={settings.pages?.privacy?.content || ""}
                        onChange={(e) =>
                          handleChange("pages.privacy.content", e.target.value)
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all h-64 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ isOpen: false })}
        onConfirm={confirmReset}
        title="Réinitialiser le branding"
        message="Êtes-vous sûr de vouloir réinitialiser tous les paramètres de branding par défaut ? Cette action est irréversible."
        variant="danger"
        confirmLabel="Réinitialiser"
      />
    </div>
  );
}
