import { useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";

export default function CanBanner() {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className="bg-gradient-to-r from-[#00853F] via-[#FDEF42] to-[#E31B23] py-2 relative shadow-md z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
                {/* Left Side: Message */}
                <div className="flex items-center gap-3 text-white">
                    <span className="text-2xl animate-bounce">🦁</span>
                    <div className="font-bold text-shadow-sm">
                        <span className="hidden sm:inline">CAN 2025 :</span>
                        <span className="ml-1 text-white text-shadow-black">
                            NextMove Cargo soutient les Lions de la Téranga !
                        </span>
                    </div>
                </div>

                {/* Right Side: CTA or Close */}
                <div className="flex items-center gap-4">
                    <Link
                        to="/register"
                        className="hidden sm:block px-4 py-1 bg-white text-[#00853F] text-xs font-bold rounded-full hover:bg-gray-100 transition-colors shadow-sm whitespace-nowrap"
                    >
                        Soutenir & Expédier 📦
                    </Link>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-black/10"
                        aria-label="Fermer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
