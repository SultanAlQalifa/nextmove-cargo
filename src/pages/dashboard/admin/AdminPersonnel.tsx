import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
  Users,
  Shield,
  Plus,
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  Edit2,
  Trash2,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  personnelService,
  StaffMember,
  Role,
} from "../../../services/personnelService";
import { useToast } from "../../../contexts/ToastContext";
import { useAuth } from "../../../contexts/AuthContext";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import RoleModal from "../../../components/admin/RoleModal";
import AddStaffModal from "../../../components/admin/AddStaffModal";
import TransportBadge from "../../../components/common/TransportBadge";
import KYCBadge from "../../../components/common/KYCBadge";
import ClientTierBadge from "../../../components/common/ClientTierBadge";

export default function AdminPersonnel() {
  const [activeTab, setActiveTab] = useState<"team" | "roles">("team");
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Modals
  // Modals
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    variant: "info" as "info" | "danger" | "warning",
    action: null as (() => Promise<void>) | null,
  });

  const { success, error: toastError } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [staffData, rolesData] = await Promise.all([
        personnelService.getStaff(),
        personnelService.getAssignableRoles("admin"),
      ]);
      setStaff(staffData);
      setRoles(rolesData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toastError("Erreur lors du chargement des données");
    }
  };

  const handleAddStaff = async (data: any) => {
    try {
      if (selectedStaff) {
        await personnelService.updateStaff(selectedStaff.id, data);
        success("Membre mis à jour avec succès");
      } else {
        await personnelService.addStaffMember(data);
        success("Membre ajouté avec succès");
      }
      setIsAddStaffOpen(false);
      setSelectedStaff(null);
      fetchData();
    } catch (error: any) {
      toastError(error.message || "Erreur lors de l'opération");
    }
  };

  const handleToggleStatus = async (member: StaffMember) => {
    const newStatus = member.status === "active" ? "inactive" : "active";
    try {
      await personnelService.updateStatus(member.id, newStatus);
      success(
        `Membre ${newStatus === "active" ? "activé" : "désactivé"} avec succès`,
      );
      fetchData();
    } catch (error: any) {
      toastError("Erreur lors du changement de statut");
    }
  };

  const handleDeleteStaff = (member: StaffMember) => {
    setConfirmModal({
      isOpen: true,
      title: "Supprimer le membre",
      message: `Êtes-vous sûr de vouloir supprimer ${member.name} ?`,
      variant: "danger",
      action: async () => {
        // In a real app, we might soft delete or deactivate
        await personnelService.updateStatus(member.id, "inactive");
        success("Membre désactivé");
        fetchData();
      },
    });
  };

  const handleSaveRole = async (roleData: Omit<Role, "id">) => {
    try {
      if (selectedRole) {
        await personnelService.updateRole(selectedRole.id, roleData);
        success("Rôle mis à jour avec succès");
      } else {
        await personnelService.addRole(roleData);
        success("Rôle créé avec succès");
      }
      setIsAddRoleOpen(false);
      setSelectedRole(null);
      fetchData();
    } catch (error: any) {
      console.error(error);
      throw error; // Let the modal handle the error display
    }
  };

  const handleDeleteRole = (role: Role) => {
    setConfirmModal({
      isOpen: true,
      title: "Supprimer le rôle",
      message: `Êtes-vous sûr de vouloir supprimer le rôle "${role.name}" ? Cette action est irréversible.`,
      variant: "danger",
      action: async () => {
        try {
          await personnelService.deleteRole(role.id);
          success("Rôle supprimé avec succès");
          fetchData();
        } catch (error: any) {
          console.error(error);
          toastError("Erreur lors de la suppression du rôle");
        }
      },
    });
  };

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Personnel & Rôles"
        subtitle="Gérez votre équipe et les permissions d'accès"
        action={{
          label: activeTab === "team" ? "Ajouter un membre" : "Nouveau rôle",
          icon: Plus,
          onClick: () =>
            activeTab === "team"
              ? setIsAddStaffOpen(true)
              : setIsAddRoleOpen(true),
        }}
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("team")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === "team"
            ? "border-primary text-primary"
            : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
        >
          <Users className="w-4 h-4" />
          Équipe
        </button>
        <button
          onClick={() => setActiveTab("roles")}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === "roles"
            ? "border-primary text-primary"
            : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
        >
          <Shield className="w-4 h-4" />
          Rôles & Permissions
        </button>
      </div>

      {activeTab === "team" && (
        <div className="space-y-6">
          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative max-w-md z-10"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un membre..."
              aria-label="Rechercher un membre"
              className="w-full pl-11 pr-4 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/50 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary shadow-lg shadow-slate-200/20 dark:shadow-none transition-all"
            />
          </motion.div>

          {/* Staff List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/50 dark:border-white/5 overflow-visible"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200/50 dark:divide-white/5 text-left">
                <thead className="bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest rounded-tl-3xl">
                      Membre
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Rôle
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Dernière activité
                    </th>
                    <th className="relative px-6 py-4 rounded-tr-3xl">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  <AnimatePresence>
                    {filteredStaff.map((member) => (
                      <motion.tr
                        key={member.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {member.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                            {member.role_details?.name || member.role}
                          </span>
                          {(member.role === "forwarder" ||
                            member.role_details?.role_family === "forwarder") && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                <TransportBadge
                                  modes={member.transport_modes}
                                  size="sm"
                                />
                                {member.kyc_status && (
                                  <KYCBadge
                                    status={member.kyc_status}
                                    size="sm"
                                    showLabel={false}
                                  />
                                )}
                              </div>
                            )}
                          {(member.role === "client" ||
                            member.role_details?.role_family === "client") &&
                            member.client_tier && (
                              <div className="mt-1">
                                <ClientTierBadge
                                  tier={member.client_tier}
                                  size="sm"
                                  showLabel={true}
                                />
                              </div>
                            )}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${member.status === "active"
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                              }`}
                          >
                            {member.status === "active" ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(member.last_active).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveMenu(
                                  activeMenu === member.id ? null : member.id,
                                )
                              }
                              aria-label={`Options pour ${member.name}`}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>

                            {activeMenu === member.id && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={() => setActiveMenu(null)}
                                ></div>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1 animate-in fade-in zoom-in duration-200">
                                  {(() => {
                                    const getRoleRank = (roleName: string) => {
                                      const r = roleName.toLowerCase();
                                      if (r === 'super admin' || r === 'super-admin') return 1;
                                      // Admin, Support, etc are Rank 2 (System)
                                      if (r === 'admin' || r === 'support' || r === 'support manager' || member.role_details?.role_family === 'admin') return 2;
                                      if (r === 'forwarder') return 3;
                                      if (r === 'client') return 4;
                                      return 5;
                                    };

                                    const currentRank = getRoleRank(profile?.role || 'client');
                                    const targetRank = getRoleRank(member.role_details?.name || member.role);


                                    // Allow if Super Admin (Rank 1)
                                    // OR if target rank is lower (higher number) than current rank (e.g. Admin(2) can edit Forwarder(3))
                                    // OR if it is self (users can usually edit their own profile, or at least active/inactive? actually self-deactivation is dangerous, let's keep strict for now)
                                    // Strict Hierarchical: 
                                    const canManage = currentRank === 1 || (currentRank < targetRank);

                                    if (!canManage) {
                                      return (
                                        <div className="px-4 py-2 text-sm text-gray-500 italic flex items-center gap-2">
                                          <Lock className="w-3 h-3" /> Action restreinte
                                        </div>
                                      );
                                    }

                                    return (
                                      <>
                                        <button
                                          onClick={() => {
                                            setSelectedStaff(member);
                                            setIsAddStaffOpen(true);
                                            setActiveMenu(null);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                        >
                                          <Edit2 className="w-4 h-4" /> Modifier
                                        </button>
                                        <button
                                          onClick={() => {
                                            handleToggleStatus(member);
                                            setActiveMenu(null);
                                          }}
                                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${member.status === "active" ? "text-orange-600" : "text-green-600"}`}
                                        >
                                          {member.status === "active" ? (
                                            <>
                                              <XCircle className="w-4 h-4" /> Désactiver
                                            </>
                                          ) : (
                                            <>
                                              <CheckCircle className="w-4 h-4" /> Activer
                                            </>
                                          )}
                                        </button>
                                        <button
                                          onClick={() => {
                                            handleDeleteStaff(member);
                                            setActiveMenu(null);
                                          }}
                                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                          <Trash2 className="w-4 h-4" /> Supprimer
                                        </button>
                                      </>
                                    );
                                  })()}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === "roles" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role, idx) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-200/50 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6" />
                </div>
                {role.is_system && (
                  <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-bold uppercase tracking-widest shadow-sm">
                    <Lock className="w-3 h-3" /> Système
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {role.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{role.description}</p>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {role.permissions.length} permissions
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedRole(role);
                      setIsAddRoleOpen(true);
                    }}
                    className="text-primary font-medium hover:underline"
                  >
                    Modifier
                  </button>
                  {role.name !== "Super Admin" && (
                    <button
                      onClick={() => handleDeleteRole(role)}
                      className="text-red-500 font-medium hover:underline"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={isAddStaffOpen}
        onClose={() => {
          setIsAddStaffOpen(false);
          setSelectedStaff(null);
        }}
        onSubmit={handleAddStaff}
        initialData={selectedStaff}
        roles={roles}
      />

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          if (confirmModal.action) await confirmModal.action();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmLabel="Confirmer"
      />

      <RoleModal
        isOpen={isAddRoleOpen}
        onClose={() => {
          setIsAddRoleOpen(false);
          setSelectedRole(null);
        }}
        onSubmit={handleSaveRole}
        initialData={selectedRole}
      />
    </div>
  );
}
