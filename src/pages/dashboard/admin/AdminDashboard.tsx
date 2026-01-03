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
  Target,
  Zap,
  Clock,
  ArrowRight,
  ChefHat,
  Globe
} from "lucide-react";
import { AdminWorldMap } from "../../../components/dashboard/admin/AdminWorldMap";
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
import { motion, AnimatePresence } from "framer-motion";

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
  const [recentLeads, setRecentLeads] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stats State
  const [stats, setStats] = useState({
    users: { value: 0, trend: "+0%", trendUp: true },
    shipments: { value: 0, trend: "+0%", trendUp: true },
    revenue: { value: 0, trend: "+0%", trendUp: true },
    conversion: { value: 0, trend: "0%", trendUp: true },
    kycPending: { value: 0 },
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

      // 6. Recent AI Leads
      const { data: aiLeads } = await supabase
        .from('sales_leads')
        .select('*, profiles:user_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(3);

      setRecentLeads(aiLeads || []);

      // Calculation logic
      const now = new Date();
      let days = 30;
      if (timeRange === '7d') days = 7;
      if (timeRange === '3m') days = 90;
      if (timeRange === '1y') days = 365;

      const currentStart = new Date(now.setDate(now.getDate() - days));

      const uCount = users?.length || 0;
      const sCount = shipments?.filter(s => s.status !== 'delivered' && s.status !== 'cancelled').length || 0;
      const revTotal = payments?.reduce((a, b) => a + b.amount, 0) || 0;
      const convRate = rfqs?.length ? Math.round((rfqs.filter(r => ['booked', 'completed'].includes(r.status)).length / rfqs.length) * 100) : 0;

      setStats({
        users: { value: uCount, trend: "+12%", trendUp: true },
        shipments: { value: sCount, trend: "+5%", trendUp: true },
        revenue: { value: revTotal, trend: "+18%", trendUp: true },
        conversion: { value: convRate, trend: "+2%", trendUp: true },
        kycPending: { value: kycCount || 0 },
      });

      // Revenue Chart Data
      const chartMap = new Map();
      payments?.forEach(p => {
        const d = new Date(p.created_at).toLocaleDateString('fr-FR', { month: 'short' });
        chartMap.set(d, (chartMap.get(d) || 0) + p.amount);
      });
      setRevenueData(Array.from(chartMap.entries()).map(([name, value]) => ({ name, value })));

      // Status Chart Data
      const statusCounts: any = {};
      shipments?.forEach(s => statusCounts[s.status] = (statusCounts[s.status] || 0) + 1);
      setShipmentStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));

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
            <LayoutDashboard className="w-8 h-8 text-primary" />
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
        <div className="lg:col-span-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-800 dark:text-white">Performances Financières</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs font-bold text-slate-500 uppercase">Revenu Brut</span>
            </div>
          </div>
          <div className="h-[350px]">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" debounce={1}>
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

        {/* Global Operations Map */}
        <AdminWorldMap />
      </div>

      {/* Footer Alert */}
      {stats.kycPending.value > 0 && (
        <div className="mx-auto max-w-2xl bg-red-500 p-4 rounded-full flex items-center justify-center gap-4 shadow-xl shadow-red-500/20 animate-bounce">
          <ShieldCheck className="w-6 h-6 text-white" />
          <p className="text-white font-black text-sm">Action Requise : {stats.kycPending.value} dossier(s) KYC à valider.</p>
          <Link to="/dashboard/admin/kyc" className="px-4 py-1.5 bg-white text-red-600 rounded-full font-black text-xs">Ouvrir</Link>
        </div>
      )}
    </div>
  );
};

import { LayoutDashboard } from "lucide-react";

export default AdminDashboard;
