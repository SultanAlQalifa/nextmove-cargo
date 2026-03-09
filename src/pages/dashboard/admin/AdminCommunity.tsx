import React, { useEffect, useMemo, useState } from "react";
import {
    Users, Globe, TrendingUp, UserCheck,
    Map as MapIcon, Activity
} from "lucide-react";
import {
    ComposableMap,
    Geographies,
    Geography,
    ZoomableGroup,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Tooltip } from "react-tooltip";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from "recharts";
import { profileService } from "../../../services/profileService";

const geoUrl = "/world-110m.json";
const COUNTRY_MAPPING: Record<string, { en: string, fr: string }> = {
    "SN": { en: "Senegal", fr: "Sénégal" },
    "FR": { en: "France", fr: "France" },
    "ML": { en: "Mali", fr: "Mali" },
    "CI": { en: "Côte d'Ivoire", fr: "Côte d'Ivoire" },
    "MA": { en: "Morocco", fr: "Maroc" },
    "US": { en: "United States of America", fr: "États-Unis" },
    "CA": { en: "Canada", fr: "Canada" },
    "CN": { en: "China", fr: "Chine" },
    "AE": { en: "United Arab Emirates", fr: "Émirats Arabes Unis" },
    "ES": { en: "Spain", fr: "Espagne" },
    "IT": { en: "Italy", fr: "Italie" },
    "BE": { en: "Belgium", fr: "Belgique" },
    "DE": { en: "Germany", fr: "Allemagne" },
    "GB": { en: "United Kingdom", fr: "Royaume-Uni" },
};

const countryNameToISO: Record<string, string> = {
    'Sénégal': '686',
    'Senegal': '686',
    'États-Unis': '840',
    'Etats-Unis': '840',
    'Maroc': '504',
    'France': '250',
    'Mali': '466',
    'Côte d\'Ivoire': '384',
    'Guinee': '324',
    'Guinée': '324',
};

