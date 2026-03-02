import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Globe, MapPin, Zap, ChevronRight, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
    ComposableMap,
    Geographies,
    Geography,
    Marker,
    Line,
} from "react-simple-maps";
import { rfqService } from "../../../services/rfqService";

const geoUrl = "/world-110m.json";

// Real-world coordinates [longitude, latitude] for major hubs
const PORT_COORDINATES: Record<string, { coordinates: [number, number], color: string, name: string }> = {
    "DAKAR": { coordinates: [-17.4677, 14.7167], color: "#ea580c", name: "Dakar, SN" }, // NextMove Orange
    "SHENZHEN": { coordinates: [114.0579, 22.5431], color: "#fbbf24", name: "Shenzhen, CN" },
    "GUANGZHOU": { coordinates: [113.2644, 23.1291], color: "#fcd34d", name: "Guangzhou, CN" },
    "PARIS": { coordinates: [2.3522, 48.8566], color: "#60a5fa", name: "Paris, FR" },
    "MARSEILLE": { coordinates: [5.3698, 43.2965], color: "#93c5fd", name: "Marseille, FR" },
    "DUBAI": { coordinates: [55.2708, 25.2048], color: "#f472b6", name: "Dubai, AE" },
    "NYC": { coordinates: [-74.006, 40.7128], color: "#34d399", name: "New York, US" },
    "CASABLANCA": { coordinates: [-7.5898, 33.5731], color: "#a78bfa", name: "Casablanca, MA" },
    "ISTANBUL": { coordinates: [28.9784, 41.0082], color: "#f87171", name: "Istanbul, TR" },
};

// Fallback logic to get coordinates if exact port name isn't matched
function getCoordinatesForPort(portName: string): [number, number] | null {
    const upperPort = portName.toUpperCase();
    for (const [key, data] of Object.entries(PORT_COORDINATES)) {
        if (upperPort.includes(key) || key.includes(upperPort)) {
            return data.coordinates;
        }
    }
    // Try mapping countries directly to an approximate center if port unknown
    if (upperPort.includes("SENEGAL")) return PORT_COORDINATES["DAKAR"].coordinates;
    if (upperPort.includes("CHINA") || upperPort.includes("CHINE")) return PORT_COORDINATES["SHENZHEN"].coordinates;
    if (upperPort.includes("FRANCE")) return PORT_COORDINATES["PARIS"].coordinates;
    if (upperPort.includes("USA") || upperPort.includes("ETATS-UNIS")) return PORT_COORDINATES["NYC"].coordinates;
    if (upperPort.includes("MOROCCO") || upperPort.includes("MAROC")) return PORT_COORDINATES["CASABLANCA"].coordinates;

    return null;
}

const RoutingComet = ({
    start,
    end,
    color,
    duration = 3,
    delay = 0
}: {
    start: [number, number];
    end: [number, number];
    color: string;
    duration?: number;
    delay?: number;
}) => {
    // We use framer-motion to draw an arc between the start and end coordinates.
    // Using a <path> we calculate a simple quadratic bezier curve.

    // To correctly place SVG paths over react-simple-maps, we usually draw them inside
    // an SVG overlay if we want CSS offset paths, but inside `<Line>` or pure SVG it can be complex.
    // For simplicity and pure react-simple-maps compatibility, we use `<Line>` to draw the arc
    // and animate the dasharray.
    return (
        <Line
            from={start}
            to={end}
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            className="animate-pulse opacity-60 mix-blend-screen"
            style={{
                filter: `drop-shadow(0 0 3px ${color}) drop-shadow(0 0 5px ${color})`
            }}
        />
    );
};

