import { useState, useEffect, useCallback } from "react";
import { useDataSync } from "../../../contexts/DataSyncContext";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  Users,
  Settings,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Clock,
  FileText,
  Wallet,
  Tag,
  MessageSquare,
  DollarSign,
  Download,
  Building2,
} from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { shipmentService, Shipment } from "../../../services/shipmentService";
import { personnelService } from "../../../services/personnelService";
import PageHeader from "../../../components/common/PageHeader";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import DashboardControls, {
  TimeRange,
} from "../../../components/dashboard/DashboardControls";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { supabase } from "../../../lib/supabase";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0
  }).format(amount);
};

export default function ForwarderDashboard() {
  const { success } = useToast();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Self-Repair: Ensure profile exists in DB
  useEffect(() => {
    const ensureProfileExists = async () => {
      if (user && !authLoading) {
        // Check if we are running on fallback metadata (profile id might match but let's be safe)
        // We simply try to upsert the profile to ensure it exists in the 'profiles' table
        try {
          const { error } = await supabase.from("profiles").upsert(
            {
              id: user.id,
              email: user.email,
              role: "forwarder", // Ensure they are a forwarder
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" },
          );

          if (error) {
            // console.error("Self-repair failed:", error);
          }
        } catch (err) {
          console.error("Self-repair error:", err);
        }
      }
    };

    ensureProfileExists();
  }, [user, authLoading]);

  // Data State
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [shipmentStatusData, setShipmentStatusData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  // Stats State
  const [stats, setStats] = useState({
    users: { value: 0, trend: "+0%", trendUp: true, label: "Personnel actif" },
    shipments: {
      value: 0,
      trend: "+0%",
      trendUp: true,
      label: "Expéditions actives",
    },
    revenue: { value: 0, trend: "+0%", trendUp: true, label: "Revenu estimé" },
    conversion: {
      value: 0,
      trend: "0%",
      trendUp: true,
      label: "Taux de succès",
    },
  });

  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await shipmentService.getForwarderShipments();
      setShipments(data);

      // Calculate stats with Trends
      const now = new Date();
      let daysToSubtract = 30;
      switch (timeRange) {
        case "7d": daysToSubtract = 7; break;
        case "30d": daysToSubtract = 30; break;
        case "3m": daysToSubtract = 90; break;
        case "1y": daysToSubtract = 365; break;
        case "all": daysToSubtract = 365 * 2; break; // approximate
        default: daysToSubtract = 30;
      }

      const currentPeriodStart = new Date(now);
      currentPeriodStart.setDate(now.getDate() - daysToSubtract);
      const previousPeriodStart = new Date(currentPeriodStart);
      previousPeriodStart.setDate(currentPeriodStart.getDate() - daysToSubtract);

      const parseDate = (d: any) => new Date(d);

      // helper for growth
      const calculateGrowth = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      // 1. Staff Stats
      const staff = await personnelService.getForwarderStaff();
      // Assuming staff objects have created_at. If not, we fall back to 0% trend.
      // We will try to filter if created_at exists.
      const currentStaffCount = staff.length;
      const prevStaffCount = staff.filter((s: any) => s.created_at && parseDate(s.created_at) < currentPeriodStart).length;
      // If we can't determine prev count (missing created_at), we assume 0 growth or just 0.
      // But let's check if we can rely on total count if no dates.
      // If staff doesn't have dates, we'll show 0%.
      const staffGrowth = calculateGrowth(currentStaffCount, prevStaffCount);

      // 2. Shipments Stats & Trends (Active Shipments)
      const activeShipments = (data || []).filter((s: Shipment) =>
        ["pending", "approved", "in_transit", "customs_clearing"].includes(
          s.status,
        ),
      );
      // For Active Shipments Trend: Compare current active count vs previous active count?
      // Hard to know historical status. Alternatives:
      // A) Growth in "Shipments Created"
      // B) Growth in "Shipments Completed"
      // C) Logic: Active shipments created in current period vs active shipments created in prev period? No.
      // Let's use "Shipments Intake" (New Shipments) trend as a proxy for activity velocity,
      // OR mostly correctly: "Total Active Now" vs "Total Active Then". "Then" is hard.
      // Let's use "New Shipments Created" growth rate for the trend indicator on this card.
      const newShipmentsCurrent = (data || []).filter((s: Shipment) => parseDate(s.created_at) >= currentPeriodStart).length;
      const newShipmentsPrev = (data || []).filter((s: Shipment) => {
        const d = parseDate(s.created_at);
        return d >= previousPeriodStart && d < currentPeriodStart;
      }).length;
      const shipmentGrowth = calculateGrowth(newShipmentsCurrent, newShipmentsPrev);


      // 3. Revenue Stats
      // Revenue is sum of payments. Check payment dates? 
      // Shipment payment array: s.payment?.[0]?.created_at ?? s.created_at
      const getRevenueDate = (s: Shipment) => s.payment?.[0]?.created_at ? parseDate(s.payment[0].created_at) : parseDate(s.created_at);
      // If unknown payment date, use shipment creation date as fallback.

      const revenueCurrent = (data || []).reduce((acc: number, s: Shipment) => {
        const date = getRevenueDate(s);
        if (date >= currentPeriodStart) {
          return acc + (s.payment?.[0]?.amount_forwarder || s.payment?.[0]?.amount || 0);
        }
        return acc;
      }, 0);

      const revenuePrev = (data || []).reduce((acc: number, s: Shipment) => {
        const date = getRevenueDate(s);
        if (date >= previousPeriodStart && date < currentPeriodStart) {
          return acc + (s.payment?.[0]?.amount_forwarder || s.payment?.[0]?.amount || 0);
        }
        return acc;
      }, 0);

      // Note: The main card displays TOTAL Revenue (lifetime) or Period Revenue?
      // The original code was:
      /* 
       const totalRevenue = (data || []).reduce(...) -> This was LIFETIME revenue (no date filter).
       If the main card shows LIFETIME revenue, the trend should probably be "Growth vs Last Month" or just "Period Revenue"?
       Usually "Total Revenue" card shows lifetime, and trend shows "This month vs Last month".
       Let's keep showing LIFETIME Revenue in 'value', and use monthly growth for 'trend'.
      */
      const totalRevenue = (data || []).reduce(
        (acc: number, curr: Shipment) => {
          const payment = curr.payment?.[0];
          return acc + (payment?.amount_forwarder || payment?.amount || 0);
        },
        0,
      );
      const revenueGrowth = calculateGrowth(revenueCurrent, revenuePrev);


      // 4. Conversion (Completion Rate)
      const completedShipments = (data || []).filter(
        (s: Shipment) => s.status === "completed",
      );
      const totalShipmentsCount = (data || []).length;

      const rateCurrent = totalShipmentsCount > 0 ? (completedShipments.length / totalShipmentsCount) * 100 : 0;

      // Calculate prev rate
      const prevTotal = (data || []).filter(s => parseDate(s.created_at) < currentPeriodStart).length;
      const prevCompleted = (data || []).filter(s => s.status === 'completed' && parseDate(s.created_at) < currentPeriodStart).length; // Approximate, using creation date
      const ratePrev = prevTotal > 0 ? (prevCompleted / prevTotal) * 100 : 0;

      const conversionGrowth = rateCurrent - ratePrev; // Percentage point difference

      setStats({
        users: {
          value: staff.length,
          trend: `${staffGrowth >= 0 ? "+" : ""}${staffGrowth.toFixed(1)}%`,
          trendUp: staffGrowth >= 0,
          label: "Personnel actif",
        },
        shipments: {
          value: activeShipments.length,
          trend: `${shipmentGrowth >= 0 ? "+" : ""}${shipmentGrowth.toFixed(1)}%`,
          trendUp: shipmentGrowth >= 0,
          label: "Expéditions actives",
        },
        revenue: {
          value: totalRevenue,
          trend: `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth.toFixed(1)}%`,
          trendUp: revenueGrowth >= 0,
          label: "Revenu estimé",
        },
        conversion: {
          value: Math.round(rateCurrent),
          trend: `${conversionGrowth >= 0 ? "+" : ""}${conversionGrowth.toFixed(1)}%`,
          trendUp: conversionGrowth >= 0,
          label: "Taux de complétion",
        },
      });

      // Prepare Chart Data
      // Revenue (Mock distribution over time based on shipments)
      const revenueChart = (data || [])
        .slice(0, 10)
        .map((s: Shipment) => ({
          name: new Date(s.created_at || Date.now()).toLocaleDateString(),
          value:
            s.payment?.[0]?.amount_forwarder || s.payment?.[0]?.amount || 0,
        }))
        .reverse(); // Oldest first
      setRevenueData(
        revenueChart.length
          ? revenueChart
          : [
            { name: "Jan", value: 0 },
            { name: "Feb", value: 0 },
          ],
      );

      // Status Distribution
      const statusCounts: Record<string, number> = {};
      (data || []).forEach((s: Shipment) => {
        statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
      });

      const colors: Record<string, string> = {
        pending: "#F59E0B",
        approved: "#3B82F6",
        in_transit: "#10B981",
        customs_clearing: "#8B5CF6",
        completed: "#059669",
        cancelled: "#EF4444",
      };

      const statusChart = Object.entries(statusCounts).map(
        ([status, count]) => ({
          name: status,
          value: count,
          color: colors[status] || "#CBD5E1",
        }),
      );
      setShipmentStatusData(statusChart);

      // Recent Activity
      const activity = (data || []).slice(0, 5).map((s: Shipment) => ({
        id: s.id,
        type: "shipment",
        message: `Expédition ${s.tracking_number}: ${s.origin?.country} -> ${s.destination?.country}`,
        time: s.created_at
          ? new Date(s.created_at).toLocaleDateString()
          : "-",
        icon: Package,
        color: "text-blue-600",
        bg: "bg-blue-50",
        destination: s.destination?.country,
      }));
      setRecentActivity(activity);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Live Sync
  useDataSync("shipments", loadDashboardData);
  useDataSync("profiles", loadDashboardData);
  useDataSync("transactions", loadDashboardData);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, loadDashboardData]);

  const handleDownloadReport = () => {
    success("Téléchargement du rapport...");
  };

  const [hasAddresses, setHasAddresses] = useState(true); // Default true to avoid flash
  useEffect(() => {
    const checkAddresses = async () => {
      if (user) {
        const addrs = await import("../../../services/addressService").then(m => m.addressService.getAddresses(user.id));
        if (addrs.length === 0) {
          setHasAddresses(false);
        }
      }
    };
    checkAddresses();
  }, [user]);

  // Custom Modal for Enforcement
  if (!hasAddresses) {
    return (
      <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center animate-in zoom-in duration-300">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuration Requise</h2>
          <p className="text-gray-600 mb-8">
            Pour opérer sur la plateforme, vous devez impérativement configurer vos adresses (Entrepôts de dépôt et lieux de retrait).
          </p>
          <Link
            to="/dashboard/forwarder/addresses"
            className="block w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25"
          >
            Configurer mes adresses maintenant
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <PageHeader
            title="Tableau de Bord"
            subtitle="Vue d'ensemble de vos opérations et performances."
            action={{
              label: "Nouvelle Action",
              onClick: () => { },
              icon: undefined,
            }}
          >
            <button
              onClick={handleDownloadReport}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Rapport
            </button>
          </PageHeader>

          {/* DEBUG BANNER FOR SUBSCRIPTION STATUS */}
          {profile?.role === "forwarder" &&
            profile?.subscription_status !== "active" && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-center justify-between animate-in slide-in-from-top-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-orange-800">
                      Compte en mode restreint
                    </h4>
                    <p className="text-sm text-orange-700">
                      Statut détecté:{" "}
                      <strong>
                        {profile?.subscription_status || "Non défini"}
                      </strong>
                      . Normalement, vous devriez être redirigé vers la page
                      d'abonnement.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    to="/dashboard/forwarder/subscription"
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700 transition-colors"
                  >
                    Gérer mon abonnement
                  </Link>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-white text-orange-600 border border-orange-200 rounded-lg text-sm font-bold hover:bg-orange-50 transition-colors"
                  >
                    Actualiser
                  </button>
                </div>
              </div>
            )}

          <DashboardControls
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            showSearch={false}
          />

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.users.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
                >
                  {stats.users.trendUp ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {stats.users.trend}
                </span>
              </div>
              <h3 className="text-gray-500 text-sm font-medium">
                {stats.users.label}
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.users.value}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Package className="w-6 h-6" />
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.shipments.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
                >
                  {stats.shipments.trendUp ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {stats.shipments.trend}
                </span>
              </div>
              <h3 className="text-gray-500 text-sm font-medium">
                {stats.shipments.label}
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.shipments.value}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                  <DollarSign className="w-6 h-6" />
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.revenue.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
                >
                  {stats.revenue.trendUp ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {stats.revenue.trend}
                </span>
              </div>
              <h3 className="text-gray-500 text-sm font-medium">
                {stats.revenue.label}
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.revenue.value)}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                  <Activity className="w-6 h-6" />
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.conversion.trendUp ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
                >
                  {stats.conversion.trendUp ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {stats.conversion.trend}
                </span>
              </div>
              <h3 className="text-gray-500 text-sm font-medium">
                {stats.conversion.label}
              </h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {stats.conversion.value}%
              </p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Evolution */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Évolution du Revenu
                  </h3>
                  <p className="text-sm text-gray-500">
                    Revenus générés sur la période
                  </p>
                </div>
                <button
                  className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  aria-label="Plus d'options"
                >
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="h-80 w-full">
                {revenueData.length > 0 && (
                  isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={revenueData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorRevenue"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#F3F4F6"
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9CA3AF", fontSize: 12 }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#9CA3AF", fontSize: 12 }}
                          tickFormatter={(value) => `${value / 1000}k`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFF",
                            border: "none",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#10B981"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ))}
              </div>
            </div>

            {/* Shipment Status Distribution */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Statut des Expéditions
                  </h3>
                  <p className="text-sm text-gray-500">Répartition actuelle</p>
                </div>
              </div>
              <div className="h-64 w-full relative">
                {shipmentStatusData.length > 0 && (
                  isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={shipmentStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {shipmentStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ))}
                {/* Center Text */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mb-8">
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.shipments.value}
                  </p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Activité Récente
                  </h3>
                  <p className="text-sm text-gray-500">
                    Dernières mises à jour
                  </p>
                </div>
                <Link
                  to="/dashboard/forwarder/shipments"
                  className="text-sm font-medium text-primary hover:text-primary/80"
                >
                  Voir tout
                </Link>
              </div>
              <div className="space-y-6">
                {recentActivity.map((activity) => {
                  const Icon = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 group cursor-pointer hover:bg-gray-50 p-3 rounded-xl transition-colors"
                    >
                      <div
                        className={`p-2 rounded-xl ${activity.bg} ${activity.color} shrink-0`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {activity.time}
                        </p>
                      </div>
                      <div className="text-right">
                        <button
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all"
                          aria-label="Voir détail"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {recentActivity.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    Aucune activité récente
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Actions Rapides
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    icon: Package,
                    label: "Vérifier POD",
                    path: "/dashboard/forwarder/pod",
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                  },
                  {
                    icon: Building2,
                    label: "Entrepôts",
                    path: "/dashboard/forwarder/addresses",
                    color: "text-amber-600",
                    bg: "bg-amber-50",
                  },
                  {
                    icon: Users,
                    label: "Gérer Personnel",
                    path: "/dashboard/forwarder/personnel",
                    color: "text-purple-600",
                    bg: "bg-purple-50",
                  },
                  {
                    icon: Users,
                    label: "Mes Clients",
                    path: "/dashboard/forwarder/clients",
                    color: "text-indigo-600",
                    bg: "bg-indigo-50",
                  },
                  {
                    icon: Wallet,
                    label: "Paiements",
                    path: "/dashboard/forwarder/payments",
                    color: "text-green-600",
                    bg: "bg-green-50",
                  },
                  {
                    icon: Wallet,
                    label: "Appels de Fonds",
                    path: "/dashboard/forwarder/fund-calls",
                    color: "text-orange-600",
                    bg: "bg-orange-50",
                  },
                  {
                    icon: Tag,
                    label: "Gérer Offres",
                    path: "/dashboard/forwarder/coupons",
                    color: "text-pink-600",
                    bg: "bg-pink-50",
                  },
                  {
                    icon: MessageSquare,
                    label: "Support",
                    path: "/dashboard/forwarder/support",
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                  },
                  {
                    icon: Settings,
                    label: "Paramètres",
                    path: "/dashboard/forwarder/settings",
                    color: "text-gray-600",
                    bg: "bg-gray-50",
                  },
                ].map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={index}
                      to={action.path}
                      className="flex flex-col items-center justify-center p-4 rounded-xl hover:bg-gray-50 transition-all group border border-transparent hover:border-gray-100"
                    >
                      <div
                        className={`p-3 rounded-xl ${action.bg} ${action.color} mb-3 group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-medium text-gray-600 text-center group-hover:text-gray-900">
                        {action.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
