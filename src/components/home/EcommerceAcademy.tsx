import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShoppingBag, Globe, ArrowRight, BookOpen, Truck } from "lucide-react";

export default function EcommerceAcademy() {
    const platforms = [
        { name: "Alibaba", color: "bg-[#FF6A00]", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Alibaba_com.png/600px-Alibaba_com.png", x: -120, y: -80, delay: 0 },
        { name: "Shein", color: "bg-black", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/SHEIN_logo.svg/2560px-SHEIN_logo.svg.png", x: 140, y: -60, delay: 1.5 },
        { name: "1688", color: "bg-[#FF4400]", logo: "https://upload.wikimedia.org/wikipedia/commons/3/3c/1688_logo.png", x: -80, y: 100, delay: 0.5 },
        { name: "AliExpress", color: "bg-[#E62E04]", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/8/85/AliExpress_logo.svg/1024px-AliExpress_logo.svg.png", x: 100, y: 80, delay: 2 },
        { name: "Amazon", color: "bg-white", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1024px-Amazon_logo.svg.png", x: 0, y: -130, delay: 1 },
        { name: "Shopify", color: "bg-[#95BF47]", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Shopify_logo_2018.svg/1024px-Shopify_logo_2018.svg.png", x: 0, y: 130, delay: 2.5 },
    ];

    return (
        <div className="py-32 bg-slate-50 dark:bg-gray-950 relative overflow-hidden border-t border-slate-200 dark:border-white/5">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-transparent opacity-50"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-20 items-center">

                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8 text-center lg:text-left"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-[0.3em] border border-orange-200 dark:border-orange-500/20">
                            <BookOpen className="w-3 h-3" /> NextMove Academy
                        </div>

                        <h2 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                            Devenez un Pro de <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                                l'Import Vendeur
                            </span>
                        </h2>

                        <p className="text-xl text-slate-500 dark:text-slate-400 font-light leading-relaxed max-w-2xl mx-auto lg:mx-0">
                            Ne vous limitez pas au transport. Maîtrisez l'art d'acheter intelligemment sur
                            <span className="font-bold text-slate-800 dark:text-slate-200"> Alibaba, 1688, Shein</span> et lancez un business e-commerce rentable en Afrique.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-4">
                            <Link
                                to="/academy"
                                className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-2xl text-white overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl shadow-orange-500/30"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 transition-colors" />
                                <span className="relative z-10 flex items-center">
                                    Rejoindre l'Académie
                                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Link>
                        </div>

                        <div className="flex items-center justify-center lg:justify-start gap-8 pt-6 opacity-70">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <ShoppingBag className="w-4 h-4" /> Sourcing
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <Truck className="w-4 h-4" /> Logistics
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <Globe className="w-4 h-4" /> Sales
                            </div>
                        </div>

                    </motion.div>

                    {/* Right Content - Visual Animation */}
                    <div className="relative h-[500px] flex items-center justify-center">
                        {/* Center Hub */}
                        <motion.div
                            className="relative z-20 w-32 h-32 rounded-full bg-white dark:bg-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(255,255,255,0.05)] flex items-center justify-center border-4 border-slate-100 dark:border-slate-700"
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                            <motion.div
                                className="relative z-10 p-2 bg-white dark:bg-slate-800 rounded-full"
                                animate={{ y: [-5, 5, -5] }}
                                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                            >
                                <img src="/assets/icons/icon-192.webp" alt="NextMove Cargo" className="w-20 h-20 object-contain rounded-xl" />
                            </motion.div>

                            {/* Orbit Rings */}
                            <div className="absolute inset-0 -m-12 border border-slate-200 dark:border-slate-700 rounded-full opacity-50 animate-[spin_10s_linear_infinite]" />
                            <div className="absolute inset-0 -m-24 border border-slate-200 dark:border-slate-700/50 rounded-full opacity-30 animate-[spin_15s_linear_infinite_reverse]" />
                            <div className="absolute inset-0 -m-36 border border-slate-200 dark:border-slate-700/30 rounded-full opacity-20 animate-[spin_20s_linear_infinite]" />
                        </motion.div>

                        {/* Floating Platform Bubbles */}
                        {platforms.map((platform, i) => (
                            <motion.div
                                key={i}
                                className={`absolute z-10 w-24 h-24 rounded-full ${platform.color} shadow-xl flex items-center justify-center border-4 border-white dark:border-slate-800 cursor-pointer overflow-hidden p-4`}
                                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                whileInView={{
                                    opacity: 1,
                                    scale: 1,
                                    x: platform.x,
                                    y: platform.y
                                }}
                                viewport={{ once: true }}
                                transition={{
                                    delay: platform.delay * 0.2,
                                    type: "spring",
                                    stiffness: 100
                                }}
                            >
                                <motion.div
                                    className="w-full h-full flex items-center justify-center"
                                    animate={{
                                        y: [-10, 10, -10],
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 3 + i,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <img
                                        src={platform.logo}
                                        alt={platform.name}
                                        className="w-full h-full object-contain drop-shadow-md brightness-0 invert"
                                        onError={(e) => {
                                            // Amazon logo needs original colors (force remove invert)
                                            if (platform.name === 'Amazon') {
                                                (e.target as HTMLImageElement).classList.remove('brightness-0', 'invert');
                                            }
                                            // Fallback to text if image fails
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }}
                                        onLoad={(e) => {
                                            if (platform.name === 'Amazon') {
                                                (e.target as HTMLImageElement).classList.remove('brightness-0', 'invert');
                                            }
                                        }}
                                    />
                                    <span className="hidden text-[10px] font-black text-white">{platform.name}</span>
                                </motion.div>
                            </motion.div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
}