export const AdminWorldMap = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [routes, setRoutes] = useState<{
        origin: string,
        destination: string,
        count: number,
        weight: number,
        startCoords: [number, number] | null,
        endCoords: [number, number] | null
    }[]>([]);

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        setLoading(true);
        try {
            const rawRoutes = await rfqService.getGlobalOperationsStats();
            // Process coordinates
            const mappedRoutes = rawRoutes.map(r => ({
                origin: r.origin_port,
                destination: r.destination_port,
                count: r.route_count,
                weight: Number(r.total_weight),
                startCoords: getCoordinatesForPort(r.origin_port),
                endCoords: getCoordinatesForPort(r.destination_port)
            })).filter(r => r.startCoords && r.endCoords); // Only keep routes we can draw

            setRoutes(mappedRoutes);
        } catch (error) {
            console.error("Failed to load global routes", error);
        } finally {
            setLoading(false);
        }
    };

    const totalTonnage = useMemo(() => {
        return routes.reduce((acc, curr) => acc + curr.weight, 0);
    }, [routes]);

    // Get unique active port coordinates for drawing pulsing dots
    const activePorts = useMemo(() => {
        const ports = new Map<string, { coords: [number, number], count: number }>();
        routes.forEach(r => {
            if (r.startCoords) {
                const key = r.startCoords.join(',');
                ports.set(key, { coords: r.startCoords, count: (ports.get(key)?.count || 0) + 1 });
            }
            if (r.endCoords) {
                const key = r.endCoords.join(',');
                ports.set(key, { coords: r.endCoords, count: (ports.get(key)?.count || 0) + 1 });
            }
        });
        return Array.from(ports.values());
    }, [routes]);

    return (
        <div className="bg-slate-900/90 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl flex flex-col h-full min-h-[450px] relative overflow-hidden group hover:border-slate-700 transition duration-500">
            {/* Dark gradient overlay for spatial depth */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-800 opacity-80 pointer-events-none"></div>

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-5 h-5 text-primary animate-pulse shadow-primary drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                        <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em] drop-shadow-md">Global Logistics</span>
                    </div>
                    <h3 className="text-xl font-black text-white drop-shadow-md">Opérations Mondiales</h3>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black rounded-lg border border-emerald-500/30 flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                        <Zap className="w-3 h-3 fill-current" />
                        LIVE
                    </span>
                    <button
                        onClick={() => navigate('/dashboard/admin/community')}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-lg border border-white/10 flex items-center gap-1 transition-all"
                    >
                        VOIR TOUT
                        <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden flex items-center justify-center z-10 -mx-8 -my-4">
                {loading ? (
                    <div className="w-10 h-10 border-4 border-slate-700 border-t-primary rounded-full animate-spin"></div>
                ) : (
                    <ComposableMap
                        projectionConfig={{ scale: 140, center: [20, 20] }}
                        className="w-full h-full scale-125 md:scale-150 outline-none"
                    >
                        <Geographies geography={geoUrl}>
                            {({ geographies }) =>
                                geographies.map((geo) => (
                                    <Geography
                                        key={geo.rsmKey}
                                        geography={geo}
                                        fill="#1e293b"
                                        stroke="#0f172a"
                                        strokeWidth={0.5}
                                        style={{
                                            default: { outline: "none" },
                                            hover: { fill: "#334155", outline: "none" },
                                            pressed: { outline: "none" },
                                        }}
                                    />
                                ))
                            }
                        </Geographies>

                        {/* Draw curved lines for active RFQ routes */}
                        {routes.map((route, i) => {
                            if (!route.startCoords || !route.endCoords) return null;
                            // Alternate colors slightly for visual richness based on index
                            const colors = ["#ea580c", "#f97316", "#fb923c", "#fcd34d", "#38bdf8"];
                            const color = colors[i % colors.length];

                            return (
                                <RoutingComet
                                    key={`route-${i}`}
                                    start={route.startCoords}
                                    end={route.endCoords}
                                    color={color}
                                />
                            );
                        })}

                        {/* Draw pulsing markers for active hubs */}
                        {activePorts.map((hub, i) => (
                            <Marker key={`hub-${i}`} coordinates={hub.coords}>
                                <circle r={4} fill="#f97316" className="animate-ping opacity-75" />
                                <circle r={2} fill="#fff" />
                            </Marker>
                        ))}

                        {/* Always highlight Dakar as main hub */}
                        <Marker coordinates={PORT_COORDINATES["DAKAR"].coordinates}>
                            <circle r={8} fill="rgba(234, 88, 12, 0.4)" className="animate-pulse" />
                            <circle r={4} fill="#ea580c" />
                            <circle r={2} fill="#fff" />
                            <text
                                textAnchor="middle"
                                y={-15}
                                fontFamily="system-ui"
                                fill="#fbd38d"
                                fontSize="10px"
                                fontWeight="bold"
                            >
                                DAKAR HUB
                            </text>
                        </Marker>
                    </ComposableMap>
                )}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 relative z-10 glass-panel bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-md">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Hub Principal
                    </p>
                    <div className="text-sm font-black text-white">Dakar, SN</div>
                </div>
                <div className="border-l border-slate-700/50 pl-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Activity className="w-3 h-3" /> Routes Actives
                    </p>
                    <div className="text-sm font-black text-primary flex items-end gap-1">
                        {routes.length} <span className="text-[10px] text-slate-500 font-bold mb-0.5">lignes</span>
                    </div>
                </div>
                <div className="border-l border-slate-700/50 pl-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Volumétrie
                    </p>
                    <div className="text-sm font-black text-white flex items-end gap-1">
                        {totalTonnage.toLocaleString()} <span className="text-[10px] text-slate-500 font-bold mb-0.5">kg</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
