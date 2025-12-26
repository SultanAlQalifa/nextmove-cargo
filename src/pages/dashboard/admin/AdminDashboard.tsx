import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useDataSync } from "../../../contexts/DataSyncContext";
import { Link } from "react-router-dom";
import { useCurrency } from "../../../contexts/CurrencyContext";
import { formatCurrency } from "../../../utils/currencyFormatter";
import { supabase } from "../../../lib/supabase";
import DashboardControls, { TimeRange } from "../../../components/dashboard/DashboardControls";
import {
  Users,
  Package,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  ShieldCheck,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

export const AdminDashboard = () => {
  const { user, profile } = useAuth();
  const { currency } = useCurrency();

  // Controls State
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [customDateRange, setCustomDateRange] = useState<{
    start: string;
    end: string;
  }>({ start: "", end: "" });

  // Data State
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [shipmentStatusData, setShipmentStatusData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stats State
  const [stats, setStats] = useState({
    users: {
      value: 0,
      trend: "+0%",
      trendUp: true,
      label: "Utilisateurs totaux",
    },
    shipments: {
      value: 0,
      trend: "+0%",
      trendUp: true,
      label: "Expéditions actives",
    },
    revenue: { value: 0, trend: "+0%", trendUp: true, label: "Revenu total" },
    conversion: {
      value: 0,
      trend: "0%",
      trendUp: true,
      label: "Taux de conversion",
    },
    kycPending: {
      value: 0,
      label: "KYC en attente",
    },
  });

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch Raw Data for Frontend Calculation
      // 1. Users (Fix: status -> account_status)
      const { data: users, error: usersError } = await supabase.from('profiles').select('created_at, account_status');
      if (usersError) console.error("Error fetching users:", usersError);

      // 2. Shipments
      const { data: shipments, error: shipmentsError } = await supabase.from('shipments').select('created_at, status');
      if (shipmentsError) console.error("Error fetching shipments:", shipmentsError);

      // 3. Revenue (Payments -> Transactions)
      const { data: payments, error: paymentsError } = await supabase.from('transactions').select('amount, created_at, status').eq('status', 'completed');
      if (paymentsError) console.error("Error fetching transactions:", paymentsError);

      // 4. RFQs
      const { data: rfqs, error: rfqsError } = await supabase.from('rfq_requests').select('created_at, status');
      if (rfqsError) console.error("Error fetching rfqs:", rfqsError);

      // 5. Pending KYC
      const { count: kycCount, error: kycError } = await supabase
        .from('kyc_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (kycError) console.error("Error fetching kyc count:", kycError);

      // --- Calculation Logic ---
      const now = new Date();
      let daysToSubtract = 30;
      switch (timeRange) {
        case "7d": daysToSubtract = 7; break;
        case "30d": daysToSubtract = 30; break;
        case "3m": daysToSubtract = 90; break;
        case "1y": daysToSubtract = 365; break;
        case "all": daysToSubtract = 365 * 5; break;
        case "custom":
          if (customDateRange.start && customDateRange.end) {
            const start = new Date(customDateRange.start);
            const end = new Date(customDateRange.end);
            daysToSubtract = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 3600 * 24)) || 1;
          }
          break;
      }

      const currentPeriodStart = new Date(now);
      currentPeriodStart.setDate(now.getDate() - daysToSubtract);
      const previousPeriodStart = new Date(currentPeriodStart);
      previousPeriodStart.setDate(currentPeriodStart.getDate() - daysToSubtract);

      const parseDate = (d: string) => new Date(d);
      const calculateGrowth = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return ((curr - prev) / prev) * 100;
      };

      // Users Stats
      const usersList = users || [];
      const usersCurrent = usersList.length;
      const usersPrev = usersList.filter(u => parseDate(u.created_at) < currentPeriodStart).length;
      const userGrowth = calculateGrowth(usersCurrent, usersPrev);

      // Active Shipments Stats
      const shipmentsList = shipments || [];
      const activeShipmentsCount = shipmentsList.filter(s => ['pending', 'approved', 'in_transit', 'customs_clearing'].includes(s.status?.toLowerCase())).length;

      const newShipmentsCurrentWindow = shipmentsList.filter(s => parseDate(s.created_at) >= currentPeriodStart).length;
      const newShipmentsPrevWindow = shipmentsList.filter(s => {
        const d = parseDate(s.created_at);
        return d >= previousPeriodStart && d < currentPeriodStart;
      }).length;
      const shipmentGrowth = calculateGrowth(newShipmentsCurrentWindow, newShipmentsPrevWindow);


      // Revenue Stats
      const paymentsList = payments || [];
      const totalRevenue = paymentsList.reduce((sum, p) => sum + (p.amount || 0), 0);

      const revenueCurrentWindow = paymentsList
        .filter(p => parseDate(p.created_at) >= currentPeriodStart)
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const revenuePrevWindow = paymentsList
        .filter(p => {
          const d = parseDate(p.created_at);
          return d >= previousPeriodStart && d < currentPeriodStart;
        })
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const revenueGrowth = calculateGrowth(revenueCurrentWindow, revenuePrevWindow);


      // Conversion Stats (Accepted RFQs / Total RFQs)
      const rfqsList = rfqs || [];
      const isConverted = (status: string) => ['booked', 'completed'].includes(status?.toLowerCase());

      const rfqsCurrentWindow = rfqsList.filter(r => parseDate(r.created_at) >= currentPeriodStart);
      const rfqsPrevWindow = rfqsList.filter(r => {
        const d = parseDate(r.created_at);
        return d >= previousPeriodStart && d < currentPeriodStart;
      });

      const conversionRateCurrent = rfqsCurrentWindow.length > 0
        ? (rfqsCurrentWindow.filter(r => isConverted(r.status)).length / rfqsCurrentWindow.length) * 100
        : 0;

      const conversionRatePrev = rfqsPrevWindow.length > 0
        ? (rfqsPrevWindow.filter(r => isConverted(r.status)).length / rfqsPrevWindow.length) * 100
        : 0;

      const conversionGrowth = conversionRateCurrent - conversionRatePrev;

      // Update Stats State
      setStats({
        users: {
          value: usersCurrent,
          trend: `${userGrowth >= 0 ? "+" : ""}${userGrowth.toFixed(1)}%`,
          trendUp: userGrowth >= 0,
          label: "Utilisateurs totaux",
        },
        shipments: {
          value: activeShipmentsCount,
          trend: `${shipmentGrowth >= 0 ? "+" : ""}${shipmentGrowth.toFixed(1)}%`,
          trendUp: shipmentGrowth >= 0,
          label: "Expéditions actives",
        },
        revenue: {
          value: totalRevenue,
          trend: `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth.toFixed(1)}%`,
          trendUp: revenueGrowth >= 0,
          label: "Revenu total",
        },
        conversion: {
          value: Math.round(conversionRateCurrent),
          trend: `${conversionGrowth >= 0 ? "+" : ""}${conversionGrowth.toFixed(1)}%`,
          trendUp: conversionGrowth >= 0,
          label: "Offres acceptées / RFQ",
        },
        kycPending: {
          value: kycCount || 0,
          label: "KYC en attente",
        },
      });

      // Update Revenue Chart
      const chartMap = new Map<string, number>();
      paymentsList.forEach(p => {
        const d = new Date(p.created_at);
        let key = d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        if (timeRange === '7d' || timeRange === '30d') {
          key = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        }
        chartMap.set(key, (chartMap.get(key) || 0) + (p.amount || 0));
      });
      const formattedRev = Array.from(chartMap.entries()).map(([name, value]) => ({ name, value }));
      setRevenueData(formattedRev);

      // Shipment Stats (Distribution)
      const statusCounts: Record<string, number> = {};
      shipmentsList.forEach(s => {
        statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
      });
      const colors: Record<string, string> = {
        draft: "#9CA3AF",
        published: "#F59E0B",
        quoted: "#3B82F6",
        booked: "#8B5CF6", // purple
        in_transit: "#10B981", // green
        delivered: "#059669",
        cancelled: "#EF4444",
        pending: '#F59E0B'
      };
      const formattedShip = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count,
        color: colors[status] || "#CBD5E1",
      }));
      setShipmentStatusData(formattedShip);

      // Recent Activity
      const { data: latestRfqs } = await supabase
        .from("rfq_requests")
        .select("id, origin_port, destination_port, created_at, status")
        .order("created_at", { ascending: false })
        .limit(5);

      if (latestRfqs) {
        const activities = latestRfqs.map((rfq: any) => ({
          id: rfq.id,
          type: "rfq",
          message: `Nouvelle demande: ${rfq.origin_port} -> ${rfq.destination_port}`,
          time: new Date(rfq.created_at).toLocaleDateString(),
          icon: Package,
          color: "text-blue-600",
          bg: "bg-blue-50",
          destination: rfq.destination_port,
        }));
        setRecentActivity(activities);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, customDateRange]);

  // Live Synch
  useDataSync("profiles", loadDashboardData);
  useDataSync("shipments", loadDashboardData);
  useDataSync("transactions" as any, loadDashboardData);
  useDataSync("rfq_requests", loadDashboardData);

  useEffect(() => {
    // Delay mounting to ensure DOM is ready for Recharts
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [timeRange, customDateRange, loadDashboardData]); // Reload when time range changes

  const handleDownloadReport = () => {
    // Prepare data for CSV
    const headers = ["Mois", "Revenu"];
    const rows = revenueData.map((item) => [item.name, item.value]);

    // Add stats summary
    rows.push([]);
    rows.push(["Résumé", ""]);
    rows.push(["Utilisateurs", stats.users.value]);
    rows.push(["Expéditions", stats.shipments.value]);
    rows.push(["Revenu Total", stats.revenue.value]);
    rows.push(["Taux de Conversion", `${stats.conversion.value}%`]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `rapport_activite_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Admin</h1>
          <p className="text-sm text-gray-500">Bienvenue, {profile?.full_name || user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadReport}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Download size={20} />
            <span>Télécharger le rapport</span>
          </button>
        </div>
      </div>

      <DashboardControls
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        customDateRange={customDateRange}
        setCustomDateRange={setCustomDateRange}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Utilisateurs totaux",
            value: stats.users.value,
            trend: stats.users.trend,
            icon: Users,
            color: "blue",
            trendUp: stats.users.trendUp,
          },
          {
            title: "Expéditions actives",
            value: stats.shipments.value,
            trend: stats.shipments.trend,
            icon: Package,
            color: "purple",
            trendUp: stats.shipments.trendUp,
          },
          {
            title: "Revenu total",
            value: formatCurrency(stats.revenue.value, currency),
            trend: stats.revenue.trend,
            icon: DollarSign,
            color: "green",
            trendUp: stats.revenue.trendUp,
          },
          {
            title: "Taux de conversion",
            value: `${stats.conversion.value}%`,
            trend: stats.conversion.trend,
            icon: TrendingUp,
            color: "orange",
            trendUp: stats.conversion.trendUp,
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 bg-${stat.color}-50 rounded-lg`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <div
                className={`flex items-center space-x-1 text-sm ${stat.trendUp ? "text-green-600" : "text-red-600"
                  }`}
              >
                {stat.trendUp ? (
                  <ArrowUpRight size={16} />
                ) : (
                  <ArrowDownRight size={16} />
                )}
                <span>{stat.trend}</span>
              </div>
            </div>
            <h3 className="text-gray-500 text-sm font-medium">{stat.title}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {stat.value}
            </p>
          </div>
        ))}

        {/* KYC Stat Card */}
        <Link
          to="/dashboard/admin/kyc"
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-500 transition-all group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
              <ShieldCheck className="w-6 h-6 text-red-600" />
            </div>
            {stats.kycPending.value > 0 && (
              <div className="flex items-center space-x-1 text-xs font-bold text-red-600 animate-pulse">
                Action requise
              </div>
            )}
          </div>
          <h3 className="text-gray-500 text-sm font-medium">{stats.kycPending.label}</h3>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {stats.kycPending.value}
          </p>
        </Link>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">
              Évolution du Revenu
            </h3>
            <button
              className="p-2 hover:bg-gray-50 rounded-lg transition"
              title="Voir détails revenus"
              aria-label="Voir le détail du revenu"
            >
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </button>
          </div>
          <div className="w-full relative h-[320px]">
            {isMounted && (
              <ResponsiveContainer width="100%" height={320} debounce={50}>
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
            )}
          </div>
        </div>

        {/* Shipment Status Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            État des Expéditions
          </h3>
          <div className="w-full relative h-[320px]">
            {isMounted && (
              <ResponsiveContainer width="100%" height={320} debounce={50}>
                <PieChart>
                  <Pie
                    data={shipmentStatusData}
                    innerRadius={60}
                    outerRadius={100}
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
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">Activité Récente</h3>
          <Link
            to="/admin/activity"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Voir tout
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="p-4 hover:bg-gray-50 transition flex items-center justify-between"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-full ${activity.bg}`}>
                  <activity.icon className={`w-5 h-5 ${activity.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activity.message}
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                  {activity.destination}
                </span>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  title="Voir les détails"
                  aria-label="Voir les détails de l'activité"
                >
                  <ArrowUpRight size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
