import { useState, useEffect } from "react";
import { X, User, Mail, Shield } from "lucide-react";
import { personnelService, Role } from "../../services/personnelService";
import { useToast } from "../../contexts/ToastContext";
import { useAuth } from "../../contexts/AuthContext";

interface CreateUserModalProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateUserModal({
  user,
  onClose,
  onSuccess,
}: CreateUserModalProps) {
  const { success, error: toastError } = useToast();
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    role: "client",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const fetchedRoles = await personnelService.getAssignableRoles("admin");
        setRoles(fetchedRoles);
      } catch (error) {
        console.error("Error loading roles:", error);
      }
    };
    loadRoles();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        phone: (user as any).phone || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user) {
        // Mode Édition (Real API Call)
        const { profileService } = await import("../../services/profileService");
        await profileService.updateProfile(user.id, {
          full_name: formData.fullName,
          role: formData.role as any,
          phone: (formData as any).phone
          // email cannot be updated easily via profile service as it relies on Auth, keeping it read-only mostly or just metadata
        });
        success("Utilisateur modifié avec succès !");
      } else {
        // Mode Création/Invitation
        await personnelService.addSystemUser({
          name: formData.fullName,
          email: formData.email,
          role: formData.role,
          phone: (formData as any).phone
        });
        success("Invitation envoyée avec succès !");
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toastError("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {user ? "Modifier l'utilisateur" : "Inviter un utilisateur"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                title="Nom complet"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                placeholder="John Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                title="Adresse Email"
                disabled={!!user} // Disable email in Edit mode
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${user ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
                  }`}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              type="text"
              value={(formData as any).phone || ""}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value } as any)}
              className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="+221 77..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rôle
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={formData.role}
                title="Rôle utilisateur"
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary appearance-none bg-white"
              >
                <option value="client">Client</option>
                <option value="forwarder">Transitaire</option>
                <optgroup label="Personnel Interne">
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {loading
                ? "Traitement..."
                : user
                  ? "Enregistrer les modifications"
                  : "Envoyer l'invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
