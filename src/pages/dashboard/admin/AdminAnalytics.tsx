import { useState, useEffect } from "react";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Package,
    Users,
    Activity,
    ArrowUpRight,
    BarChart3,
    PieChart as PieChartIcon,
    Filter,
    Calendar,
    Download,
    Building2,
    Scale,
    Box
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
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
import { analyticsService, AgencyStats, BusinessKPIs } from "../../../services/analyticsService";
import { useCurrency } from "../../../contexts/CurrencyContext";
import { formatCurrency } from "../../../utils/currencyFormatter";
import PageHeader from "../../../components/common/PageHeader";
import { ChartGuard } from "../../../components/common/ChartGuard";

const COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#10B981", "#F59E0B", "#3B82F6"];

export default function AdminAnalytics() {
    const { currency } = useCurrency();
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState<BusinessKPIs | null>(null);
    const [agencyPerformance, setAgencyPerformance] = useState<AgencyStats[]>([]);
    const [revenueHistory, setRevenueHistory] = useState<any[]>([]);

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const fetchAnalyticsData = async () => {
        setLoading(true);
        try {
            const [kpiData, agencyData, revData] = await Promise.all([
                analyticsService.getBusinessKPIs(),
                analyticsService.getAgencyPerformance(),
                analyticsService.getRevenuePerformance()
            ]);
            setKpis(kpiData);
            setAgencyPerformance(agencyData);
            setRevenueHistory(revData);
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative w-24 h-24">
                    <div className="absolute inset-0 border-4 border-primary/10 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-slate-500 font-black animate-pulse uppercase tracking-widest text-sm">Analyse des flux en cours...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            <PageHeader
                title="Intelligence Business"
                subtitle="Pilotez la performance de votre réseau d'agences"
                action={{
                    label: "Exporter Rapport",
                    icon: Download,
                    onClick: () => window.print()
                }}
            />

            {/* KPI Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard
                    label="Chiffre d'Affaires"
                    value={formatCurrency(kpis?.revenue.current || 0, currency)}
                    trend={kpis?.revenue.trend || 0}
                    icon={DollarSign}
                    color="from-blue-500 to-indigo-600"
                />
                <KPICard
                    label="Expéditions Totales"
                    value={kpis?.shipments.current || 0}
                    trend={kpis?.shipments.trend || 0}
                    icon={Package}
                    color="from-purple-500 to-pink-600"
                />
                <KPICard
                    label="Base Clients"
                    value={kpis?.total_clients || 0}
                    icon={Users}
                    color="from-emerald-500 to-teal-600"
                />
                <KPICard
                    label="Agences Actives"
                    value={kpis?.active_agencies || 0}
                    icon={Building2}
                    color="from-orange-500 to-red-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Growth Chart */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-2xl overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-500/10 rounded-2xl">
                                <BarChart3 className="w-6 h-6 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">Croissance Revenu</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CA Mensuel</span>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueHistory}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 800 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 800 }}
                                    tickFormatter={(val) => `${val >= 1000000 ? (val / 1000000).toFixed(1) + 'M' : (val / 1000).toFixed(0) + 'k'}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                        borderRadius: '1.5rem',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        backdropFilter: 'blur(10px)',
                                        color: '#fff',
                                        fontWeight: 800
                                    }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#3B82F6"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorRev)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Agency Share (Revenue) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl">
                                <PieChartIcon className="w-6 h-6 text-indigo-500" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">Part de Marché / Agence</h3>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={agencyPerformance}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="total_revenue"
                                    nameKey="agency_name"
                                >
                                    {agencyPerformance.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={10} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                        borderRadius: '1.5rem',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        backdropFilter: 'blur(10px)',
                                        color: '#fff',
                                        fontWeight: 800
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    iconType="circle"
                                    formatter={(value) => <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{value}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Agency Detailed Performance Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-slate-200/50 dark:border-white/5 overflow-hidden"
            >
                <div className="p-8 border-b border-slate-200/50 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl">
                            <Activity className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Performances Détaillées Agences</h3>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Comparatif des volumes et revenus (7 derniers jours)</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex -space-x-3">
                            {agencyPerformance.slice(0, 5).map((a, i) => (
                                <div key={i} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-300 shadow-xl">
                                    {a.agency_name.charAt(0)}
                                </div>
                            ))}
                            {agencyPerformance.length > 5 && (
                                <div className="w-10 h-10 rounded-full bg-primary text-white border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black shadow-xl">
                                    +{agencyPerformance.length - 5}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/30">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Agence</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Revenue</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Flux (Colis)</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Métriques (Poids/CBM)</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Performance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {agencyPerformance.map((agency, i) => (
                                <motion.tr
                                    key={agency.agency_id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="hover:bg-slate-50/40 dark:hover:bg-white/[0.02] transition-colors group"
                                >
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-black shadow-inner shadow-black/5 group-hover:scale-110 transition-transform duration-500">
                                                {agency.agency_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-primary transition-colors">{agency.agency_name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{agency.agency_email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="text-lg font-black text-slate-900 dark:text-white">{formatCurrency(agency.total_revenue, currency)}</p>
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Payé</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div>
                                                <p className="text-lg font-black text-slate-800 dark:text-slate-200">{agency.total_shipments}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Exp.</p>
                                            </div>
                                            <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />
                                            <div>
                                                <p className="text-lg font-black text-slate-800 dark:text-slate-200">{agency.total_packages}</p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Colis</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <Scale className="w-3 h-3 text-slate-400" />
                                                <span className="text-[11px] font-black text-slate-600 dark:text-slate-400">{agency.total_weight.toFixed(2)} KG</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Box className="w-3 h-3 text-slate-400" />
                                                <span className="text-[11px] font-black text-slate-600 dark:text-slate-400">{agency.total_volume.toFixed(2)} CBM</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="w-32">
                                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                                <span>Capture</span>
                                                <span>{Math.round((agency.total_revenue / (kpis?.revenue.current || 1)) * 100)}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.round((agency.total_revenue / (kpis?.revenue.current || 1)) * 100)}%` }}
                                                    className="h-full bg-primary rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}

function KPICard({ label, value, trend, icon: Icon, color }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden"
        >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity rounded-full`} />

            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform`}>
                <Icon className="w-7 h-7 text-white" />
            </div>

            <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] mb-1">{label}</p>
            <div className="flex items-baseline gap-3">
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</h3>
                {trend !== undefined && (
                    <div className={`flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-black ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
        </motion.div>
    );
}
