import { useState, useEffect, useCallback } from "react";
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
  Download,
  ShieldCheck,
  Heart,
  Activity,
  ArrowRight
} from "lucide-react";
import { AdminWorldMap } from "../../../components/dashboard/admin/AdminWorldMap";
import { AdminAlerts } from "../../../components/dashboard/admin/AdminAlerts";
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
  Legend
} from "recharts";
import { motion } from "framer-motion";

export const AdminDashboard = () => {
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
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [supportDonors, setSupportDonors] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stats State
  const [stats, setStats] = useState({
    users: { value: 0, trend: "+12%", trendUp: true },
    shipments: { value: 0, trend: "+5%", trendUp: true },
    revenue: { value: 0, trend: "+18%", trendUp: true },
    conversion: { value: 0, trend: "+2%", trendUp: true },
    kycPending: { value: 0 },
    activeShipments: { value: 0 },
    supportTotal: { value: 0, target: 10000000 }
  });

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Users
      const { data: users } = await supabase.from('profiles').select('created_at');

      // 2. Shipments
      const { data: shipments } = await supabase.from('shipments').select('created_at, status');

      // 3. Transactions
      const { data: payments } = await supabase.from('transactions').select('amount, created_at, status').eq('status', 'completed');

      // 4. RFQs
      const { data: rfqs } = await supabase.from('rfq_requests').select('created_at, status');

      // 5. Pending KYC
      const { count: kycCount } = await supabase
        .from('kyc_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // 6. Support Donors & Impact
      const { data: donors } = await supabase
        .from('sales_leads')
        .select('*, profiles:user_id(full_name)')
        .eq('metadata->>source', 'support_campaign')
        .order('created_at', { ascending: false });

      const uCount = users?.length || 0;
      const sCount = shipments?.filter(s => s.status !== 'delivered' && s.status !== 'cancelled').length || 0;
      const revTotal = payments?.reduce((a: number, b: any) => a + b.amount, 0) || 0;
      const convRate = rfqs?.length ? Math.round((rfqs.filter((r: any) => ['booked', 'completed'].includes(r.status)).length / rfqs.length) * 100) : 0;
      const supportTotalVal = (donors || []).reduce((acc: number, curr: any) => acc + (Number(curr.metadata?.amount) || 0), 0);

      setStats({
        users: { value: uCount, trend: "+12%", trendUp: true },
        shipments: { value: sCount, trend: "+5%", trendUp: true },
        revenue: { value: revTotal, trend: "+18%", trendUp: true },
        conversion: { value: convRate, trend: "+2%", trendUp: true },
        kycPending: { value: kycCount || 0 },
        activeShipments: { value: sCount },
        supportTotal: { value: supportTotalVal, target: 10000000 }
      });

      setSupportDonors((donors || []).slice(0, 5));

      // 8. Recent Activities (Mixed feed)
      const feed = [
        ...(donors || []).slice(0, 5).map(d => ({ type: 'support', title: 'Nouveau Don', user: d.profiles?.full_name || 'Anonyme', date: d.created_at, amount: d.metadata?.amount })),
        ...(rfqs || []).slice(0, 5).map(r => ({ type: 'rfq', title: 'Nouvelle Demande', date: r.created_at, status: r.status }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setRecentActivities(feed.slice(0, 8));

      // Revenue Chart Data
      const chartMap = new Map();
      payments?.forEach(p => {
        const d = new Date(p.created_at).toLocaleDateString('fr-FR', { month: 'short' });
        chartMap.set(d, (chartMap.get(d) || 0) + p.amount);
      });
      setRevenueData(Array.from(chartMap.entries()).map(([name, value]) => ({ name, value })));

      // Status Chart Data (Pie)
      const statusCounts: Record<string, number> = {
        'draft': 0, 'pending': 0, 'picked_up': 0, 'in_transit': 0, 'arrived': 0, 'delivered': 0
      };
      shipments?.forEach(s => {
        if (statusCounts[s.status] !== undefined) statusCounts[s.status]++;
      });

      const COLORS_MAP: Record<string, string> = {
        'draft': '#94A3B8',
        'pending': '#FBBF24',
        'picked_up': '#6366F1',
        'in_transit': '#8B5CF6',
        'arrived': '#10B981',
        'delivered': '#059669'
      };

      setShipmentStatusData(Object.entries(statusCounts).map(([name, value]) => ({
        name: name === 'picked_up' ? 'Collecté' : name === 'in_transit' ? 'En transit' : name === 'arrived' ? 'Arrivé' : name,
        value,
        color: COLORS_MAP[name]
      })).filter((item: any) => item.value > 0));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadDashboardData();
    setIsMounted(true);
  }, [loadDashboardData]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Premium Glass Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2.5rem] shadow-xl">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <Activity className="w-8 h-8 text-primary" />
            Centre de Commandement
          </h1>
          <p className="text-slate-500 font-medium">Analyse et pilotage stratégique NextMove</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all outline-none">
            <Download className="w-5 h-5" />
            Rapport 2026
          </button>
        </div>
      </div>

      {/* Critical Alerts Center */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.kycPending.value > 0 && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-rose-600 uppercase">Attention KYC</p>
                <p className="text-sm font-bold text-rose-900">{stats.kycPending.value} dossiers en attente</p>
              </div>
            </div>
            <Link to="/dashboard/admin/kyc" className="p-2 hover:bg-rose-100 rounded-lg transition-colors">
              <ArrowRight className="w-4 h-4 text-rose-600" />
            </Link>
          </div>
        )}

        {stats.supportTotal.value > 0 && (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-emerald-600 uppercase">Campagne Soutien</p>
                <p className="text-sm font-bold text-emerald-900">{stats.supportTotal.value.toLocaleString()} XOF collectés</p>
              </div>
            </div>
            <Link to="/dashboard/admin/leads" className="p-2 hover:bg-emerald-100 rounded-lg transition-colors">
              <ArrowRight className="w-4 h-4 text-emerald-600" />
            </Link>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-blue-600 uppercase">Activités Colis</p>
              <p className="text-sm font-bold text-blue-900">{stats.shipments.value} flux actifs</p>
            </div>
          </div>
          <button className="p-2 hover:bg-blue-100 rounded-lg transition-colors" title="Détails">
            <ArrowRight className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </div>

      <AdminAlerts />

      <DashboardControls
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        customDateRange={customDateRange}
        setCustomDateRange={setCustomDateRange}
      />

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Utilisateurs", value: stats.users.value, trend: stats.users.trend, icon: Users, color: "from-blue-500 to-indigo-600" },
          { label: "Expéditions", value: stats.shipments.value, trend: stats.shipments.trend, icon: Package, color: "from-purple-500 to-pink-600" },
          { label: "Revenue", value: formatCurrency(stats.revenue.value, currency), trend: stats.revenue.trend, icon: DollarSign, color: "from-emerald-500 to-teal-600" },
          { label: "Conversion", value: `${stats.conversion.value}%`, trend: stats.conversion.trend, icon: TrendingUp, color: "from-orange-500 to-red-600" },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl transition-all duration-500"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity rounded-full`} />
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20`}>
              <stat.icon className="w-7 h-7 text-white" />
            </div>
            <p className="text-slate-500 font-black text-xs uppercase tracking-widest mb-1">{stat.label}</p>
            <div className="flex items-baseline gap-3">
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
              <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">{stat.trend}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800 dark:text-white">Performances Financières</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs font-bold text-slate-500 uppercase">Revenu Brut</span>
            </div>
          </div>
          <div className="h-[350px] min-h-[350px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" debounce={1} minWidth={0}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.5} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }} tickFormatter={(v) => `${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontWeight: 800 }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Shipment Status Breakdown */}
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-xl">
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6">Répartition Logistique</h3>
          <div className="h-[300px] min-h-[300px] w-full relative">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" debounce={1} minWidth={0}>
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
                  <Legend verticalAlign="bottom" align="center" />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Support Campaign Tracking */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Heart className="w-6 h-6 text-rose-500 fill-current" />
              Impact Campagne
            </h3>
            <span className="text-xs font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-full uppercase">Soutien</span>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm font-black mb-2">
                <span className="text-slate-500">Objectif 10.000.000 XOF</span>
                <span className="text-rose-600">{stats.supportTotal.target > 0 ? Math.round((stats.supportTotal.value / stats.supportTotal.target) * 100) : 0}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.supportTotal.target > 0 ? Math.round((stats.supportTotal.value / stats.supportTotal.target) * 100) : 0}%` }}
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Derniers Supporteurs</p>
              {supportDonors.map((donor, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-[10px] font-black font-sans">
                      {donor.profiles?.full_name?.charAt(0) || 'S'}
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-white truncate max-w-[120px]">
                      {donor.profiles?.full_name || 'Anonyme'}
                    </span>
                  </div>
                  <span className="text-sm font-black text-emerald-500">+{donor.metadata?.amount?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* World Map */}
        <div className="lg:col-span-2 min-h-[400px]">
          <AdminWorldMap />
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <Activity className="w-6 h-6 text-primary" />
            Flux d'Activités Live
          </h3>
          <Link to="/dashboard/admin/leads" className="text-xs font-black text-primary hover:underline">Voir tout</Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentActivities.map((activity, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-white/5 flex gap-4"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activity.type === 'support' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'
                }`}>
                {activity.type === 'support' ? <Heart className="w-5 h-5" /> : <Package className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-black text-slate-900 dark:text-white">{activity.title}</p>
                <p className="text-[10px] font-bold text-slate-500 truncate">{activity.user || 'Collaborateur'}</p>
                <p className="text-[10px] font-black text-slate-400 mt-1">{new Date(activity.date).toLocaleTimeString()}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
