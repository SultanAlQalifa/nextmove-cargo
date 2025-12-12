import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import { useToast } from "../../../contexts/ToastContext";
import {
  CreditCard,
  Users,
  CheckCircle,
  Plus,
  Edit2,
  Trash2,
  Check,
  Search,
  Filter,
  Calendar,
  X,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Shield,
  Mail,
  Zap,
  Hash,
  Layers,
} from "lucide-react";
import { FEATURE_DEFINITIONS } from "../../../constants/subscriptionFeatures";
import { subscriptionService } from "../../../services/subscriptionService";
import { SubscriptionPlan, CreatePlanData } from "../../../types/subscription";
import CreatePlanModal from "../../../components/admin/CreatePlanModal";
import ConfirmationModal from "../../../components/common/ConfirmationModal";

export default function AdminSubscriptions() {
  const { success, error: toastError } = useToast();

  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | undefined>(
    undefined,
  );

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
  const [filteredSubscribers, setFilteredSubscribers] = useState<any[]>([]);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Stats State
  const [stats, setStats] = useState({
    subscribers: { value: 0, trend: "+0%", trendUp: true },
    active: { value: 0, trend: "+0%", trendUp: true },
    revenue: { value: 0, trend: "+0%", trendUp: true },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansData, subsData] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getAllSubscriptions(),
      ]);

      setPlans(plansData);

      const formattedSubs = subsData.map((s) => ({
        id: s.id,
        user:
          s.user?.full_name ||
          s.user?.company_name ||
          s.user?.email ||
          "Inconnu",
        email: s.user?.email || "",
        plan: s.plan?.name || "Inconnu",
        status: s.status.charAt(0).toUpperCase() + s.status.slice(1),
        startDate: s.start_date,
        renewalDate: s.end_date,
        price: s.plan?.price || 0,
      }));

      setSubscribers(formattedSubs);
      setFilteredSubscribers(formattedSubs);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Apply Filters and Update Stats
  useEffect(() => {
    let result = [...subscribers];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.user.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query) ||
          s.plan.toLowerCase().includes(query),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(
        (s) => s.status.toLowerCase() === statusFilter.toLowerCase(),
      );
    }

    // Time range filtering (using startDate)
    if (timeRange !== "all") {
      const now = new Date();
      let limitDate = new Date();

      if (timeRange === "7d") limitDate.setDate(now.getDate() - 7);
      else if (timeRange === "30d") limitDate.setDate(now.getDate() - 30);
      else if (timeRange === "3m") limitDate.setMonth(now.getMonth() - 3);
      else if (timeRange === "1y") limitDate.setFullYear(now.getFullYear() - 1);

      if (timeRange !== "custom") {
        result = result.filter((s) => new Date(s.startDate) >= limitDate);
      }
    }

    setFilteredSubscribers(result);

    // Update Stats
    const activeCount = result.filter(
      (s) => s.status.toLowerCase() === "active",
    ).length;
    const revenue = result.reduce((acc, curr) => acc + (curr.price || 0), 0);

    setStats({
      subscribers: {
        value: result.length,
        trend: "+0%",
        trendUp: true,
      },
      active: {
        value: activeCount,
        trend: "+0%",
        trendUp: true,
      },
      revenue: {
        value: revenue,
        trend: "+0%",
        trendUp: true,
      },
    });
  }, [searchQuery, timeRange, customDateRange, statusFilter, subscribers]);

  const handleCreatePlan = async (data: CreatePlanData) => {
    try {
      if (editingPlan) {
        await subscriptionService.updatePlan(editingPlan.id, data);
        success("Plan mis à jour avec succès");
      } else {
        await subscriptionService.createPlan(data);
        success("Plan créé avec succès");
      }
      await fetchData();
      setEditingPlan(undefined);
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving plan:", error);
      const msg = error.message || "Erreur lors de l'enregistrement du plan";
      toastError(msg);
      toastError(msg);
      throw error;
    }
  };

  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null });

  // ... (fetchData and effects)

  const handleDeletePlan = (id: string) => {
    setConfirmation({ isOpen: true, id });
  };

  const confirmDeletePlan = async () => {
    if (confirmation.id) {
      await subscriptionService.deletePlan(confirmation.id);
      await fetchData();
      success("Plan supprimé avec succès");
      setConfirmation({ isOpen: false, id: null });
    }
  };

  const openEditModal = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingPlan(undefined);
    setIsModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-XO", {
      style: "currency",
      currency: "XOF",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Abonnements"
        subtitle="Gérez les plans d'abonnement et les souscriptions utilisateurs"
        action={{
          label: "Nouveau Plan",
          onClick: openCreateModal,
          icon: Plus,
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2 bg-gray-50 border border-transparent hover:bg-white hover:border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer min-w-[140px]"
            aria-label="Filtrer par statut"
            title="Filtrer par statut"
          >
            <option value="all">Tous les statuts</option>
            <option value="Active">Actif</option>
            <option value="Expired">Expiré</option>
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
              value={customDateRange.start}
              onChange={(e) =>
                setCustomDateRange({
                  ...customDateRange,
                  start: e.target.value,
                })
              }
              className="pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-28"
              aria-label="Date de début"
              title="Date de début"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={customDateRange.end}
              onChange={(e) =>
                setCustomDateRange({ ...customDateRange, end: e.target.value })
              }
              className="pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-28"
              aria-label="Date de fin"
              title="Date de fin"
            />
          </div>
        )}

        <div className="w-px bg-gray-100 hidden sm:block mx-1 h-8"></div>

        {/* Search */}
        <div className="relative flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, plan..."
            className="w-full pl-9 pr-8 py-2 bg-transparent hover:bg-gray-50 focus:bg-white border border-transparent focus:border-primary/20 rounded-xl text-sm focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              aria-label="Effacer la recherche"
              title="Effacer la recherche"
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
              className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.subscribers.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
            >
              {stats.subscribers.trendUp ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}{" "}
              {stats.subscribers.trend}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Abonnés Totaux</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.subscribers.value}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <CheckCircle className="w-6 h-6" />
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
          <h3 className="text-gray-500 text-sm font-medium">Actifs</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {stats.active.value}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.revenue.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
            >
              {stats.revenue.trendUp ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}{" "}
              {stats.revenue.trend}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Revenu Mensuel</h3>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {formatCurrency(stats.revenue.value)}
          </p>
        </div>
      </div>

      <h3 className="text-lg font-bold text-gray-900">Plans Disponibles</h3>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            // Helper to get feature definition
            const getFeatureDef = (name: string) =>
              FEATURE_DEFINITIONS.find((d) => d.name === name);

            // Group features by category
            const featuresByCategory = plan.features.reduce(
              (acc, feature) => {
                const def = getFeatureDef(feature.name);
                const category = def?.category || "other";
                if (!acc[category]) acc[category] = [];
                acc[category].push(feature);
                return acc;
              },
              {} as Record<string, typeof plan.features>,
            );

            const categories = [
              {
                id: "core",
                label: "Fonctionnalités Clés",
                icon: Zap,
                color: "text-purple-600 bg-purple-50",
              },
              {
                id: "usage",
                label: "Limites & Usage",
                icon: Hash,
                color: "text-blue-600 bg-blue-50",
              },
              {
                id: "support",
                label: "Support & Service",
                icon: Shield,
                color: "text-green-600 bg-green-50",
              },
              {
                id: "integration",
                label: "Intégrations",
                icon: Layers,
                color: "text-orange-600 bg-orange-50",
              },
              {
                id: "other",
                label: "Autres",
                icon: CheckCircle,
                color: "text-gray-600 bg-gray-50",
              },
            ];

            return (
              <div
                key={plan.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow relative group"
              >
                {plan.is_active && (
                  <div className="absolute top-0 right-0 p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Actif
                    </span>
                  </div>
                )}

                <div className="p-6 flex-1">
                  <div className="mb-6">
                    <h4 className="text-xl font-bold text-gray-900">
                      {plan.name}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1 min-h-[40px]">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-8 pb-6 border-b border-gray-100">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        {new Intl.NumberFormat("fr-XO", {
                          style: "currency",
                          currency: plan.currency,
                          maximumFractionDigits: 0,
                        }).format(plan.price)}
                      </span>
                      <span className="text-gray-500 ml-2 font-medium">
                        /
                        {plan.billing_cycle === "monthly"
                          ? "mois"
                          : plan.billing_cycle === "quarterly"
                            ? "trimestre"
                            : plan.billing_cycle === "biannual"
                              ? "semestre"
                              : "an"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {categories.map((cat) => {
                      const catFeatures = featuresByCategory[cat.id];
                      if (!catFeatures || catFeatures.length === 0) return null;

                      return (
                        <div key={cat.id}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`p-1.5 rounded-lg ${cat.color}`}>
                              <cat.icon className="w-3.5 h-3.5" />
                            </div>
                            <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                              {cat.label}
                            </h5>
                          </div>
                          <div className="space-y-3">
                            {catFeatures.map((feature, index) => (
                              <div
                                key={`${feature.id}-${index}`}
                                className="flex items-start gap-3 group/item"
                              >
                                <div
                                  className={`mt-0.5 ${feature.type === "limit" ? "text-blue-600" : "text-green-500"}`}
                                >
                                  {feature.type === "limit" ? (
                                    <Hash className="w-4 h-4" />
                                  ) : (
                                    <Check className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <span className="text-sm text-gray-700 font-medium block">
                                    {feature.name}
                                  </span>
                                  {feature.type === "limit" && (
                                    <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                                      Limite: {feature.value}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openEditModal(plan)}
                    className="flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm"
                  >
                    <Edit2 className="w-4 h-4" /> Modifier
                  </button>
                  <button
                    onClick={() => {
                      setSearchQuery(plan.name);
                      const element =
                        document.getElementById("subscribers-list");
                      element?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex items-center justify-center gap-2 py-2 px-4 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-sm"
                  >
                    <Users className="w-4 h-4" /> Abonnés
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={openCreateModal}
            className="min-h-[400px] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all group"
          >
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-white transition-colors">
              <Plus className="w-8 h-8" />
            </div>
            <span className="font-medium">Créer un nouveau plan</span>
          </button>
        </div>
      )}

      {/* Subscribers List */}
      <div
        id="subscribers-list"
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8"
      >
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">Liste des Abonnés</h3>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Plan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Début
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Renouvellement
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSubscribers.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm">
                      {sub.user.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {sub.user}
                      </div>
                      <div className="text-sm text-gray-500">{sub.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${sub.plan === "Enterprise"
                        ? "bg-purple-100 text-purple-800"
                        : sub.plan === "Pro"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {sub.plan}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${sub.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {sub.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(sub.startDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(sub.renewalDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="relative">
                    <button
                      onClick={() =>
                        setActiveMenu(activeMenu === sub.id ? null : sub.id)
                      }
                      className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                      aria-label="Options"
                      title="Options"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {activeMenu === sub.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setActiveMenu(null)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 animate-in fade-in zoom-in duration-200">
                          <button
                            onClick={() => {
                              success(`Voir détails de ${sub.user}`);
                              setActiveMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Shield className="w-4 h-4" /> Voir détails
                          </button>
                          <button
                            onClick={() => {
                              success(`Contacter ${sub.email}`);
                              setActiveMenu(null);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Mail className="w-4 h-4" /> Contacter
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredSubscribers.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="p-4 bg-gray-50 rounded-full mb-3">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <p>Aucun abonné trouvé</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CreatePlanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreatePlan}
        initialData={editingPlan}
        isEditing={!!editingPlan}
      />

      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={() => setConfirmation({ isOpen: false, id: null })}
        onConfirm={confirmDeletePlan}
        title="Supprimer le plan"
        message="Êtes-vous sûr de vouloir supprimer ce plan d'abonnement ? Cette action ne peut pas être annulée."
        variant="danger"
        confirmLabel="Supprimer"
      />
    </div>
  );
}
