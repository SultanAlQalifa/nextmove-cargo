import { useState, useEffect, useCallback } from "react";
import { useDataSync } from "../../../contexts/DataSyncContext";
import { Link } from "react-router-dom";
import {
  Package,
  Users,
  Settings,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Clock,
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
import { ChartGuard } from "../../../components/common/ChartGuard";
import { motion, AnimatePresence } from "framer-motion";

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
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [loading, setLoading] = useState(true);


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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/50 dark:border-white/5 transition-all group overflow-hidden relative"
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors"></div>
              <div className="relative z-10 flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
                <span
                  className={`text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-sm ${stats.users.trendUp ? "text-emerald-700 bg-emerald-100/80 dark:text-emerald-400 dark:bg-emerald-500/20" : "text-rose-700 bg-rose-100/80 dark:text-rose-400 dark:bg-rose-500/20"}`}
                >
                  {stats.users.trendUp ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {stats.users.trend}
                </span>
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-black uppercase tracking-widest relative z-10">
                {stats.users.label}
              </h3>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight relative z-10">
                {stats.users.value}
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/50 dark:border-white/5 transition-all group overflow-hidden relative"
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-colors"></div>
              <div className="relative z-10 flex items-center justify-between mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                  <Package className="w-6 h-6" />
                </div>
                <span
                  className={`text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-sm ${stats.shipments.trendUp ? "text-emerald-700 bg-emerald-100/80 dark:text-emerald-400 dark:bg-emerald-500/20" : "text-rose-700 bg-rose-100/80 dark:text-rose-400 dark:bg-rose-500/20"}`}
                >
                  {stats.shipments.trendUp ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {stats.shipments.trend}
                </span>
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-black uppercase tracking-widest relative z-10">
                {stats.shipments.label}
              </h3>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight relative z-10">
                {stats.shipments.value}
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/50 dark:border-white/5 transition-all group overflow-hidden relative"
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors"></div>
              <div className="relative z-10 flex items-center justify-between mb-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                  <DollarSign className="w-6 h-6" />
                </div>
                <span
                  className={`text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-sm ${stats.revenue.trendUp ? "text-emerald-700 bg-emerald-100/80 dark:text-emerald-400 dark:bg-emerald-500/20" : "text-rose-700 bg-rose-100/80 dark:text-rose-400 dark:bg-rose-500/20"}`}
                >
                  {stats.revenue.trendUp ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {stats.revenue.trend}
                </span>
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-black uppercase tracking-widest relative z-10">
                {stats.revenue.label}
              </h3>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight relative z-10">
                {formatCurrency(stats.revenue.value)}
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/50 dark:border-white/5 transition-all group overflow-hidden relative"
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors"></div>
              <div className="relative z-10 flex items-center justify-between mb-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl shadow-inner group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <span
                  className={`text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm backdrop-blur-sm ${stats.conversion.trendUp ? "text-emerald-700 bg-emerald-100/80 dark:text-emerald-400 dark:bg-emerald-500/20" : "text-rose-700 bg-rose-100/80 dark:text-rose-400 dark:bg-rose-500/20"}`}
                >
                  {stats.conversion.trendUp ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  {stats.conversion.trend}
                </span>
              </div>
              <h3 className="text-slate-500 dark:text-slate-400 text-sm font-black uppercase tracking-widest relative z-10">
                {stats.conversion.label}
              </h3>
              <p className="text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight relative z-10">
                {stats.conversion.value}%
              </p>
            </motion.div>
          </motion.div>

          {/* Charts Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Revenue Evolution */}
            <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/50 dark:border-white/5">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    Évolution du Revenu
                  </h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                    Revenus générés sur la période
                  </p>
                </div>
                <button
                  className="p-2.5 bg-slate-100/80 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors backdrop-blur-md"
                  aria-label="Plus d'options"
                >
                  <MoreVertical className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
              </div>
              <ChartGuard height={320}>
                {revenueData.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={1}>
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
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(255,255,255,0.1)"
                        className="dark:stroke-slate-800 stroke-slate-200"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: "bold" }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9CA3AF", fontSize: 12, fontWeight: "bold" }}
                        tickFormatter={(value) => `${value / 1000}k`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.9)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: "16px",
                          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.1)",
                          fontWeight: "bold"
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#10B981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </ChartGuard>
            </div>

            {/* Shipment Status Distribution */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/50 dark:border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <PieChart className="w-32 h-32" />
              </div>
              <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    Expéditions
                  </h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Répartition Actuelle</p>
                </div>
              </div>
              <ChartGuard height={256} className="relative z-10">
                {shipmentStatusData.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={1}>
                    <PieChart>
                      <Pie
                        data={shipmentStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={6}
                        dataKey="value"
                        stroke="none"
                      >
                        {shipmentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.9)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: "16px",
                          fontWeight: "bold"
                        }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                {/* Center Text */}
                <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 translate-y-24 text-center pointer-events-none drop-shadow-md">
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {stats.shipments.value}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Total</p>
                </div>
              </ChartGuard>
            </div>
          </motion.div>

          {/* Recent Activity & Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/50 dark:border-white/5">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    Activité Récente
                  </h3>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                    Dernières mises à jour
                  </p>
                </div>
                <Link
                  to="/dashboard/forwarder/shipments"
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-black uppercase tracking-widest transition-colors shadow-inner"
                >
                  Voir tout
                </Link>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      key={activity.id}
                      className="flex items-center gap-4 group cursor-pointer hover:bg-white dark:hover:bg-slate-800 p-4 rounded-2xl transition-all shadow-sm border border-transparent hover:border-slate-200 dark:hover:border-white/10"
                    >
                      <div
                        className={`p-3.5 rounded-2xl shadow-inner ${activity.bg.replace('50', '100/80')} ${activity.color} shrink-0`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {activity.message}
                        </p>
                        <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1.5 uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5" />
                          {activity.time}
                        </p>
                      </div>
                      <div className="text-right pl-4">
                        <button
                          className="p-3 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-blue-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all shadow-sm border border-slate-200/50 dark:border-white/5"
                          aria-label="Voir détail"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
                {recentActivity.length === 0 && (
                  <div className="text-center py-12 text-slate-500 font-bold bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                    Aucune activité récente
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-indigo-900 to-black backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/10 relative overflow-hidden text-white">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0"></div>
              <h3 className="text-xl font-black mb-8 relative z-10 tracking-tight text-white shadow-sm">
                Actions Rapides
              </h3>
              <div className="grid grid-cols-2 gap-3 relative z-10">
                {[
                  {
                    icon: Package,
                    label: "Vérifier POD",
                    path: "/dashboard/forwarder/pod",
                    color: "text-blue-400",
                    bg: "bg-blue-500/20",
                  },
                  {
                    icon: Building2,
                    label: "Entrepôts",
                    path: "/dashboard/forwarder/addresses",
                    color: "text-amber-400",
                    bg: "bg-amber-500/20",
                  },
                  {
                    icon: Users,
                    label: "Gérer Personnel",
                    path: "/dashboard/forwarder/personnel",
                    color: "text-purple-400",
                    bg: "bg-purple-500/20",
                  },
                  {
                    icon: Users,
                    label: "Mes Clients",
                    path: "/dashboard/forwarder/clients",
                    color: "text-indigo-400",
                    bg: "bg-indigo-500/20",
                  },
                  {
                    icon: Wallet,
                    label: "Paiements",
                    path: "/dashboard/forwarder/payments",
                    color: "text-emerald-400",
                    bg: "bg-emerald-500/20",
                  },
                  {
                    icon: Wallet,
                    label: "Appels de Fonds",
                    path: "/dashboard/forwarder/fund-calls",
                    color: "text-orange-400",
                    bg: "bg-orange-500/20",
                  },
                  {
                    icon: Tag,
                    label: "Gérer Offres",
                    path: "/dashboard/forwarder/coupons",
                    color: "text-pink-400",
                    bg: "bg-pink-500/20",
                  },
                  {
                    icon: MessageSquare,
                    label: "Support",
                    path: "/dashboard/forwarder/support",
                    color: "text-blue-300",
                    bg: "bg-blue-400/20",
                  },
                  {
                    icon: Settings,
                    label: "Paramètres",
                    path: "/dashboard/forwarder/settings",
                    color: "text-slate-300",
                    bg: "bg-slate-400/20",
                  },
                ].map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={index}
                      to={action.path}
                      className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 hover:border-white/20 transition-all group"
                    >
                      <div
                        className={`p-3 rounded-xl ${action.bg} ${action.color} group-hover:scale-110 transition-transform shadow-inner`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-black text-slate-300 group-hover:text-white uppercase tracking-widest text-center leading-tight">
                        {action.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )
      }
    </div>
  );
}
