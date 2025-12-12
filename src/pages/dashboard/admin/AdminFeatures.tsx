import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import PageHeader from "../../../components/common/PageHeader";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  ToggleLeft,
  Hash,
  AlertCircle,
} from "lucide-react";
import {
  featureService,
  PlatformFeature,
} from "../../../services/featureService";
import { useToast } from "../../../contexts/ToastContext";

export default function AdminFeatures() {
  const { error: toastError } = useToast();
  const [features, setFeatures] = useState<PlatformFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<PlatformFeature | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [formData, setFormData] = useState<Partial<PlatformFeature>>({
    id: "",
    name: "",
    description: "",
    type: "boolean",
    defaultValue: false,
    category: "core",
  });

  const fetchFeatures = async () => {
    try {
      const data = await featureService.getAllFeatures();
      setFeatures(data);
    } catch (error) {
      console.error("Error loading features:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const handleOpenModal = (feature?: PlatformFeature) => {
    if (feature) {
      setEditingFeature(feature);
      setFormData(feature);
    } else {
      setEditingFeature(null);
      setFormData({
        id: "",
        name: "",
        description: "",
        type: "boolean",
        defaultValue: false,
        category: "core",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingFeature) {
        await featureService.updateFeature(editingFeature.id, formData);
      } else {
        await featureService.createFeature(formData as PlatformFeature);
      }
      fetchFeatures();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving feature:", error);
      toastError("Erreur lors de la sauvegarde (vérifiez que la clé est unique)");
    }
  };

  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null });

  const handleDelete = (id: string) => {
    setConfirmation({ isOpen: true, id });
  };

  const confirmDeleteFeature = async () => {
    if (confirmation.id) {
      try {
        await featureService.deleteFeature(confirmation.id);
        fetchFeatures();
        setConfirmation({ isOpen: false, id: null });
      } catch (error) {
        console.error("Error deleting feature:", error);
      }
    }
  };

  const filteredFeatures = features.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bibliothèque de Fonctionnalités"
        subtitle="Gérez les fonctionnalités disponibles pour les plans d'abonnement"
        action={{
          label: "Nouvelle Fonctionnalité",
          onClick: () => handleOpenModal(),
          icon: Plus,
        }}
      />

      {/* Search and Info */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une fonctionnalité..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm flex items-center gap-2 border border-blue-100">
          <AlertCircle className="w-4 h-4" />
          Ces fonctionnalités servent de modèles pour les plans.
        </div>
      </div>

      {/* Features List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom & Clé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Défaut
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFeatures.map((feature) => (
                <tr
                  key={feature.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div
                        className={`p-2 rounded-lg mr-3 ${feature.category === "core" ? "bg-purple-50 text-purple-600" : feature.category === "usage" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-600"}`}
                      >
                        {feature.type === "limit" ? (
                          <Hash className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {feature.name}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {feature.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div
                      className="text-sm text-gray-500 max-w-xs truncate"
                      title={feature.description}
                    >
                      {feature.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${feature.type === "limit"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                        }`}
                    >
                      {feature.type === "limit"
                        ? "Limite Numérique"
                        : "Oui/Non"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {feature.type === "boolean"
                      ? feature.defaultValue
                        ? "Activé"
                        : "Désactivé"
                      : feature.defaultValue}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(feature)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                        aria-label="Modifier"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(feature.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Supprimer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredFeatures.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              Aucune fonctionnalité trouvée.
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingFeature
                  ? "Modifier la fonctionnalité"
                  : "Nouvelle fonctionnalité"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Fermer"
                title="Fermer"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom affiché
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="Ex: Nombre d'utilisateurs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clé unique (ID technique)
                </label>
                <input
                  type="text"
                  required
                  value={formData.id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      id: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                    })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-mono text-sm"
                  placeholder="Ex: max_users"
                  disabled={!!editingFeature}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none resize-none h-20"
                  placeholder="Description de la fonctionnalité..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as "boolean" | "limit",
                        defaultValue: e.target.value === "limit" ? 0 : false,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                    aria-label="Type"
                    title="Type"
                  >
                    <option value="boolean">Oui/Non (Booléen)</option>
                    <option value="limit">Limite (Numérique)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as any,
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                    aria-label="Catégorie"
                    title="Catégorie"
                  >
                    <option value="core">Principal</option>
                    <option value="usage">Usage</option>
                    <option value="support">Support</option>
                    <option value="integration">Intégration</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valeur par défaut
                </label>
                {formData.type === "limit" ? (
                  <input
                    type="number"
                    value={formData.defaultValue as number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        defaultValue: Number(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    aria-label="Valeur par défaut"
                  />
                ) : (
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="defaultValue"
                        checked={formData.defaultValue === true}
                        onChange={() =>
                          setFormData({ ...formData, defaultValue: true })
                        }
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">Activé</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="defaultValue"
                        checked={formData.defaultValue === false}
                        onChange={() =>
                          setFormData({ ...formData, defaultValue: false })
                        }
                        className="text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">Désactivé</span>
                    </label>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/30 transition-all"
                >
                  {editingFeature ? "Mettre à jour" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ isOpen: false, id: null })}
        onConfirm={confirmDeleteFeature}
        title="Supprimer la fonctionnalité"
        message="Êtes-vous sûr de vouloir supprimer cette fonctionnalité ? Elle ne sera plus disponible pour les nouveaux plans."
        variant="danger"
        confirmLabel="Supprimer"
      />
    </div>
  );
}

