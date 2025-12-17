import { useState, useEffect } from "react";
import { X, Shield, Info, Check, Save } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import {
  personnelService,
  Role,
  Permission,
  ROLE_FAMILIES,
  RoleFamilyType,
} from "../../services/personnelService";
import { useAuth } from "../../contexts/AuthContext";

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Role, "id">) => Promise<void>;
  initialData?: Role | null;
}

export default function RoleModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: RoleModalProps) {
  const [formData, setFormData] = useState<Omit<Role, "id">>({
    name: "",
    description: "",
    permissions: [],
    is_system: false,
    role_family: "admin", // Default
  });
  const [selectedFamily, setSelectedFamily] = useState<RoleFamilyType>("admin");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPermissions = async () => {
      setLoading(true);
      try {
        const data = await personnelService.getPermissions();
        setPermissions(data);
      } catch (error) {
        console.error("Error fetching permissions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchPermissions();
      if (initialData) {
        // If editing, use existing role_family or deduce it
        const family = initialData.role_family || "admin";
        setFormData({
          name: initialData.name,
          description: initialData.description,
          permissions: initialData.permissions,
          is_system: initialData.is_system,
          role_family: family,
        });
        setSelectedFamily(family);
      } else {
        setFormData({
          name: "",
          description: "",
          permissions: ROLE_FAMILIES["admin"].permissions,
          is_system: false,
          role_family: "admin",
        });
        setSelectedFamily("admin");
      }
    }
  }, [isOpen, initialData]);

  const handleFamilyChange = (family: RoleFamilyType) => {
    if (family === "custom") return; // Should not happen in UI

    setSelectedFamily(family);
    const familyConfig = ROLE_FAMILIES[family];

    setFormData((prev) => ({
      ...prev,
      role_family: family,
      permissions: familyConfig.permissions,
      // Only update name/desc if they are empty or default
      name:
        prev.name === "" || prev.name === ROLE_FAMILIES[selectedFamily]?.label
          ? familyConfig.label
          : prev.name,
      description:
        prev.description === "" || prev.description.includes("Rôle standard")
          ? `Rôle standard pour ${familyConfig.label}`
          : prev.description,
    }));
  };

  const handlePermissionToggle = (permissionId: string) => {
    setFormData((prev) => {
      const newPermissions = prev.permissions.includes(permissionId)
        ? prev.permissions.filter((id) => id !== permissionId)
        : [...prev.permissions, permissionId];

      return { ...prev, permissions: newPermissions };
    });
  };

  const { success, error: toastError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(formData);
      success("Rôle enregistré avec succès");
      onClose();
    } catch (error: any) {
      console.error("Error saving role:", error);
      toastError(
        `Erreur lors de l'enregistrement du rôle: ${error.message || "Erreur inconnue"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Group permissions by category
  const groupedPermissions = permissions.reduce(
    (acc, perm) => {
      if (!acc[perm.category]) acc[perm.category] = [];
      acc[perm.category].push(perm);
      return acc;
    },
    {} as Record<string, Permission[]>,
  );

  const categoryLabels: Record<string, string> = {
    users: "Utilisateurs",
    finance: "Finance",
    support: "Support",
    settings: "Paramètres",
    operations: "Opérations",
  };

  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === "super-admin";
  const isReadOnly = initialData?.is_system && !isSuperAdmin;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${initialData?.is_system ? "bg-purple-100" : "bg-primary/10"}`}
            >
              <Shield
                className={`w-6 h-6 ${initialData?.is_system ? "text-purple-600" : "text-primary"}`}
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {initialData
                  ? initialData.is_system
                    ? "Rôle Système"
                    : "Modifier le Rôle"
                  : "Nouveau Rôle"}
              </h2>
              <p className="text-sm text-gray-500">
                {initialData?.is_system && !isSuperAdmin
                  ? "Ce rôle est géré par le système et ne peut pas être modifié"
                  : "Définissez les accès et permissions"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {initialData?.is_system && (
          <div className={`px-6 py-3 border-b flex items-center gap-3 ${isSuperAdmin ? "bg-orange-50 border-orange-100" : "bg-purple-50 border-purple-100"}`}>
            <Info className={`w-5 h-5 flex-shrink-0 ${isSuperAdmin ? "text-orange-600" : "text-purple-600"}`} />
            <p className={`text-sm ${isSuperAdmin ? "text-orange-800" : "text-purple-800"}`}>
              {isSuperAdmin ? (
                <>
                  <strong>Mode Super Admin :</strong> Vous avez l'autorisation exceptionnelle de modifier ce rôle système.
                  Soyez prudent, cela peut affecter la stabilité de l'application.
                </>
              ) : (
                <>
                  <strong>Protection Système :</strong> Les rôles critiques sont protégés.
                  Seul le Super Admin peut modifier ces permissions.
                </>
              )}
            </p>
          </div>
        )}

        <form
          id="role-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          <div className="space-y-4">
            {/* Role Family Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Famille de rôle (Modèle)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(Object.keys(ROLE_FAMILIES) as RoleFamilyType[])
                  .filter((f) => f !== "custom")
                  .map((family) => (
                    <button
                      key={family}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => handleFamilyChange(family)}
                      className={`
                                            px-3 py-2 rounded-lg text-sm font-medium border transition-all
                                            ${selectedFamily === family
                          ? "bg-primary/5 border-primary text-primary"
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                        }
                                            ${isReadOnly ? "opacity-50 cursor-not-allowed" : ""}
                                        `}
                    >
                      {ROLE_FAMILIES[family].label}
                    </button>
                  ))}
              </div>
              <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Sélectionner une famille pré-coche les permissions recommandées.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du rôle
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={isReadOnly}
                  className={`
                                        w-full px-4 py-2 rounded-xl border focus:ring-2 outline-none transition-all
                                        ${isReadOnly
                      ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                      : "border-gray-200 focus:border-primary focus:ring-primary/20 bg-white"
                    }
                                    `}
                  placeholder="Ex: Support Manager"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  disabled={isReadOnly}
                  className={`
                                        w-full px-4 py-2 rounded-xl border focus:ring-2 outline-none transition-all
                                        ${isReadOnly
                      ? "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
                      : "border-gray-200 focus:border-primary focus:ring-primary/20 bg-white"
                    }
                                    `}
                  placeholder="Description courte..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Permissions
              </label>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(
                    ([category, perms]) => {
                      const allSelected = perms.every((p) =>
                        formData.permissions.includes(p.id),
                      );

                      const toggleCategory = () => {
                        setFormData((prev) => {
                          const categoryIds = perms.map((p) => p.id);
                          const newPermissions = allSelected
                            ? prev.permissions.filter(
                              (id) => !categoryIds.includes(id),
                            )
                            : [
                              ...new Set([
                                ...prev.permissions,
                                ...categoryIds,
                              ]),
                            ];

                          if (selectedFamily !== "custom")
                            setSelectedFamily("custom");

                          return { ...prev, permissions: newPermissions };
                        });
                      };

                      return (
                        <div
                          key={category}
                          className="bg-gray-50 rounded-xl p-4 border border-gray-100"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                              {categoryLabels[category] || category}
                              <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                                {
                                  perms.filter((p) =>
                                    formData.permissions.includes(p.id),
                                  ).length
                                }
                                /{perms.length}
                              </span>
                            </h4>
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={toggleCategory}
                                className="text-xs font-medium text-primary hover:text-primary-dark transition-colors"
                              >
                                {allSelected
                                  ? "Tout désélectionner"
                                  : "Tout sélectionner"}
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {perms.map((perm) => (
                              <label
                                key={perm.id}
                                className={`
                                                                flex items-center gap-3 p-3 rounded-lg border transition-all group relative
                                                                ${formData.permissions.includes(
                                  perm.id,
                                ) ||
                                    formData.permissions.includes(
                                      "all",
                                    )
                                    ? "bg-white border-primary shadow-sm"
                                    : "bg-white border-gray-200 hover:border-gray-300"
                                  }
                                                                ${isReadOnly ? "cursor-not-allowed opacity-80 bg-gray-50" : "cursor-pointer"}
                                                            `}
                                title={perm.label}
                              >
                                <div
                                  className={`
                                                                w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0
                                                                ${formData.permissions.includes(
                                    perm.id,
                                  ) ||
                                      formData.permissions.includes(
                                        "all",
                                      )
                                      ? (isReadOnly
                                        ? "bg-gray-400 border-gray-400"
                                        : "bg-primary border-primary") +
                                      " text-white"
                                      : "border-gray-300 bg-white group-hover:border-primary"
                                    }
                                                            `}
                                >
                                  {(formData.permissions.includes(perm.id) ||
                                    formData.permissions.includes("all")) && (
                                      <Check className="w-3 h-3" />
                                    )}
                                </div>
                                <input
                                  type="checkbox"
                                  disabled={isReadOnly}
                                  className="hidden"
                                  checked={
                                    formData.permissions.includes(perm.id) ||
                                    formData.permissions.includes("all")
                                  }
                                  onChange={() =>
                                    !isReadOnly &&
                                    handlePermissionToggle(perm.id)
                                  }
                                />
                                <span className="text-sm text-gray-700 truncate">
                                  {perm.label}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="role-form"
            disabled={saving || isReadOnly}
            className="px-6 py-2.5 text-sm font-medium text-white bg-primary rounded-xl hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm shadow-primary/30 transition-all"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isReadOnly
                  ? "Lecture Seule"
                  : initialData
                    ? "Mettre à jour"
                    : "Créer le rôle"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
