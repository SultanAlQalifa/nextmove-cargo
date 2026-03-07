import { motion } from "framer-motion";

export default function GlobalMapSection() {
    const hubs = [
        { name: "Dakar", pos: "top-[45%] left-[45%]", highlight: true },
        { name: "Abidjan", pos: "top-[52%] left-[47%]", highlight: false },
        { name: "Douala", pos: "top-[54%] left-[51%]", highlight: false },
        { name: "Pékin", pos: "top-[35%] left-[80%]", highlight: false },
        { name: "Paris", pos: "top-[25%] left-[48%]", highlight: false },
        { name: "Dubaï", pos: "top-[40%] left-[62%]", highlight: false }
    ];

    return (
        <div className="py-32 bg-slate-950 relative overflow-hidden border-t border-white/5">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-blue/10 via-slate-950 to-slate-950"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-4xl mx-auto mb-20">
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl lg:text-6xl font-black text-white mb-6 tracking-tight leading-tight"
                    >
                        Nous connectons l'Afrique au <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-sky-400">Reste du Monde</span>.
                    </motion.h3>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-slate-400 font-light"
                    >
                        Une infrastructure globale conçue pour la rapidité, la fiabilité et la transparence.
                    </motion.p>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="relative w-full aspect-[2/1] max-w-5xl mx-auto"
                >
                    {/* World map background placeholder (SVG dots or static image) */}
                    <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-no-repeat bg-center bg-contain filter invert"></div>

                    {/* Hubs */}
                    {hubs.map((hub, idx) => (
                        <div
                            key={idx}
                            className={`absolute z-20 flex flex-col items-center group cursor-pointer ${hub.pos}`}
                        >
                            <div className="relative">
                                <div className={`w-3 h-3 rounded-full ${hub.highlight ? 'bg-brand-orange' : 'bg-brand-blue'} shadow-lg shadow-current`}></div>
                                <div className={`absolute inset-0 rounded-full ${hub.highlight ? 'bg-brand-orange' : 'bg-brand-blue'} animate-ping opacity-75`}></div>
                            </div>
                            <div className="absolute top-4 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 text-white text-xs font-bold whitespace-nowrap">
                                {hub.name}
                            </div>
                        </div>
                    ))}

                    {/* Animated connections could be drawn here with SVG paths */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30" preserveAspectRatio="none">
                        {/* Example Curve from Pekin to Dakar */}
                        <path d="M 80% 35% Q 60% 10% 45% 45%" fill="none" stroke="url(#gradient-blue)" strokeWidth="2" strokeDasharray="5,5" className="animate-[dash_20s_linear_infinite]" />
                        <path d="M 48% 25% Q 40% 35% 45% 45%" fill="none" stroke="url(#gradient-orange)" strokeWidth="2" strokeDasharray="5,5" className="animate-[dash_10s_linear_infinite]" />

                        <defs>
                            <linearGradient id="gradient-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#1A56FF" stopOpacity="0" />
                                <stop offset="100%" stopColor="#1A56FF" stopOpacity="1" />
                            </linearGradient>
                            <linearGradient id="gradient-orange" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#FF5C00" stopOpacity="0" />
                                <stop offset="100%" stopColor="#FF5C00" stopOpacity="1" />
                            </linearGradient>
                        </defs>
                    </svg>
                </motion.div>
            </div>

            <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -1000;
          }
        }
      `}</style>
        </div>
    );
}
