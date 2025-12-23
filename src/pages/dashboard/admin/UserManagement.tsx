import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import CreateUserModal from "../../../components/admin/CreateUserModal";
import UserProfileModal from "../../../components/admin/UserProfileModal";
import WalletManagementModal from "../../../components/admin/WalletManagementModal";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import {
  User,
  Search,
  Filter,
  MoreVertical,
  Shield,
  Calendar,
  X,
  Users,
  UserCheck,
  UserPlus,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from "lucide-react";

export default function UserManagement() {
  const { profile } = useAuth();
  const { success, error: toastError } = useToast();
  // Data State
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [timeRange, setTimeRange] = useState<
    "7d" | "30d" | "3m" | "1y" | "all" | "custom"
  >("30d");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Wallet Modal State
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [selectedUserWallet, setSelectedUserWallet] = useState<any>(null);

  // Confirmation Modal State
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    type: "delete" | "upgrade" | null;
    user: any | null;
    title: string;
    message: string;
    variant: "danger" | "warning" | "success";
  }>({
    isOpen: false,
    type: null,
    user: null,
    title: "",
    message: "",
    variant: "warning",
  });

  // Stats State
  const [stats, setStats] = useState({
    total: { value: 0, trend: "+0%", trendUp: true },
    active: { value: 0, trend: "+0%", trendUp: true },
    new: { value: 0, trend: "+0%", trendUp: true },
  });

  // Fetch Users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Dynamic import to avoid circular dependencies if any
      const { profileService } =
        await import("../../../services/profileService");
      const data = await profileService.getAllProfiles();

      // Map profile data to UI format
      const mappedUsers = data.map((p) => ({
        id: p.id,
        friendly_id: p.friendly_id,
        name: p.full_name || p.email.split("@")[0],
        email: p.email,
        role: p.role
          ? p.role.charAt(0).toUpperCase() + p.role.slice(1)
          : "Client",
        status:
          p.account_status === "active"
            ? "Actif"
            : p.account_status === "suspended"
              ? "Suspendu"
              : "Inactif",
        joined_at: (p as any).created_at || new Date().toISOString(),
        phone: p.phone || "-",
        company: p.company_name || "-",
        location: p.country || "-",
      }));

      setUsers(mappedUsers);
      setFilteredUsers(mappedUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      const { profileService } =
        await import("../../../services/profileService");
      // If currently active, suspend. If suspended or inactive, activate.
      const newStatus = currentStatus === "Actif" ? "suspended" : "active";
      await profileService.updateStatus(userId, newStatus);
      await fetchUsers();
      success(
        `Utilisateur ${newStatus === "active" ? "activé" : "suspendu"} avec succès.`,
      );
    } catch (err) {
      console.error(err);
      toastError("Erreur lors de la mise à jour du statut.");
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmation.user || !confirmation.type) return;

    const user = confirmation.user;
    setLoading(true); // Show loading state on main or modal

    try {
      if (confirmation.type === "upgrade") {
        const { profileService } =
          await import("../../../services/profileService");
        await profileService.upgradeToForwarder(user.id);
        success("Utilisateur promu transitaire avec succès !");
      } else if (confirmation.type === "delete") {
        const { supabase } = await import("../../../lib/supabase");
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("id", user.id);
        if (error) throw error;
        success("Utilisateur supprimé.");
      }
      await fetchUsers();
    } catch (err) {
      console.error(err);
      toastError("Une erreur est survenue lors de l'action.");
    } finally {
      setLoading(false);
      setConfirmation({ ...confirmation, isOpen: false });
      setActiveMenu(null);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Apply Filters
  useEffect(() => {
    let result = [...users];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((u) => u.status === statusFilter);
    }

    /* 
       Note: The original code had a mocked time range filter logic here:
       if (timeRange !== "all") { ... }
       We are keeping the list filtering as is (effectively no-op for timeRange on the list itself unless we implement it),
       but we WILL use timeRange for the Stats Trends calculation invoked below.
    */

    setFilteredUsers(result);

    // --- Stats & Trend Calculation ---
    const now = new Date();
    let daysToSubtract = 30; // default 30d

    switch (timeRange) {
      case "7d":
        daysToSubtract = 7;
        break;
      case "3m":
        daysToSubtract = 90;
        break;
      case "1y":
        daysToSubtract = 365;
        break;
      case "all":
        daysToSubtract = 365 * 10;
        break;
      case "custom":
        if (customDateRange.start && customDateRange.end) {
          const start = new Date(customDateRange.start);
          const end = new Date(customDateRange.end);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          daysToSubtract = diffDays > 0 ? diffDays : 1;
        }
        break;
    }

    // Define periods
    const currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(now.getDate() - daysToSubtract);

    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(currentPeriodStart.getDate() - daysToSubtract);

    // Helper: Parse 'joined_at' safely
    const parseDate = (d: any) => new Date(d);

    // 1. Total Users Trend
    // We compare Total Users NOW vs Total Users at 'currentPeriodStart'.
    // If we want "Growth over period", it's (CountNow - CountStart) / CountStart?
    // Or is it (CountCurrentPeriod - CountPrevPeriod) / CountPrevPeriod?
    // "Total Users" is a cumulative metric. Trend usually means "Change since start of period" or "Growth rate vs last period"?
    // Standard is: "Total count now" vs "Total count [period] ago".
    const countTotalNow = users.length;
    const countTotalPrev = users.filter(u => parseDate(u.joined_at) < currentPeriodStart).length;

    // If 0 users previously, we can't divide by 0. 
    // If we have users now but 0 before, growth is 100% (or infinite). Let's say 100% if >0 now.
    let totalGrowth = 0;
    if (countTotalPrev > 0) {
      totalGrowth = ((countTotalNow - countTotalPrev) / countTotalPrev) * 100;
    } else if (countTotalNow > 0) {
      totalGrowth = 100;
    }

    // 2. Active Users Trend (Active Status)
    const countActiveNow = users.filter(u => u.status === 'Actif').length;
    // We don't have historical status. Proxy: Use same growth rate as Total Users, 
    // OR just 0% if we want to be strict. 
    // Let's use the Total Growth rate as a proxy for ecosystem health.
    const activeGrowth = totalGrowth;

    // 3. New Users (In this period)
    // This is a non-cumulative metric (flow).
    // Compare "New Users THIS period" vs "New Users LAST period".
    const newUsersCurrentPeriod = users.filter(u => {
      const d = parseDate(u.joined_at);
      return d >= currentPeriodStart && d <= now;
    }).length;

    const newUsersPrevPeriod = users.filter(u => {
      const d = parseDate(u.joined_at);
      return d >= previousPeriodStart && d < currentPeriodStart;
    }).length;

    let newUserGrowth = 0;
    if (newUsersPrevPeriod > 0) {
      newUserGrowth = ((newUsersCurrentPeriod - newUsersPrevPeriod) / newUsersPrevPeriod) * 100;
    } else if (newUsersCurrentPeriod > 0) {
      newUserGrowth = 100;
    }

    setStats({
      total: {
        value: countTotalNow,
        trend: `${totalGrowth >= 0 ? "+" : ""}${totalGrowth.toFixed(1)}%`,
        trendUp: totalGrowth >= 0,
      },
      active: {
        value: countActiveNow,
        trend: `${activeGrowth >= 0 ? "+" : ""}${activeGrowth.toFixed(1)}%`,
        trendUp: activeGrowth >= 0,
      },
      new: {
        value: newUsersCurrentPeriod,
        trend: `${newUserGrowth >= 0 ? "+" : ""}${newUserGrowth.toFixed(1)}%`,
        trendUp: newUserGrowth >= 0,
      },
    });

  }, [users, searchQuery, timeRange, customDateRange, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Utilisateurs"
        subtitle="Gérez les comptes clients, transitaires et administrateurs"
        action={{
          label: "Ajouter un utilisateur",
          onClick: () => setIsCreateModalOpen(true),
          icon: User,
        }}
      />

      {/* Unified Filter Segment */}
      <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
        {/* Time Range Segmented Control */}
        <div className="flex bg-gray-50 rounded-xl p-1">
          {[
            { id: "7d", label: "7J" },
            { id: "30d", label: "30J" },
            { id: "3m", label: "3M" },
            { id: "1y", label: "1A" },
            { id: "all", label: "Tout" },
            { id: "custom", icon: Calendar },
          ].map((period) => (
            <button
              key={period.id}
              onClick={() => setTimeRange(period.id as any)}
              className={`
                                px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                                ${timeRange === period.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }
                            `}
              title={
                period.id === "custom" ? "Période personnalisée" : undefined
              }
            >
              {period.icon ? <period.icon className="w-4 h-4" /> : period.label}
            </button>
          ))}
        </div>

        {/* Status Filter Dropdown */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <select
            aria-label="Filtrer par statut"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2 bg-gray-50 border border-transparent hover:bg-white hover:border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer min-w-[140px]"
          >
            <option value="all">Tous les statuts</option>
            <option value="Actif">Actif</option>
            <option value="Inactif">Inactif</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Custom Date Inputs */}
        {timeRange === "custom" && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-200 bg-gray-50 p-1 rounded-xl">
            <input
              type="date"
              aria-label="Date de début"
              value={customDateRange.start}
              onChange={(e) =>
                setCustomDateRange({
                  ...customDateRange,
                  start: e.target.value,
                })
              }
              className="pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-28"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              aria-label="Date de fin"
              value={customDateRange.end}
              onChange={(e) =>
                setCustomDateRange({ ...customDateRange, end: e.target.value })
              }
              className="pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-28"
            />
          </div>
        )}

        <div className="w-px bg-gray-100 hidden sm:block mx-1 h-8"></div>

        {/* Search */}
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            aria-label="Rechercher des utilisateurs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email..."
            className="w-full pl-9 pr-8 py-2 bg-transparent hover:bg-gray-50 focus:bg-white border border-transparent focus:border-primary/20 rounded-xl text-sm focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              aria-label="Effacer la recherche"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.total.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
            >
              {stats.total.trendUp ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}{" "}
              {stats.total.trend}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">
            Utilisateurs Totaux
          </h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.total.value}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <UserCheck className="w-6 h-6" />
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.active.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
            >
              {stats.active.trendUp ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}{" "}
              {stats.active.trend}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">
            Utilisateurs Actifs
          </h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.active.value}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <UserPlus className="w-6 h-6" />
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.new.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
            >
              {stats.new.trendUp ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}{" "}
              {stats.new.trend}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">
            Nouveaux Utilisateurs
          </h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.new.value}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Téléphone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date d'inscription
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm overflow-hidden shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${user.role === "Admin"
                        ? "bg-purple-100 text-purple-800"
                        : user.role === "Transitaire"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${user.status === "Actif" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.joined_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActiveMenu(activeMenu === user.id ? null : user.id)
                      }
                      aria-label="Options utilisateur"
                      className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {activeMenu === user.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setActiveMenu(null)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 animate-in fade-in zoom-in duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                              setIsCreateModalOpen(false);
                              setActiveMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <User className="w-4 h-4" /> Voir profil
                          </button>

                          {(() => {
                            // RBAC Logic
                            const getRoleRank = (roleName: string) => {
                              const r = roleName.toLowerCase();
                              if (r === 'super admin' || r === 'super-admin') return 1;
                              if (r === 'admin' || r === 'support' || r === 'support manager') return 2;
                              if (r === 'transitaire' || r === 'forwarder') return 3;
                              return 4; // Client
                            };

                            const currentRank = getRoleRank(profile?.role || 'client');
                            // user.role in this component is formatted (Admin, Client etc), so we lower case it
                            const targetRank = getRoleRank(user.role);
                            const canManage = currentRank === 1 || (currentRank < targetRank);

                            if (!canManage) {
                              return (
                                <div className="px-4 py-2 text-sm text-gray-500 italic flex items-center gap-2 border-t border-gray-50 mt-1 pt-1">
                                  <Shield className="w-3 h-3" /> Action protégée
                                </div>
                              );
                            }

                            return (
                              <>
                                {user.role === "Client" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmation({
                                        isOpen: true,
                                        type: "upgrade",
                                        user: user,
                                        title: "Promouvoir en Transitaire",
                                        message: `Voulez-vous vraiment donner le rôle de Transitaire à ${user.name} ? Cette action lui donnera accès au tableau de bord transitaire.`,
                                        variant: "warning",
                                      });
                                      setActiveMenu(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                  >
                                    <Shield className="w-4 h-4" /> Promouvoir
                                    Transitaire
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmation({
                                      isOpen: true,
                                      type: "delete",
                                      user: user,
                                      title: "Supprimer l'utilisateur",
                                      message: `ATTENTION : Cette action est irréversible. Voulez-vous vraiment supprimer définitivement ${user.name} ?`,
                                      variant: "danger",
                                    });
                                    setActiveMenu(null);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                >
                                  <X className="w-4 h-4" /> Supprimer
                                </button>
                              </>
                            );
                          })()}

                          <div className="border-t border-gray-100 my-1"></div>

                          {profile?.role === "super-admin" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUserWallet(user);
                                setIsWalletModalOpen(true);
                                setActiveMenu(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Wallet className="w-4 h-4" /> Gérer Portefeuille
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredUsers.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="p-4 bg-gray-50 rounded-full mb-3">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p>Aucun utilisateur trouvé</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {
        isCreateModalOpen && (
          <CreateUserModal
            user={selectedUser}
            onClose={() => {
              setIsCreateModalOpen(false);
              setSelectedUser(null);
            }}
            onSuccess={() => {
              // Refresh logic would go here
              setSelectedUser(null);
            }}
          />
        )
      }

      {
        selectedUser && !isCreateModalOpen && !activeMenu && (
          <UserProfileModal
            user={selectedUser}
            onClose={() => setSelectedUser(null)}
            onEdit={() => setIsCreateModalOpen(true)}
            onToggleStatus={() =>
              handleToggleStatus(selectedUser.id, selectedUser.status)
            }
          />
        )
      }

      {
        isWalletModalOpen && selectedUserWallet && (
          <WalletManagementModal
            user={selectedUserWallet}
            onClose={() => {
              setIsWalletModalOpen(false);
              setSelectedUserWallet(null);
            }}
          />
        )
      }

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
        onConfirm={handleConfirmAction}
        title={confirmation.title}
        message={confirmation.message}
        variant={confirmation.variant as any}
        confirmLabel={
          confirmation.type === "delete" ? "Supprimer" : "Confirmer"
        }
        isLoading={loading && confirmation.isOpen} // Only show loading spinner in modal if it's the active actor
      />
    </div >
  );
}
