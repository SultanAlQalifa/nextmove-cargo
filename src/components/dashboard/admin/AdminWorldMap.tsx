import { motion } from "framer-motion";
import { Globe, MapPin, Zap } from "lucide-react";

// Simplified Schematic World Map Path (Low poly/Stylized)
const WORLD_PATH = "M156.417,143.585l-1.071,0.548l-0.655,0.063l-0.344,0.187l-0.545,0l-0.627,0.306l-0.298,0.244l-0.283,0.334l-0.41,0.147l-0.126,0.342l-0.219,0l-0.201,0.224l-0.344,0.573l0,0.528l0.111,0.342l-0.081,0l-0.155,0.482l0,0.364l0.428,0.124l0.435,0.358l-0.181,0.643l-0.12,0l0.046,0.246l-0.522,0.165l-0.686,0.013l-0.138,0.337l-0.426,0l-0.178,0.191l-0.203,0.51l0.322,0.672l0.306,0l-0.134,0.473l0.495,0.473l0.436,0.122l0.479,0.366l0.286,0.722l0.43,0.485l0.487,0.038l0.479,0.34l-0.122,0.428l-0.421,0l0.106,0.758l0.298,0.28l0.264,0l0.612,0.317l-0.141,0.612l0.252,0.473l0.384,0.143l0.135,0.467l0.614,0.314l0.555,0.021l0.407,0.139l0.49,0.354l0.122,0.346l-0.186,0.638l0.395,0.41l0.165,0.621l0.159,0.054l0.473,0l0.354,0.354l0.35,0.412l0.444,0.149l0.323,0.262l0.205,0.548l0.315,0.37l0.471,0.457l0.399,0.436l0.45,0.395l0.537,0l0.428,0.224l0.592,0.597l0.385,0.301l0.56,0l0.459,0.528l0.697,0.44l0.485,0.402l0.524,0l0.463,0.491l0.344,0l0.207,0.551l0.231,0.492l0.091,0.578l0.286,0.445l0.424,0.505l0.315,0.357l0.71,0.2l0.327,0l0.584,0.25l0.58,0.51l0.334,0.351l0.582,0.046l0.469,0.418l0.15,0.496l0.194,0.344l0.418,0.113l0.222,0.587l0.4,0.442l0.44,0.35l0.312,0.449l0.434,0l0.312,0.338l0.364,0l0.427,0.218l0.318,0.58l0.399,0l0.327,0.354l0.257,0.373l0.16,0.451l0.452,0l0.279,0.533l0.427,0.32l0.392,0l0.384,0.506l0.466,0l0.497,0.382l0.076,0l0.168,0.563l0.504,0.346l0.292,0l-0.301,0.732l0.379,0.513l0.354,0.47l0.465,0l0.117,1.077l0.198,0.297l0.407,0l0.178,0.504l0.236,0.513l0.297,0.287l0.427,0l0.141,0.204l0.324,0l0.212,0.513l0.076,0l0.126,0.513l0.333,0.41l0.298,0l0.207,0.453l0.333,0l0.321,0.212l0.301,0.528l0.356,0l0.081,0.116l0.353,0.472l0.422,0l0.199,0.334l0.725,0.204l0.176,0.548l0.416,0l0.126,0.344l0.171,0.359l0.446,0.152l0.16,0.536l0.412,0.37l0.415,0l0.273,0.613l0.51,0.334l0.41,0.395l0.37,0l0.264,0.342l0.337,0l0.327,0.211l0.37,0l0.298,0.384l0.354,0.063l0.344,0.394l0.412,0.417l0.41,0.383l0.432,0l0.326,0.336l0.38,0.284l0.443,0l0.356,0.33l0.407,0.081l0.584,0.492l0.435,0l0.292,0.312l0.423,0l0.106,0.322l0.337,0l0.104,0.351l0.284,0.28l0.71,0.231l0.289,0.465l0.442,0l0.297,0.28l0.323,0l0.27,0.333l0.33,0l0.315,0.495l0.453,0l0.252,0.322l0.301,0.551l0.37,0l0.215,0.355l0.364,0.543l0.315,0.337l0.467,0l0.211,0.548l0.298,0.395l0.286,0.49l0.18,0.55l0.315,0.214l0.344,0.344l0.337,0l0.245,0.354l0.315,0.315l0.551,0l0.473,0.333l0.44,0l0.284,0.354l0.443,0.314l0.463,0.427l0.344,0.054l0.31,0.306l0.55,0l0.322,0.354l0.548,0.584l0.45,0.359l0.442,0.373l0.412,0.126l0.584,0.473l0.32,0.351l0.555,0l0.473,0.301l0.422,0l0.315,0.337l0.495,0l0.134,0.322l0.222,0.333l0.381,0l0.207,0.322l0.41,0.442l0.505,0l0.216,0.297l0.41,0l0.155,0.548l0.106,0.211l0.186,0l0.122,0.482l0.422,0.492l0.407,0.333l0.264,0l0.015,0.536l0.418,0.117l0.442,0.542l0.422,0l0.207,0.528l0.315,0.359l0.415,0.113l0.428,0.106l0.428,0.334l0.45,0.697l0.41,0.351l0.485,0.046l0.421,0.334l0.545,0.355l0.427,0l0.198,0.513l0.387,0.126l0.465,0.612l0.301,0l0.211,0.57l0.435,0.354l0.41,0l0.165,0.513l0.418,0l0.211,0.507l-0.122,0.479l0.41,0l0.111,0.48l0.528,0.364l0.422,0l0.207,0.537l0.384,0.116l0.126,0l0.211,0.51l0.337,0.301l0.222,0.545l0.44,0l0.136,1.071l0.18,0l0.211,0.463l0.33,0.344l0.415,0.354l0.312,0.638l0.578,0l0.33,0.322z";

