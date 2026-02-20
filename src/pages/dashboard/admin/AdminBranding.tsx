import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Video,
  Search,
  Printer,
  Flame,
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
        {/* Sidebar Navigation - Sticky and Premium */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="sticky top-24 space-y-2 bg-white dark:bg-gray-900/50 backdrop-blur-md p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            {tabs.map((tab) => {
              const IsActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium transition-all rounded-xl relative group
                    ${IsActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <tab.icon className={`w-4 h-4 ${IsActive ? "text-white" : "text-gray-400 group-hover:text-primary"}`} />
                    <span>{tab.label}</span>
                  </div>
                  {IsActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="w-1 h-4 bg-white/40 rounded-full"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Content Area - Premium Tab Transitions */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
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
                <div className="space-y-8">
                  <div className="bg-white dark:bg-gray-900/40 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 backdrop-blur-md">
                    <div className="grid lg:grid-cols-2 gap-12">
                      <div className="space-y-10">
                        {/* Core Identity */}
                        <section className="space-y-6">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <span className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                              <ShieldCheck className="w-5 h-5" />
                            </span>
                            Identité de Marque
                          </h3>

                          <div className="space-y-4">
                            <label htmlFor="platform_name" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nom de la Plateforme</label>
                            <input
                              id="platform_name"
                              type="text"
                              value={settings.platform_name || ""}
                              onChange={(e) => handleChange("platform_name", e.target.value)}
                              className="w-full px-5 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                              placeholder="NextMove Cargo"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <label htmlFor="logo-upload" className="text-xs font-bold text-gray-400 uppercase tracking-wider">Logo Principal</label>
                              <div className="relative group aspect-video bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center transition-all hover:border-primary">
                                {settings.logo_url ? (
                                  <img src={settings.logo_url} alt="Logo" className="max-w-full max-h-full p-4 object-contain" />
                                ) : (
                                  <div className="text-center p-2">
                                    <Upload className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                                    <span className="text-[10px] text-gray-400">Upload</span>
                                  </div>
                                )}
                                <input
                                  id="logo-upload"
                                  title="Upload Logo Principal"
                                  type="file"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  accept="image/*"
                                  onChange={(e) => e.target.files?.[0] && handleFileUpload("logo_url", e.target.files[0])}
                                />
                              </div>
                            </div>
                            <div className="space-y-3">
                              <label htmlFor="favicon-upload" className="text-xs font-bold text-gray-400 uppercase tracking-wider">Favicon</label>
                              <div className="relative group aspect-square w-20 mx-auto bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center transition-all hover:border-primary">
                                {settings.favicon_url ? (
                                  <img src={settings.favicon_url} alt="Favicon" className="w-10 h-10 object-contain" />
                                ) : (
                                  <Globe className="w-6 h-6 text-gray-300" />
                                )}
                                <input
                                  id="favicon-upload"
                                  title="Upload Favicon"
                                  type="file"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  accept="image/x-icon,image/png"
                                  onChange={(e) => e.target.files?.[0] && handleFileUpload("favicon_url", e.target.files[0])}
                                />
                              </div>
                            </div>
                          </div>
                        </section>

                        {/* Theme Colors */}
                        <section className="space-y-6 pt-8 border-t border-gray-100 dark:border-gray-800">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <span className="w-8 h-8 bg-orange-50 dark:bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-600">
                              <Palette className="w-5 h-5" />
                            </span>
                            Thème & Couleurs
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                              <label htmlFor="primary-color-picker" className="block text-xs font-bold text-gray-400 uppercase mb-4">Primaire</label>
                              <div className="flex items-center gap-4">
                                <input
                                  id="primary-color-picker"
                                  title="Sélecteur de couleur primaire"
                                  type="color"
                                  value={settings.primary_color || "#1e40af"}
                                  onChange={(e) => handleChange("primary_color", e.target.value)}
                                  className="w-12 h-12 rounded-xl border-4 border-white dark:border-gray-800 shadow-xl cursor-pointer"
                                />
                                <input
                                  title="Code hexadécimal couleur primaire"
                                  type="text"
                                  value={settings.primary_color || "#1e40af"}
                                  onChange={(e) => handleChange("primary_color", e.target.value)}
                                  className="flex-1 px-3 py-2 text-sm font-mono text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl uppercase"
                                  placeholder="#000000"
                                />
                              </div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                              <label htmlFor="secondary-color-picker" className="block text-xs font-bold text-gray-400 uppercase mb-4">Secondaire</label>
                              <div className="flex items-center gap-4">
                                <input
                                  id="secondary-color-picker"
                                  title="Sélecteur de couleur secondaire"
                                  type="color"
                                  value={settings.secondary_color || "#1e3a8a"}
                                  onChange={(e) => handleChange("secondary_color", e.target.value)}
                                  className="w-12 h-12 rounded-xl border-4 border-white dark:border-gray-800 shadow-xl cursor-pointer"
                                />
                                <input
                                  title="Code hexadécimal couleur secondaire"
                                  type="text"
                                  value={settings.secondary_color || "#1e3a8a"}
                                  onChange={(e) => handleChange("secondary_color", e.target.value)}
                                  className="flex-1 px-3 py-2 text-sm font-mono text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl uppercase"
                                  placeholder="#000000"
                                />
                              </div>
                            </div>
                          </div>
                        </section>
                      </div>

                      {/* Live Visualization Mockup */}
                      <div className="flex flex-col items-center justify-center space-y-6">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Aperçu application</label>
                        <div className="relative w-[280px] h-[540px] bg-[#111] rounded-[3.5rem] border-[10px] border-[#222] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden">
                          {/* Notch */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#222] rounded-b-3xl z-20" />

                          {/* Screen Content */}
                          <div className="h-full bg-slate-50 dark:bg-gray-900 overflow-hidden">
                            {/* App Header */}
                            <div className="h-20 bg-white dark:bg-gray-800 flex items-end justify-between px-6 pb-4 border-b dark:border-gray-700">
                              <div className="h-7 w-28">
                                {settings.logo_url ? (
                                  <img src={settings.logo_url} alt="App Logo" className="h-full object-contain" />
                                ) : (
                                  <span className="font-bold text-primary">{settings.platform_name || "NextMove"}</span>
                                )}
                              </div>
                              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700" />
                            </div>

                            {/* App Body */}
                            <div className="p-6 space-y-6">
                              <div className="h-32 rounded-3xl bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-2">
                                    <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded" />
                                    <div className="w-24 h-4 bg-gray-100 dark:bg-gray-600 rounded-lg" />
                                  </div>
                                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-primary/10">
                                    <Flame className="w-5 h-5 text-primary" style={{ color: settings.primary_color }} />
                                  </div>
                                </div>
                                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "65%" }}
                                    className="h-full bg-primary"
                                    style={{ backgroundColor: settings.primary_color }}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                {[1, 2, 3, 4].map(i => (
                                  <div key={i} className="aspect-square rounded-[2rem] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-center p-4">
                                    <div className="w-full h-full rounded-2xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
                                      <motion.div
                                        className="w-6 h-6 rounded-lg opacity-20"
                                        style={{ backgroundColor: settings.primary_color }}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="w-full h-14 rounded-2xl flex items-center justify-center text-sm font-bold text-white shadow-xl shadow-primary/20"
                                style={{ backgroundColor: settings.primary_color }}
                              >
                                Nouveau Colis
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-gray-900/40 p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-lg">
                        <Type className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Typographie
                      </h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="font_family_select"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                        >
                          Police de caractères (Google Fonts)
                        </label>
                        <select
                          id="font_family_select"
                          value={settings.font_family}
                          onChange={(e) =>
                            handleChange("font_family", e.target.value)
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        >
                          <option value="Inter, sans-serif">Inter</option>
                          <option value="Roboto, sans-serif">Roboto</option>
                          <option value="Montserrat, sans-serif">Montserrat</option>
                          <option value="Poppins, sans-serif">Poppins</option>
                          <option value="Lato, sans-serif">Lato</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
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
                        Label Prestataires
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
                                (settings.howItWorks as any)?.[`step${step}_title`] || ""
                              }
                              onChange={(e) =>
                                handleChange(
                                  `howItWorks.step${step}_title`,
                                  e.target.value
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
                                (settings.howItWorks as any)?.[`step${step}_desc`] || ""
                              }
                              onChange={(e) =>
                                handleChange(
                                  `howItWorks.step${step}_desc`,
                                  e.target.value
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
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-900/40 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                      Réseaux Sociaux
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                      Ajoutez les liens vers vos profils sociaux pour les afficher
                      dans le pied de page et améliorer votre présence en ligne.
                    </p>

                    <div className="grid lg:grid-cols-2 gap-10">
                      <div className="grid grid-cols-1 gap-6">
                        <div>
                          <label
                            htmlFor="social_media_facebook"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"
                          >
                            <Facebook className="w-4 h-4 text-[#1877F2]" /> Facebook
                          </label>
                          <input
                            id="social_media_facebook"
                            type="url"
                            value={settings.social_media?.facebook || ""}
                            onChange={(e) =>
                              handleChange("social_media.facebook", e.target.value)
                            }
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="https://facebook.com/votrepage"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="social_media_twitter"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"
                          >
                            <Twitter className="w-4 h-4 text-[#1DA1F2]" /> Twitter / X
                          </label>
                          <input
                            id="social_media_twitter"
                            type="url"
                            value={settings.social_media?.twitter || ""}
                            onChange={(e) =>
                              handleChange("social_media.twitter", e.target.value)
                            }
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="https://twitter.com/votrecompte"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="social_media_instagram"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"
                          >
                            <Instagram className="w-4 h-4 text-[#E4405F]" /> Instagram
                          </label>
                          <input
                            id="social_media_instagram"
                            type="url"
                            value={settings.social_media?.instagram || ""}
                            onChange={(e) =>
                              handleChange("social_media.instagram", e.target.value)
                            }
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="https://instagram.com/votrecompte"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="social_media_linkedin"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"
                          >
                            <Linkedin className="w-4 h-4 text-[#0A66C2]" /> LinkedIn
                          </label>
                          <input
                            id="social_media_linkedin"
                            type="url"
                            value={settings.social_media?.linkedin || ""}
                            onChange={(e) =>
                              handleChange("social_media.linkedin", e.target.value)
                            }
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="https://linkedin.com/company/votrepage"
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Aperçu Réseaux</h4>
                        <div className="bg-slate-50 dark:bg-gray-800/50 p-8 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                          <div className="flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                              <Share2 className="w-10 h-10 text-primary" />
                            </div>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-2 underline underline-offset-4 decoration-primary/30">Connectez-vous à nous</h4>
                            <p className="text-sm text-gray-500 mb-6">Suivez {settings.platform_name} sur vos plateformes favorites.</p>

                            <div className="flex flex-wrap justify-center gap-4">
                              {settings.social_media?.facebook && (
                                <motion.a whileHover={{ y: -4 }} href="#" className="w-10 h-10 bg-[#1877F2] text-white rounded-full flex items-center justify-center shadow-lg">
                                  <Facebook size={18} />
                                </motion.a>
                              )}
                              {settings.social_media?.twitter && (
                                <motion.a whileHover={{ y: -4 }} href="#" className="w-10 h-10 bg-[#1DA1F2] text-white rounded-full flex items-center justify-center shadow-lg">
                                  <Twitter size={18} />
                                </motion.a>
                              )}
                              {settings.social_media?.instagram && (
                                <motion.a whileHover={{ y: -4 }} href="#" className="w-10 h-10 bg-gradient-to-tr from-[#FFDC80] via-[#E1306C] to-[#405DE6] text-white rounded-full flex items-center justify-center shadow-lg">
                                  <Instagram size={18} />
                                </motion.a>
                              )}
                              {settings.social_media?.linkedin && (
                                <motion.a whileHover={{ y: -4 }} href="#" className="w-10 h-10 bg-[#0A66C2] text-white rounded-full flex items-center justify-center shadow-lg">
                                  <Linkedin size={18} />
                                </motion.a>
                              )}
                              {settings.social_media?.tiktok && (
                                <motion.a whileHover={{ y: -4 }} href="#" className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center shadow-lg">
                                  <Video size={18} />
                                </motion.a>
                              )}
                            </div>

                            {settings.social_media?.whatsapp_number && (
                              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="mt-8">
                                <div className="px-6 py-2 bg-[#25D366] text-white rounded-full text-sm font-bold flex items-center gap-2 shadow-lg shadow-[#25D366]/20">
                                  <Smartphone size={16} /> Support Live
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "seo" && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-gray-900/40 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 backdrop-blur-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                      Référencement Naturel (SEO)
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                      Optimisez votre visibilité sur les moteurs de recherche et les
                      réseaux sociaux.
                    </p>

                    <div className="grid lg:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div>
                          <label
                            htmlFor="seo_meta_title_template"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
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
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="%s | NextMove Cargo"
                          />
                          <p className="mt-2 text-[10px] text-gray-400">
                            %s sera remplacé par le titre de la page actuelle.
                          </p>
                        </div>
                        <div>
                          <label
                            htmlFor="seo_default_title"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
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
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="seo_default_description"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                          >
                            Description par défaut
                          </label>
                          <textarea
                            id="seo_default_description"
                            value={settings.seo?.default_description || ""}
                            onChange={(e) =>
                              handleChange("seo.default_description", e.target.value)
                            }
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all h-24 resize-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Aperçu Google</h4>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm max-w-md">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-700" />
                            <span className="text-[12px] text-gray-600 dark:text-gray-400">www.nextmove-cargo.com</span>
                          </div>
                          <h4 className="text-[#1a0dab] dark:text-[#8ab4f8] text-xl hover:underline cursor-pointer mb-1 leading-tight">
                            {settings.seo?.default_title || "NextMove Cargo"}
                          </h4>
                          <p className="text-[14px] text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2">
                            {settings.seo?.default_description || "Votre partenaire logistique premium pour vos envois entre la Chine et l'Afrique."}
                          </p>
                        </div>

                        <div className="mt-8">
                          <label htmlFor="og-image-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                            Image de partage (OG Image)
                          </label>
                          <div className="relative group">
                            <div className="aspect-[1.91/1] w-full bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center transition-all group-hover:border-primary">
                              {settings.seo?.og_image ? (
                                <img
                                  src={settings.seo.og_image}
                                  alt="OG Preview"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-center p-4">
                                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                  <span className="text-xs text-gray-400 font-medium tracking-tight">Cliquer pour uploader</span>
                                </div>
                              )}
                              <input
                                type="file"
                                id="og-image-upload"
                                title="Upload Image de partage SEO"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                accept="image/*"
                                onChange={(e) =>
                                  e.target.files?.[0] &&
                                  handleFileUpload("seo.og_image", e.target.files[0])
                                }
                              />
                            </div>
                          </div>
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
              )}
            </motion.div>
          </AnimatePresence>
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
