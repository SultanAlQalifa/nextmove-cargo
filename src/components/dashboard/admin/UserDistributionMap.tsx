import React, { useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Globe, Users, Plus, Minus, Maximize } from "lucide-react";

// Robust World Map Path (Mercator-ish projection)
const WORLD_PATH = "M156.4,143.6l-1.1,0.5l-0.7,0.1l-0.3,0.2l-0.5,0l-0.6,0.3l-0.3,0.2l-0.3,0.3l-0.4,0.1l-0.1,0.3l-0.2,0l-0.2,0.2l-0.3,0.6v0.5l0.1,0.3l-0.1,0l-0.2,0.5v0.4l0.4,0.1l0.4,0.4l-0.2,0.6l-0.1,0l0,0.2l-0.5,0.2l-0.7,0l-0.1,0.3l-0.4,0l-0.2,0.2l-0.2,0.5l0.3,0.7l0.3,0l-0.1,0.5l0.5,0.5l0.4,0.1l0.5,0.4l0.3,0.7l0.4,0.5l0.5,0l0.5,0.3l-0.1,0.4l-0.4,0l0.1,0.8l0.3,0.3l0.3,0l0.6,0.3l-0.1,0.6l0.3,0.5l0.4,0.1l0.1,0.5l0.6,0.3l0.6,0l0.4,0.1l0.5,0.4l0.1,0.3l-0.2,0.6l0.4,0.4l0.2,0.6l0.2,0.1l0.5,0l0.4,0.4l0.4,0.4l0.4,0.1l0.3,0.3l0.2,0.5l0.3,0.4l0.5,0.5l0.4,0.4l0.5,0.4l0.5,0l0.4,0.2l0.6,0.6l0.4,0.3l0.6,0l0.5,0.5l0.7,0.4l0.5,0.4l0.5,0l0.5,0.5l0.3,0l0.2,0.6l0.2,0.5l0.1,0.6l0.3,0.4l0.4,0.5l0.3,0.4l0.7,0.2l0.3,0l0.6,0.3l0.6,0.5l0.3,0.4l0.6,0l0.5,0.4l0.2,0.5l0.2,0.3l0.4,0.1l0.2,0.6l0.4,0.4l0.4,0.4l0.3,0.4l0.4,0l0.3,0.3l0.4,0l0.4,0.2l0.3,0.6l0.4,0l0.3,0.4l0.3,0.4l0.2,0.5l0.5,0l0.3,0.5l0.4,0.3l0.4,0l0.4,0.5l0.5,0l0.5,0.4h0.1l0.2,0.6l0.5,0.3l0.3,0l-0.3,0.7l0.4,0.5l0.4,0.5l0.5,0l0.1,1.1l0.2,0.3l0.4,0l0.2,0.5l0.2,0.5l0.3,0.3l0.4,0l0.1,0.2l0.3,0l0.2,0.5h0.1l0.1,0.5l0.3,0.4l0.3,0l0.2,0.5l0.3,0l0.3,0.2l0.3,0.5l0.4,0l0.1,0.1l0.4,0.5l0.4,0l0.2,0.3l0.7,0.2l0.2,0.5l0.4,0l0.1,0.3l0.2,0.4l0.4,0.2l0.2,0.5l0.4,0.4l0.4,0l0.3,0.6l0.5,0.3l0.4,0.4l0.4,0l0.3,0.3l0.3,0l0.3,0.2l0.4,0l0.3,0.4l0.4,0.1l0.3,0.4l0.4,0.4l0.4,0.4l0.4,0l0.3,0.3l0.4,0.3l0.4,0l0.4,0.3l0.4,0.1l0.6,0.5l0.4,0l0.3,0.3l0.4,0l0.1,0.3l0.3,0l0.1,0.4l0.3,0.3l0.7,0.2l0.3,0.5l0.4,0l0.3,0.3l0.3,0l0.3,0.3l0.3,0l0.3,0.3l0.3,0.6l0.4,0l0.2,0.4l0.4,0.4l0.3,0.3l0.5,0l0.2,0.5l0.3,0.4l0.3,0.5l0.2,0.6l0.3,0.2l0.3,0.3l0.3,0l0.2,0.4l0.3,0.3l0.6,0l0.5,0.3l0.4,0l0.3,0.4l0.4,0.3l0.5,0.4l0.3,0.1l0.3,0.3l0.6,0l0.3,0.4l0.5,0.6l0.5,0.4l0.4,0.4l0.4,0.1l0.6,0.5l0.3,0.4l0.6,0l0.5,0.3l0.4,0l0.3,0.3l0.5,0l0.1,0.3l0.2,0.3l0.4,0l0.2,0.3l0.4,0.4l0.5,0l0.2,0.3l0.4,0l0.2,0.5l0.1,0.2l0.2,0l0.1,0.5l0.4,0.5l0.4,0.3l0.3,0l0,0.5l0.4,0.1l0.4,0.5l0.4,0l0.2,0.5l0.3,0.4l0.4,0.1l0.4,0.1l0.4,0.3l0.5,0.7l0.4,0.4l0.5,0l0.4,0.3l0.5,0.4l0.4,0l0.2,0.5l0.4,0.1l0.5,0.6l0.3,0l0.2,0.6l0.4,0.4l0.4,0l0.2,0.5l0.4,0l0.2,0.5l-0.1,0.5l0.4,0l0.1,0.5l0.5,0.4l0.4,0l0.2,0.5l0.4,0.1l0.1,0l0.2,0.5l0.3,0.3l0.2,0.5l0.4,0l0.1,1.1l0.2,0l0.2,0.5l0.3,0.3l0.4,0.4l0.3,0.6l0.6,0l0.3,0.3z";