export const AdminWorldMap = () => {
    // Current route simulation (Dakar -> Shenzhen, Dakar -> Paris, etc.)
    const routes = [
        { id: 1, from: [100, 150], to: [280, 120], color: "#fbbf24", label: "DKR → SZW" },
        { id: 2, from: [100, 150], to: [140, 60], color: "#60a5fa", label: "DKR → PAR" },
    ];

    return (
        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-xl flex flex-col h-full min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-5 h-5 text-primary animate-pulse" />
                        <span className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">Global Logistics</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white">Opérations Mondiales</h3>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100 flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-current" />
                        LIVE
                    </span>
                </div>
            </div>

            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                <svg
                    viewBox="0 0 400 300"
                    className="w-full h-full max-h-[250px] opacity-20 dark:opacity-10 scale-150"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <path
                        d={WORLD_PATH}
                        fill="currentColor"
                        className="text-slate-400"
                    />
                </svg>

                {/* Simulated Pings & Arcs */}
                <div className="absolute inset-0">
                    <svg viewBox="0 0 400 300" className="w-full h-full scale-150">
                        {/* Dakar */}
                        <circle cx="106" cy="151" r="3" fill="#6366f1" className="animate-ping" />
                        <circle cx="106" cy="151" r="2" fill="#6366f1" />

                        {/* Shenzhen */}
                        <circle cx="280" cy="120" r="3" fill="#fbbf24" className="animate-pulse" />
                        <circle cx="280" cy="120" r="2" fill="#fbbf24" />

                        {/* Paris */}
                        <circle cx="140" cy="65" r="3" fill="#60a5fa" />

                        {/* Route Arcs */}
                        <motion.path
                            d="M 106 151 Q 193 100 280 120"
                            stroke="#fbbf24"
                            strokeWidth="1.5"
                            fill="none"
                            strokeDasharray="100"
                            initial={{ strokeDashoffset: 100 }}
                            animate={{ strokeDashoffset: 0 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                        <motion.path
                            d="M 106 151 Q 123 100 140 65"
                            stroke="#60a5fa"
                            strokeWidth="1"
                            fill="none"
                            strokeDasharray="100"
                            initial={{ strokeDashoffset: 100 }}
                            animate={{ strokeDashoffset: 0 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        />
                    </svg>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Activité Principale</p>
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-black text-slate-700 dark:text-white">Dakar, SN</span>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destinations IA</p>
                    <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white dark:border-slate-900" />
                            <div className="w-6 h-6 rounded-full bg-amber-500 border-2 border-white dark:border-slate-900" />
                            <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white dark:border-slate-900" />
                        </div>
                        <span className="text-sm font-black text-slate-700 dark:text-white">+12 Pays</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
