import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { Link } from "react-router-dom";
import { useCurrency } from "../../../contexts/CurrencyContext";
import { formatCurrency } from "../../../utils/currencyFormatter";
import { supabase } from "../../../lib/supabase";
import PageHeader from "../../../components/common/PageHeader";
import DashboardControls, {
  TimeRange,
} from "../../../components/dashboard/DashboardControls";
import {
  Users,
  DollarSign,
  Activity,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  MapPin,
  Download,
} from "lucide-react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function AdminDashboard() {
  const { profile } = useAuth();
  const { currency } = useCurrency();

  // Filter State
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [customDateRange, setCustomDateRange] = useState({
    start: "",
    end: "",
  });
  const [destination, setDestination] = useState("");

  // Data State
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [shipmentStatusData, setShipmentStatusData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

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
  });

  useEffect(() => {
    // Delay mounting to ensure DOM is ready for Recharts
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    loadDashboardData();
    return () => clearTimeout(timer);
  }, [timeRange, customDateRange]); // Reload when time range changes

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Global Stats
      const { data: statsData, error: statsError } = await supabase.rpc(
        "get_dashboard_stats",
      );

      if (statsData) {
        setStats({
          users: {
            value: statsData.total_users || 0,
            trend: `${statsData.user_growth >= 0 ? "+" : ""}${statsData.user_growth}%`,
            trendUp: statsData.user_growth >= 0,
            label: "Utilisateurs totaux",
          },
          shipments: {
            value: statsData.active_shipments || 0,
            trend: `${statsData.shipment_growth >= 0 ? "+" : ""}${statsData.shipment_growth}%`,
            trendUp: statsData.shipment_growth >= 0,
            label: "Expéditions actives",
          },
          revenue: {
            value: statsData.total_revenue || 0,
            trend: `${statsData.revenue_growth >= 0 ? "+" : ""}${statsData.revenue_growth}%`,
            trendUp: statsData.revenue_growth >= 0,
            label: "Revenu total",
          },
          conversion: {
            value: statsData.conversion_rate || 0,
            trend: "0%", // Conversion trend requires more complex history, keeping 0 for now or could implement later
            trendUp: true,
            label: "Offres acceptées / RFQ",
          },
        });
      }

      // 2. Fetch Revenue Chart
      const { data: revData, error: revError } = await supabase.rpc(
        "get_revenue_chart",
        { time_range: timeRange },
      );
      if (revData) {
        // Map to chart format
        const formattedRev = revData.map((d: any) => ({
          name: d.date,
          value: d.amount,
        }));
        setRevenueData(formattedRev);
      }

      // 3. Fetch Shipment Stats
      const { data: shipData, error: shipError } =
        await supabase.rpc("get_shipment_stats");
      if (shipData) {
        const colors: Record<string, string> = {
          draft: "#9CA3AF",
          published: "#F59E0B",
          quoted: "#3B82F6",
          booked: "#8B5CF6",
          in_transit: "#10B981",
          delivered: "#059669",
          cancelled: "#EF4444",
        };

        const formattedShip = shipData.map((d: any) => ({
          name: d.status,
          value: Number(d.count),
          color: colors[d.status] || "#CBD5E1",
        }));
        setShipmentStatusData(formattedShip);
      }

      // 4. Fetch Recent Activity
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
  };

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

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tableau de Bord Admin"
        subtitle="Vue d'ensemble des performances et de l'activité."
        action={{
          label: "Nouvelle Action",
          onClick: () => { }, // Handled by dropdown in original, simplifying for now or keeping custom
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

      <DashboardControls
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        customDateRange={customDateRange}
        setCustomDateRange={setCustomDateRange}
        searchQuery={destination}
        setSearchQuery={setDestination}
        searchPlaceholder="Filtrer par destination..."
      />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link to="/dashboard/admin/personnel" className="block group">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group-hover:border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-100 transition-colors">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 text-indigo-600 bg-indigo-50">
                    <ArrowUpRight className="w-3 h-3" /> Gérer
                  </span>
                </div>
                <h3 className="text-gray-500 text-sm font-medium">
                  Personnel & Rôles
                </h3>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.users.value > 0
                    ? Math.ceil(stats.users.value * 0.1)
                    : 0}
                </p>
                <p className="text-xs text-gray-400 mt-2">Membres actifs</p>
              </div>
            </Link>

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
                  )}{" "}
                  {stats.users.trend}
                </span>
              </div>
              <h3 className="text-gray-500 text-sm font-medium">
                Utilisateurs Totaux
              </h3>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.users.value.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-2">{stats.users.label}</p>
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
                  )}{" "}
                  {stats.revenue.trend}
                </span>
              </div>
              <h3 className="text-gray-500 text-sm font-medium">
                Revenu Mensuel
              </h3>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {formatCurrency(stats.revenue.value, currency)}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {stats.revenue.label}
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
                  )}{" "}
                  {stats.conversion.trend}
                </span>
              </div>
              <h3 className="text-gray-500 text-sm font-medium">
                Taux de Conversion
              </h3>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {stats.conversion.value}%
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {stats.conversion.label}
              </p>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Revenue Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-w-0">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Évolution du Revenu
                  </h3>
                  <p className="text-sm text-gray-500">
                    Aperçu des 12 derniers mois
                  </p>
                </div>
                <select
                  className="bg-gray-50 border-none text-sm font-medium text-gray-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20"
                  aria-label="Sélectionner la période"
                >
                  <option>Cette année</option>
                  <option>L'année dernière</option>
                </select>
              </div>
              <div className="w-full">
                {isMounted && (
                  <div className="w-full h-[320px]">
                    <ResponsiveContainer width="100%" height={320} minWidth={0}>
                      <AreaChart
                        data={revenueData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorRevenue"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#0052cc"
                              stopOpacity={0.1}
                            />
                            <stop
                              offset="95%"
                              stopColor="#0052cc"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#E5E7EB"
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#6B7280", fontSize: 12 }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#6B7280", fontSize: 12 }}
                          tickFormatter={(value) =>
                            formatCurrency(value, currency)
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                          formatter={(value: number) => [
                            formatCurrency(value, currency),
                            "Revenu",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#0052cc"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Shipment Status Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-w-0">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    État des Expéditions
                  </h3>
                  <p className="text-sm text-gray-500">
                    Répartition par statut actuel
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    {shipmentStatusData.reduce(
                      (acc, curr) => acc + curr.value,
                      0,
                    )}
                  </p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
              </div>
              <div className="w-full">
                {isMounted && (
                  <div className="w-full h-[320px]">
                    <ResponsiveContainer width="100%" height={320} minWidth={0}>
                      <BarChart
                        layout="vertical"
                        data={shipmentStatusData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                          stroke="#E5E7EB"
                        />
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          axisLine={false}
                          tickLine={false}
                          width={100}
                          tick={{ fill: "#6B7280", fontSize: 12 }}
                          tickFormatter={(value) => {
                            const translations: Record<string, string> = {
                              draft: "Brouillon",
                              published: "Publié",
                              quoted: "Devis Reçu",
                              booked: "Réservé",
                              in_transit: "En Transit",
                              delivered: "Livré",
                              cancelled: "Annulé",
                              pending: "En Attente",
                            };
                            return translations[value] || value;
                          }}
                        />
                        <Tooltip
                          cursor={{ fill: "transparent" }}
                          contentStyle={{
                            borderRadius: "8px",
                            border: "none",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                          {shipmentStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Section: Recent Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  Activité Récente
                </h3>
              </div>
              <div className="space-y-6">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start gap-4">
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
                            <Clock className="w-3 h-3" /> {activity.time}
                            {activity.destination && (
                              <>
                                <span className="mx-1">•</span>
                                <MapPin className="w-3 h-3" />{" "}
                                {activity.destination}
                              </>
                            )}
                          </p>
                        </div>
                        <button
                          className="text-gray-400 hover:text-gray-600"
                          aria-label="Voir le détail de l'activité"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Aucune activité récente.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-900 mb-6">
                Actions Rapides
              </h3>
              <div className="space-y-3">
                <Link
                  to="/dashboard/admin/forwarders"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary/20 hover:bg-primary/5 transition-all group"
                >
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-white group-hover:text-primary transition-colors">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary">
                    Vérifier Transitaires
                  </span>
                </Link>

                <Link
                  to="/dashboard/admin/rfq"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary/20 hover:bg-primary/5 transition-all group"
                >
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-white group-hover:text-primary transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary">
                    Gérer RFQ
                  </span>
                </Link>

                <Link
                  to="/dashboard/admin/payments"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary/20 hover:bg-primary/5 transition-all group"
                >
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg group-hover:bg-white group-hover:text-primary transition-colors">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary">
                    Suivi Paiements
                  </span>
                </Link>

                <Link
                  to="/dashboard/admin/settings"
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-primary/20 hover:bg-primary/5 transition-all group"
                >
                  <div className="p-2 bg-gray-50 text-gray-600 rounded-lg group-hover:bg-white group-hover:text-primary transition-colors">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary">
                    Paramètres Système
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