// Mapping of country codes to coordinates on the schematic map
const COUNTRY_COORDS: Record<string, { x: number; y: number; name: string }> = {
    // Africa
    SN: { x: 106, y: 151, name: "Sénégal" },
    CI: { x: 110, y: 160, name: "Côte d'Ivoire" },
    ML: { x: 115, y: 145, name: "Mali" },
    NG: { x: 125, y: 165, name: "Nigeria" },
    GH: { x: 115, y: 165, name: "Ghana" },
    MA: { x: 115, y: 95, name: "Maroc" },
    ZA: { x: 145, y: 240, name: "Afrique du Sud" },
    DZ: { x: 125, y: 100, name: "Algérie" },
    EG: { x: 165, y: 110, name: "Égypte" },

    // Europe
    FR: { x: 140, y: 65, name: "France" },
    GB: { x: 135, y: 60, name: "Royaume-Uni" },
    DE: { x: 150, y: 65, name: "Allemagne" },
    ES: { x: 135, y: 80, name: "Espagne" },
    IT: { x: 155, y: 75, name: "Italie" },
    PT: { x: 130, y: 80, name: "Portugal" },

    // Americas
    US: { x: 50, y: 80, name: "États-Unis" },
    CA: { x: 50, y: 40, name: "Canada" },
    MX: { x: 45, y: 100, name: "Mexique" },
    BR: { x: 90, y: 190, name: "Brézil" },

    // Asia/Middle East
    CN: { x: 280, y: 120, name: "Chine" },
    AE: { x: 200, y: 110, name: "Émirats Arabes Unis" },
    SA: { x: 190, y: 115, name: "Arabie Saoudite" },
    IN: { x: 220, y: 130, name: "Inde" },
    JP: { x: 320, y: 100, name: "Japon" },
    TR: { x: 170, y: 90, name: "Turquie" },
};

// Fallback demo data if real data is empty
const DEMO_DATA: UserDistributionData[] = [
    { id: 'SN', value: 1250 },
    { id: 'FR', value: 450 },
    { id: 'CN', value: 320 },
    { id: 'ML', value: 210 },
    { id: 'CI', value: 180 },
    { id: 'US', value: 120 },
    { id: 'AE', value: 95 },
    { id: 'MA', value: 80 },
];

export interface UserDistributionData {
    id: string; // CountryCode
    value: number; // User count
}

interface UserDistributionMapProps {
    data: UserDistributionData[];
    className?: string;
    loading?: boolean;
}

