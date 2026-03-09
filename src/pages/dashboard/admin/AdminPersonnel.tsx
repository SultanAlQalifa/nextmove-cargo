import { useState, useEffect, useCallback } from "react";
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
  Clock,
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

  const fetchData = useCallback(async () => {
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
  }, [toastError]);

  useEffect(() => {
    let ignore = false;
    const fetchAllData = async () => {
      try {
        const [staffData, rolesData] = await Promise.all([
          personnelService.getStaff(),
          personnelService.getAssignableRoles("admin"),
        ]);
        if (!ignore) {
          setStaff(staffData);
          setRoles(rolesData);
        }
      } catch (error) {
        if (!ignore) {
          console.error("Error fetching data:", error);
          toastError("Erreur lors du chargement des données");
        }
      }
    };
    fetchAllData();
    return () => {
      ignore = true;
    };
  }, [toastError]);

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
    } catch {
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
        <div className="space-y-8">
          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Total Équipe", value: staff.length, icon: Users, color: "blue" },
              { label: "Actifs", value: staff.filter(s => s.status === 'active').length, icon: CheckCircle, color: "emerald" },
              { label: "Inactifs", value: staff.filter(s => s.status === 'inactive').length, icon: XCircle, color: "gray" },
              { label: "Vérifiés", value: staff.filter(s => s.kyc_status === 'verified').length, icon: Shield, color: "indigo" },
            ].map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200/50 dark:border-white/5 shadow-xl shadow-slate-200/40 dark:shadow-none flex items-center gap-4 group hover:-translate-y-1 transition-all"
              >
                <div className={`p-4 bg-${stat.color}-500/10 text-${stat.color}-600 dark:text-${stat.color}-400 rounded-2xl group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

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
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="group relative"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 via-transparent to-indigo-500/5 blur-3xl opacity-50 -z-10 rounded-[3rem]"></div>

            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200/50 dark:border-white/5 overflow-x-auto overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200/50 dark:divide-white/5 text-left">
                <thead className="bg-slate-50/30 dark:bg-slate-800/20 backdrop-blur-md">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                      Membre
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                      Rôle & Expertise
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                      État de Compte
                    </th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                      Dernière Connexion
                    </th>
                    <th className="px-8 py-5 relative">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  <AnimatePresence>
                    {filteredStaff.map((member) => (
                      <motion.tr
                        key={member.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="hover:bg-slate-50/40 dark:hover:bg-white/[0.02] transition-colors group relative"
                      >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-black shadow-inner group-hover:scale-110 transition-transform duration-500">
                                {member.name.charAt(0)}
                              </div>
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-slate-900 ${member.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                                {member.name}
                              </p>
                              <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                {member.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col gap-1.5">
                            <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase tracking-widest w-fit border border-blue-500/10">
                              {member.role_details?.name || member.role}
                            </span>
                            {(member.role === "forwarder" ||
                              member.role_details?.role_family === "forwarder") && (
                                <div className="flex flex-wrap gap-1">
                                  <TransportBadge
                                    modes={member.transport_modes}
                                    size="sm"
                                  />
                                </div>
                              )}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            {member.kyc_status && (
                              <KYCBadge
                                status={member.kyc_status}
                                size="sm"
                                showLabel={true}
                              />
                            )}
                            {member.status === 'active' ? (
                              <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/10">
                                <CheckCircle className="w-3 h-3" /> Actif
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-500/10 px-2 py-1 rounded-lg border border-slate-500/10">
                                <XCircle className="w-3 h-3" /> Inactif
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Clock className="w-4 h-4 opacity-40" />
                            <span className="text-sm font-medium">
                              {new Date(member.last_active).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
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
                                    const getRoleRank = (roleName?: string) => {
                                      if (!roleName) return 5;
                                      const r = roleName.toLowerCase();
                                      if (r === 'super admin' || r === 'super-admin') return 1;
                                      // Admin, Support, etc are Rank 2 (System)
                                      if (r === 'admin' || r === 'support' || r === 'support manager' || member.role_details?.role_family === 'admin') return 2;
                                      if (r === 'forwarder') return 3;
                                      if (r === 'client') return 4;
                                      return 5;
                                    };

                                    const currentRank = getRoleRank(profile?.role);
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
