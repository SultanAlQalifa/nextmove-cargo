import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, Users, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Tooltip } from "react-tooltip";

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
  "UK": { en: "United Kingdom", fr: "Royaume-Uni" },
};

export interface UserDistributionData {
  id: string; // ISO 3166-1 alpha-2 / alpha-3 (we map via alpha-2 usually or name)
  value: number; // User sum
}

interface UserDistributionMapProps {
  data: UserDistributionData[];
  totalUsers: number;
  className?: string;
  loading?: boolean;
}

export const UserDistributionMap: React.FC<UserDistributionMapProps> = ({
  data,
  totalUsers,
  className = "",
  loading = false,
}) => {
  const navigate = useNavigate();
  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });
  const [tooltipContent, setTooltipContent] = useState("");

  const displayData = data || [];
  // Use explicit totalUsers prop instead of sum from map, which may be partial

  const colorScale = useMemo(() => {
    const values = displayData.map((d) => d.value);
    const maxVal = values.length ? Math.max(...values) : 1;
    // Minimum color #fed7aa (orange-200), Max color #ea580c (orange-600)
    return scaleLinear<string>()
      .domain([1, maxVal])
      .range(["#fed7aa", "#ea580c"]);
  }, [displayData]);

  const topCountries = useMemo(() => {
    return [...displayData]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((d) => ({
        ...d,
        name: COUNTRY_MAPPING[d.id]?.fr || d.id, // Replace with proper localized name if mapped
      }));
  }, [displayData]);

  const handleZoomIn = () => {
    if (position.zoom >= 4) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleMoveEnd = (position: { coordinates: [number, number]; zoom: number }) => {
    setPosition(position);
  };

  return (
    <div
      className={`bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-xl flex flex-col h-full min-h-[500px] ${className}`}
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">
              Community
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white">
            Répartition Utilisateurs
          </h3>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-black rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1">
            <Users className="w-4 h-4" />
            {totalUsers} TOTAL
          </span>
        </div>
      </div>

      <div className="flex-1 flex max-lg:flex-col gap-8">
        {/* Map Area */}
        <div className="relative flex-1 bg-slate-50 dark:bg-[#0f172a] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              aria-label="Zoom In"
              className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg hover:bg-slate-50 transition-colors border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 min-h-[44px]"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              aria-label="Zoom Out"
              className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg hover:bg-slate-50 transition-colors border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300 min-h-[44px]"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/dashboard/admin/community')}
              title="Voir en plein écran"
              aria-label="Voir en plein écran"
              className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg hover:bg-slate-50 transition-colors border border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>

          <Tooltip id="country-tooltip" className="z-50 !bg-slate-900 !text-white !rounded-xl !text-xs !font-bold" />

          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <ComposableMap
              projectionConfig={{
                scale: 140,
                center: [0, 20]
              }}
              className="w-full h-full cursor-move"
              data-tooltip-id="country-tooltip"
              data-tooltip-html={tooltipContent}
            >
              <ZoomableGroup
                zoom={position.zoom}
                center={position.coordinates}
                onMoveEnd={handleMoveEnd}
              >
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const geoName = geo.properties.name || "";
                      const isoA2 = geo.properties.iso_a2 || "";
                      const isoA3 = geo.id || "";

                      const d = displayData.find((s) => {
                        const mappedEn = COUNTRY_MAPPING[s.id]?.en;
                        return (
                          s.id === isoA2 ||
                          s.id === isoA3 ||
                          s.id.toLowerCase() === geoName.toLowerCase() ||
                          (mappedEn && mappedEn.toLowerCase() === geoName.toLowerCase())
                        );
                      });

                      const hasData = !!d;
                      const userCount = d ? d.value : 0;
                      const percentage = totalUsers > 0 && userCount > 0 ? Math.round((userCount / totalUsers) * 100) : 0;

                      const color = hasData ? colorScale(userCount) : "#1e293b";

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={color}
                          stroke="#334155"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: "none", transition: "all 250ms" },
                            hover: { fill: "#f97316", outline: "none", strokeWidth: 1, stroke: "#fff" },
                            pressed: { outline: "none" },
                          }}
                          onMouseEnter={() => {
                            if (hasData) {
                              const displayName = COUNTRY_MAPPING[d.id]?.fr || geoName;
                              setTooltipContent(`${displayName}<br/>${userCount} util. (${percentage}%)`);
                            } else {
                              setTooltipContent(`${geoName}<br/>Aucune donnée`);
                            }
                          }}
                          onMouseLeave={() => {
                            setTooltipContent("");
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          )}

          <div className="absolute bottom-4 left-4 text-[10px] font-bold text-slate-500 bg-white/80 dark:bg-slate-900/80 px-3 py-1.5 rounded-full backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-700">
            Maintenir & glisser pour explorer
          </div>
        </div>

        {/* Top List Area */}
        <div className="lg:w-1/3 flex flex-col justify-center space-y-4">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
            Top Pays
          </h4>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-full"></div>
              ))}
            </div>
          ) : topCountries.length > 0 ? (
            topCountries.map((country, index) => (
              <div
                key={country.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group cursor-default"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center text-xs font-black text-slate-300 group-hover:text-primary transition-colors">
                    #{index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-white">
                      {country.name}
                    </p>
                    <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(country.value / Math.max(1, topCountries[0].value)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {country.value}
                </span>
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