const AdminCommunity = () => {
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState({ total_users: 0, total_countries: 0, new_this_week: 0, completion_rate: 0 });
    const [distribution, setDistribution] = useState<{ country: string, total: number }[]>([]);
    const [growth, setGrowth] = useState<{ month: string, signups: number }[]>([]);
    const [roleFilter, setRoleFilter] = useState<string>("all");
    const [mapPosition, setMapPosition] = useState({ coordinates: [-10, 15] as [number, number], zoom: 2.5 });
    const [tooltipContent, setTooltipContent] = useState("");

    useEffect(() => {
        fetchCommunityData();
    }, [roleFilter]);

    const fetchCommunityData = async () => {
        setLoading(true);
        try {
            const [k, dist, grw] = await Promise.all([
                profileService.getCommunityKPIs(),
                profileService.getDetailedUserDistribution(roleFilter === "all" ? undefined : roleFilter),
                profileService.getHistoricalUserGrowth()
            ]);

            // Handle Postgres single-row array wrap
            const kpiData = Array.isArray(k) ? k[0] : k;
            setKpis(kpiData || { total_users: 0, total_countries: 0, new_this_week: 0, completion_rate: 0 });

            // Ensure distribution is sorted descending
            const sortedDist = (dist || []).sort((a, b) => b.total - a.total);
            setDistribution(sortedDist);

            setGrowth(grw || []);
        } catch (error) {
            console.error("Failed to load community analytics", error);
        } finally {
            setLoading(false);
        }
    };

    const colorScale = useMemo(() => {
        const values = distribution.map((d) => d.total);
        const maxVal = values.length ? Math.max(...values) : 1;
        return scaleLinear<string>()
            .domain([1, maxVal])
            .range(["#fed7aa", "#ea580c"]); // NextMove Cargo Orange gradient
    }, [distribution]);

    const handleZoomIn = () => {
        if (mapPosition.zoom >= 4) return;
        setMapPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
    };

    const handleZoomOut = () => {
        if (mapPosition.zoom <= 1) return;
        setMapPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <Globe className="w-8 h-8 text-primary" />
                        Communauté NextMove
                    </h1>
                    <p className="text-slate-500 font-medium">Analyse géographique et croissance du réseau</p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex">
                        {['all', 'client', 'forwarder', 'admin'].map((role) => (
                            <button
                                key={role}
                                onClick={() => setRoleFilter(role)}
                                className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition-colors ${roleFilter === role
                                    ? 'bg-primary text-white shadow-md'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-white'
                                    }`}
                            >
                                {role === 'all' ? 'Tous' : role === 'forwarder' ? 'Prestataire' : role}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Total Utilisateurs"
                    value={kpis.total_users}
                    icon={<Users className="w-5 h-5 text-blue-500" />}
                    gradient="from-blue-500/10 to-transparent"
                />
                <KPICard
                    title="Pays Couverts"
                    value={kpis.total_countries}
                    icon={<MapIcon className="w-5 h-5 text-orange-500" />}
                    gradient="from-orange-500/10 to-transparent"
                />
                <KPICard
                    title="Nouveaux (7j)"
                    value={`+${kpis.new_this_week}`}
                    icon={<Activity className="w-5 h-5 text-emerald-500" />}
                    gradient="from-emerald-500/10 to-transparent"
                />
                <KPICard
                    title="Complétion Profil"
                    value={`${kpis.completion_rate}%`}
                    icon={<UserCheck className="w-5 h-5 text-purple-500" />}
                    gradient="from-purple-500/10 to-transparent"
                />
            </div>

            {/* Full Width Map Section */}
            <div className="bg-slate-900 rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden relative">
                <div className="absolute top-6 left-8 z-10 pointer-events-none">
                    <div className="text-xs font-black text-primary tracking-[0.2em] mb-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        CARTE MONDIALE
                    </div>
                    <h2 className="text-3xl font-black text-white">
                        Répartition Global
                    </h2>
                </div>

                <div className="absolute top-6 right-8 z-10 flex gap-2">
                    <button onClick={handleZoomIn} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center justify-center border border-slate-700 transition shadow-lg min-h-[44px]">
                        +
                    </button>
                    <button onClick={handleZoomOut} className="w-10 h-10 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center justify-center border border-slate-700 transition shadow-lg min-h-[44px]">
                        -
                    </button>
                </div>

                <Tooltip id="big-map-tooltip" className="z-50 !bg-slate-800 !text-white !rounded-xl !text-sm !font-bold border border-slate-700 shadow-xl" />

                <div className="h-[500px] lg:h-[600px] w-full cursor-move">
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <ComposableMap
                            projectionConfig={{ scale: 160, center: [0, 20] }}
                            className="w-full h-full outline-none"
                            data-tooltip-id="big-map-tooltip"
                            data-tooltip-html={tooltipContent}
                        >
                            <ZoomableGroup zoom={mapPosition.zoom} center={mapPosition.coordinates} onMoveEnd={(p) => setMapPosition(p)}>
                                <Geographies geography={geoUrl}>
                                    {({ geographies }) =>
                                        geographies.map((geo) => {
                                            const geoName = geo.properties.name || "";
                                            // isoNumeric mapping

                                            const d = distribution.find((s) => {
                                                const countryName = s.country || '';
                                                const mappedFr = COUNTRY_MAPPING[countryName]?.fr;
                                                const isoNumeric = countryNameToISO[countryName] || countryNameToISO[mappedFr || ''];

                                                if (geo.id === isoNumeric) {
                                                    return true;
                                                }
                                                return false;
                                            });

                                            const userCount = d ? d.total : 0;
                                            const percentage = kpis.total_users > 0 && userCount > 0 ? Math.round((userCount / kpis.total_users) * 100) : 0;
                                            const color = d ? colorScale(userCount) : "#1e293b";

                                            return (
                                                <Geography
                                                    key={geo.rsmKey}
                                                    geography={geo}
                                                    fill={color}
                                                    stroke="#0f172a"
                                                    strokeWidth={0.5}
                                                    style={{
                                                        default: { outline: "none", transition: "all 250ms" },
                                                        hover: { fill: "#f97316", outline: "none", cursor: "pointer", strokeWidth: 1, stroke: "#fff" },
                                                        pressed: { outline: "none" },
                                                    }}
                                                    onMouseEnter={() => {
                                                        if (d) {
                                                            const displayName = COUNTRY_MAPPING[d.country]?.fr || geoName;
                                                            setTooltipContent(`${displayName}<br/><span style="color:#f97316">${userCount} utilisateurs</span> (${percentage}%)`);
                                                        } else {
                                                            setTooltipContent(`${geoName}<br/><span style="color:#94a3b8">Aucune couverture</span>`);
                                                        }
                                                    }}
                                                    onMouseLeave={() => setTooltipContent("")}
                                                />
                                            );
                                        })
                                    }
                                </Geographies>
                            </ZoomableGroup>
                        </ComposableMap>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Detailed Table */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm overflow-hidden flex flex-col h-[400px]">
                    <h3 className="text-lg font-black text-slate-800 dark:text-white mb-4 flex items-center justify-between">
                        Classement Complet
                        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">
                            {distribution.length} pays
                        </span>
                    </h3>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {loading ? (
                            <div className="animate-pulse space-y-3">
                                {[...Array(6)].map((_, i) => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl"></div>)}
                            </div>
                        ) : distribution.length > 0 ? (
                            <table className="w-full text-left border-collapse">
                                <tbody>
                                    {distribution.map((d, index) => (
                                        <tr key={index} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition group">
                                            <td className="py-3 px-1">
                                                <span className="text-xs font-black text-slate-400 w-6 inline-block">#{index + 1}</span>
                                            </td>
                                            <td className="py-3 font-bold text-slate-700 dark:text-slate-200 text-sm">
                                                {COUNTRY_MAPPING[d.country]?.fr || d.country}
                                            </td>
                                            <td className="py-3 text-right">
                                                <span className="font-black text-primary">{d.total}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
                                Aucune donnée pour ce filtre.
                            </div>
                        )}
                    </div>
                </div>

                {/* Growth Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 shadow-sm h-[400px] flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Évolution des Inscriptions
                            </h3>
                            <p className="text-sm font-medium text-slate-500">Croissance mensuelle de la communauté</p>
                        </div>
                    </div>
                    <div className="flex-1">
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                            </div>
                        ) : growth.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={growth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                                        dy={10}
                                        tickFormatter={(val) => {
                                            const d = new Date(val + '-01');
                                            return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
                                        }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '1rem', color: '#fff' }}
                                        itemStyle={{ color: '#fff', fontWeight: 900 }}
                                        cursor={{ stroke: '#f97316', strokeWidth: 2, strokeDasharray: '4 4' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="signups"
                                        stroke="#f97316"
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorSignups)"
                                        name="Inscriptions"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
                                Pas assez de données pour tracer l'évolution.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Generic KPI Card Component
const KPICard = ({ title, value, icon, gradient }: { title: string, value: string | number, icon: React.ReactNode, gradient: string }) => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-600 transition-colors animate-in fade-in slide-in-from-bottom-4">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
        <div className="relative z-10 flex items-center justify-between mb-4">
            <div className="p-3 bg-white/50 dark:bg-slate-800/50 rounded-xl backdrop-blur-sm shadow-sm border border-slate-100 dark:border-slate-700">
                {icon}
            </div>
        </div>
        <div className="relative z-10">
            <h4 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">
                {title}
            </h4>
            <p className="text-3xl font-black text-slate-800 dark:text-white">
                {value}
            </p>
        </div>
    </div>
);

export default AdminCommunity;