const PulseMarker = ({ cx, cy, color, size, label, count, scale }: { cx: number; cy: number; color: string; size: number; label: string; count: number; scale: number }) => (
    <motion.g
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{ originX: `${cx}px`, originY: `${cy}px` }} // Maintain scale origin
    >
        {/* Animated Ripple */}
        <motion.circle
            cx={cx}
            cy={cy}
            r={size}
            fill={color}
            initial={{ scale: 1, opacity: 0.4 }}
            animate={{ scale: [1, 2], opacity: [0.4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            // Counter-scale the marker to keep it readable when map zooms
            style={{ scale: 1 / scale }}
        />
        {/* Core Dot */}
        <motion.circle
            cx={cx}
            cy={cy}
            r={Math.max(2, size / 2)}
            fill={color}
            className="drop-shadow-sm cursor-pointer"
            style={{ scale: 1 / scale }}
        />

        {/* Tooltip trigger area */}
        <title>{`${label}: ${count} utilisateurs`}</title>
    </motion.g>
);

export const UserDistributionMap: React.FC<UserDistributionMapProps> = ({ data, className = "", loading = false }) => {
    const [scale, setScale] = useState(1);
    const containerRef = useRef<HTMLDivElement>(null);

    // Use demo data if empty
    const displayData = (data && data.length > 0) ? data : DEMO_DATA;
    const isDemo = !data || data.length === 0;

    // Process data to map to coordinates
    const mappedData = useMemo(() => {
        return displayData
            .filter(d => COUNTRY_COORDS[d.id])
            .map(d => ({
                ...d,
                ...COUNTRY_COORDS[d.id],
                normalizedValue: Math.max(3, Math.min(8, Math.log2(d.value + 1) * 2))
            }));
    }, [displayData]);

    const topCountries = useMemo(() => {
        return [...displayData]
            .sort((a, b) => b.value - a.value)
            .slice(0, 5)
            .map(d => ({
                ...d,
                name: COUNTRY_COORDS[d.id]?.name || d.id
            }));
    }, [displayData]);

    const totalUsers = isDemo ? '12k+' : data.reduce((acc, curr) => acc + curr.value, 0);

    const handleZoomIn = () => setScale(s => Math.min(s * 1.5, 5));
    const handleZoomOut = () => setScale(s => Math.max(s / 1.5, 1));
    const handleReset = () => setScale(1);

    return (
        <div className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-xl flex flex-col h-full min-h-[500px] ${className}`}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-5 h-5 text-emerald-500 animate-pulse" />
                        <span className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]">Community</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">Répartition Utilisateurs</h3>
                </div>
                <div className="flex gap-2">
                    {isDemo && (
                        <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-lg border border-amber-100 items-center gap-1 hidden md:flex">
                            DEMO DATA
                        </span>
                    )}
                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {totalUsers} TOTAL
                    </span>
                </div>
            </div>

            <div className="flex-1 flex max-lg:flex-col gap-8">
                {/* Map Area */}
                <div
                    ref={containerRef}
                    className="relative flex-1 bg-[#dbeafe] dark:bg-[#1e293b] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-move"
                >
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-grid-pattern" />

                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                        <button onClick={handleZoomIn} aria-label="Zoom in" className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg hover:bg-slate-50 transition-colors border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            <Plus className="w-4 h-4" />
                        </button>
                        <button onClick={handleZoomOut} aria-label="Zoom out" className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg hover:bg-slate-50 transition-colors border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            <Minus className="w-4 h-4" />
                        </button>
                        <button onClick={handleReset} aria-label="Reset zoom" className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg hover:bg-slate-50 transition-colors border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                            <Maximize className="w-4 h-4" />
                        </button>
                    </div>

                    <motion.div
                        className="w-full h-full flex items-center justify-center p-8"
                        drag
                        dragConstraints={containerRef}
                        dragElastic={0.1}
                    >
                        <motion.svg
                            viewBox="0 0 400 300"
                            className="w-full h-full drop-shadow-2xl"
                            animate={{ scale }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        >
                            {/* Map Background (Ocean implied by container, this is Land) */}
                            <path
                                d={WORLD_PATH}
                                fill="#f8fafc" // White land
                                stroke="#94a3b8" // Slate border
                                strokeWidth="0.5"
                                className="dark:fill-[#0f172a] dark:stroke-slate-600 transition-colors"
                            />

                            {/* Data Points */}
                            {(!loading || isDemo) && mappedData.map((d) => (
                                <PulseMarker
                                    key={d.id}
                                    cx={d.x}
                                    cy={d.y}
                                    color="#ef4444" // Red for visibility like pins
                                    size={d.normalizedValue}
                                    label={d.name}
                                    count={d.value}
                                    scale={scale}
                                />
                            ))}
                        </motion.svg>
                    </motion.div>

                    <div className="absolute bottom-4 left-4 text-[10px] font-bold text-slate-500 bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-700">
                        Maintenir & glisser pour explorer
                    </div>
                </div>

                {/* Top List Area */}
                <div className="lg:w-1/3 flex flex-col justify-center space-y-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                        Top Pays {isDemo && '(Simulation)'}
                    </h4>
                    {loading && !isDemo ? (
                        <div className="animate-pulse space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div>)}
                        </div>
                    ) : topCountries.length > 0 ? (
                        topCountries.map((country, index) => (
                            <div key={country.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group cursor-default">
                                <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 flex items-center justify-center text-xs font-black text-slate-300 group-hover:text-emerald-500 transition-colors">
                                        #{index + 1}
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold text-slate-700 dark:text-white">{country.name}</p>
                                        <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                                            <motion.div
                                                className="h-full bg-emerald-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(country.value / Math.max(1, topCountries[0].value)) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <span className="text-sm font-black text-slate-900 dark:text-white">{country.value}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-slate-400 italic">Aucune donnée géographique.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
