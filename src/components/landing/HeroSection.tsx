import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Play, ShieldCheck } from "lucide-react";

export default function HeroSection() {
    return (
        <div className="relative min-h-screen flex items-center overflow-hidden bg-brand-dark">
            {/* Abstract Backgrounds */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-orange/10 via-brand-dark to-black"></div>
                {/* Subtle grid pattern */}
                <style>{`
                  .bg-grid-pattern {
                    background-image: linear-gradient(#f97316 1px, transparent 1px), linear-gradient(90deg, #f97316 1px, transparent 1px);
                    background-size: 40px 40px;
                  }
                `}</style>
                <div className="absolute inset-0 opacity-[0.03] bg-grid-pattern"></div>
                {/* Glowing orb */}
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-brand-orange/20 rounded-full blur-[120px] pointer-events-none"></div>
            </div>

            <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 w-full">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Content */}
                    <div className="space-y-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-orange/30 bg-brand-orange/10 text-brand-orange text-xs font-bold uppercase tracking-widest backdrop-blur-sm"
                        >
                            <div className="w-2 h-2 rounded-full bg-brand-orange animate-pulse"></div>
                            LANCEMENT OFFICIEL 2026
                        </motion.div>

                        <div className="min-h-[220px]">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <h1 className="text-5xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight mb-6">
                                    La Logistique{" "}
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-orange-400">
                                        Sans Frontières.
                                    </span>
                                </h1>
                                <p className="text-xl text-slate-400 leading-relaxed font-light max-w-lg">
                                    Simplifiez vos imports-exports avec une expertise logistique de pointe, du point de départ jusqu'à votre porte.
                                </p>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="flex flex-col sm:flex-row gap-5"
                        >
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl text-white bg-brand-orange hover:bg-orange-600 shadow-lg shadow-brand-orange/20 transition-all hover:-translate-y-1"
                            >
                                Créer un compte gratuit <ArrowRight className="ml-2 w-5 h-5" />
                            </Link>
                            <Link
                                to="/contact"
                                className="inline-flex items-center justify-center px-8 py-4 text-base font-bold rounded-xl text-white bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-sm transition-all hover:-translate-y-1"
                            >
                                <Play className="mr-2 w-5 h-5 fill-current text-white/70" /> Demander une démo
                            </Link>
                        </motion.div>

                        {/* Trust indicators */}
                        <div className="pt-8 flex items-center gap-8 border-t border-white/10">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div
                                        key={i}
                                        className="w-10 h-10 rounded-full border-2 border-brand-dark bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400"
                                    >
                                        U{i}
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm text-slate-400 font-medium">
                                Rejoint par plus de{" "}
                                <span className="text-white font-bold">129+ entreprises</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Visual Image */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="hidden lg:block relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-orange/20 to-transparent rounded-[3rem] blur-3xl transform rotate-3 scale-105"></div>
                        <img
                            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop"
                            alt="Cargo Global"
                            className="relative z-10 w-full rounded-[2rem] border border-white/10 shadow-2xl object-cover h-[600px] brightness-75 contrast-125"
                        />

                        {/* Floating Badge Escrow */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="absolute top-10 -left-10 z-20 bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl hover:border-brand-orange/30 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-brand-orange flex items-center justify-center text-white shadow-lg shadow-brand-orange/30">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-white font-bold tracking-tight">Paiement Garanti</div>
                                    <div className="text-brand-orange text-sm font-medium uppercase tracking-wider">Escrow Sécurisé</div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Floating Badge Colis */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="absolute bottom-10 -right-10 z-20 bg-brand-dark/80 backdrop-blur-xl border border-white/10 p-6 rounded-2xl shadow-2xl hover:border-brand-blue/30 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <div className="text-white text-sm font-bold tracking-tight flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-brand-orange animate-pulse"></span>
                                        Livraison en cours
                                    </div>
                                    <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
                                        <div className="w-[85%] h-full bg-brand-orange rounded-full"></div>
                                    </div>
                                    <div className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-1">Colis Livré à 85%</div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Curvy bottom transition */}
            <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-30 transform translate-y-[1px]">
                <svg
                    viewBox="0 0 1200 120"
                    preserveAspectRatio="none"
                    className="block w-full h-12 lg:h-24 filter drop-shadow-sm"
                >
                    <path
                        d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C52.16,112.92,106.67,119.5,159.2,118.91C221.73,118.23,277.9,103.54,321.39,56.44Z"
                        className="fill-brand-light dark:fill-brand-light"
                    ></path>
                </svg>
            </div>
        </div>
    );
}
