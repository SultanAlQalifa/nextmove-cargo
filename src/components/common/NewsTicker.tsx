import { useState, useEffect } from "react";
import { forwarderService, ForwarderOption } from "../../services/forwarderService";
import { Zap, ExternalLink } from "lucide-react";

export default function NewsTicker() {
    const [partners, setPartners] = useState<ForwarderOption[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPartners = async () => {
            try {
                const data = await forwarderService.getAllActiveForwarders();
                // Filter those who have a logo, or just take first 10
                setPartners(data.filter(p => p.logo || p.website_url).slice(0, 10));
            } catch (error) {
                console.error("Failed to load ticker partners", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPartners();
    }, []);

    return (
        <div className="fixed bottom-0 left-0 w-full bg-slate-900/95 backdrop-blur-md text-white h-10 flex items-center z-40 border-t border-slate-800 shadow-lg">

            {/* Label Section */}
            <div className="bg-primary h-full px-4 flex items-center gap-2 font-bold text-xs uppercase tracking-wider min-w-fit shadow-lg z-20 relative">
                <Zap className="w-3 h-3 fill-white animate-pulse" />
                <span className="hidden sm:inline">Flash Info</span>
            </div>

            {/* Marquee Section */}
            <div className="flex-1 overflow-hidden relative h-full flex items-center">
                <div className="whitespace-nowrap animate-marquee flex items-center gap-8 text-xs font-medium text-slate-300">
                    <span>Bienvenue sur NextMove Cargo – Votre partenaire logistique global.</span>
                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                    <span>Obtenez des cotations instantanées pour vos expéditions Aériennes et Maritimes.</span>
                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                    <span>Nouveaux partenaires certifiés disponibles !</span>
                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                    <span>Service client disponible 24/7 pour vos besoins urgents.</span>
                </div>
            </div>

            {/* Partners Section (Right) */}
            {partners.length > 0 && (
                <div className="hidden md:flex items-center gap-4 h-full px-4 bg-slate-900/50 backdrop-blur-sm border-l border-slate-800 z-20 min-w-fit">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Nos Partenaires</span>
                    <div className="flex items-center gap-2">
                        {partners.map((partner) => (
                            partner.website_url ? (
                                <a
                                    key={partner.id}
                                    href={partner.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 hover:border-primary transition-colors overflow-hidden relative group"
                                    title={partner.name}
                                >
                                    {partner.logo ? (
                                        <img src={partner.logo} alt={partner.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-[8px] font-bold text-slate-400 group-hover:text-primary">
                                            {partner.name.charAt(0)}
                                        </span>
                                    )}
                                    {/* Hover indicator */}
                                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <ExternalLink className="w-3 h-3 text-white" />
                                    </div>
                                </a>
                            ) : (
                                <div
                                    key={partner.id}
                                    className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden opacity-50 cursor-default"
                                    title={partner.name}
                                >
                                    {partner.logo ? (
                                        <img src={partner.logo} alt={partner.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-[8px] font-bold text-slate-500">
                                            {partner.name.charAt(0)}
                                        </span>
                                    )}
                                </div>
                            )
                        ))}
                    </div>
                </div>
            )}

            <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
        </div>
    );
}
