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
        <div className="py-32 bg-slate-50 dark:bg-slate-950 relative overflow-hidden border-t border-slate-200 dark:border-white/5">
            {/* Ultra-Soft Ambient Glows */}
            <div className="absolute top-1/2 left-0 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[140px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[140px] translate-x-1/3 translate-y-1/3 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-24 items-center">

                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-10 text-center lg:text-left"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-[0.3em] border border-orange-200 dark:border-orange-500/20">
                            <BookOpen className="w-4 h-4" /> NextMove Academy
                        </div>

                        <h2 className="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white leading-tight tracking-tighter">
                            Devenez un Pro de <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-orange-600">
                                l'Import Vendeur
                            </span>
                        </h2>

                        <p className="text-xl text-slate-500 dark:text-slate-400 font-light leading-relaxed max-w-2xl mx-auto lg:mx-0">
                            Ne vous limitez pas au transport. Maîtrisez l'art d'acheter intelligemment sur
                            <span className="font-bold text-slate-800 dark:text-slate-200"> Alibaba, 1688, Shein</span> et lancez un business e-commerce rentable en Afrique grâce à notre formation certifiante.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start pt-4">
                            <Link
                                to="/academy"
                                className="group relative inline-flex items-center justify-center px-10 py-5 text-lg font-black rounded-2xl text-white overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-orange-500/20"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 transition-transform duration-500 group-hover:scale-110" />
                                <span className="relative z-10 flex items-center gap-3">
                                    Rejoindre l'Académie
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
                                </span>
                            </Link>
                        </div>

                        <div className="grid grid-cols-3 gap-6 pt-10 opacity-60">
                            {[
                                { icon: ShoppingBag, label: "Sourcing" },
                                { icon: Truck, label: "Logistique" },
                                { icon: Globe, label: "Ventes" }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col items-center lg:items-start gap-2">
                                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20 text-orange-600">
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{item.label}</span>
                                </div>
                            ))}
                        </div>

                    </motion.div>

                    {/* Right Content - Visual Animation */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative h-[600px] flex items-center justify-center"
                    >
                        {/* Center Hub */}
                        <div
                            className="relative z-20 w-40 h-40 rounded-full glass-card-premium flex items-center justify-center border-4 border-white/50 dark:border-white/5 shadow-2xl"
                        >
                            <motion.div
                                className="relative z-10 p-3 bg-white dark:bg-slate-900 rounded-3xl shadow-xl"
                                animate={{ y: [-8, 8, -8], rotate: [-2, 2, -2] }}
                                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                            >
                                <img src="/assets/icons/icon-192.webp" alt="NextMove Cargo" className="w-20 h-20 object-contain" />
                            </motion.div>

                            {/* Orbit Rings */}
                            <div className="absolute inset-0 -m-16 border border-orange-500/20 rounded-full animate-[spin_12s_linear_infinite]" />
                            <div className="absolute inset-0 -m-32 border border-orange-500/10 rounded-full animate-[spin_18s_linear_infinite_reverse]" />
                            <div className="absolute inset-0 -m-48 border border-orange-500/5 rounded-full animate-[spin_24s_linear_infinite]" />
                        </div>

                        {/* Floating Platform Bubbles */}
                        {platforms.map((platform, i) => (
                            <motion.div
                                key={i}
                                className={`absolute z-10 w-28 h-28 rounded-[2rem] ${platform.color} shadow-2xl flex items-center justify-center border-4 border-white dark:border-slate-800 cursor-pointer overflow-hidden p-5 group`}
                                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                whileInView={{
                                    opacity: 1,
                                    scale: 1,
                                    x: platform.x * 1.2,
                                    y: platform.y * 1.2
                                }}
                                viewport={{ once: true }}
                                transition={{
                                    delay: platform.delay * 0.15,
                                    type: "spring",
                                    stiffness: 80,
                                    damping: 12
                                }}
                                whileHover={{ scale: 1.1, zIndex: 30 }}
                            >
                                <motion.div
                                    className="w-full h-full flex items-center justify-center"
                                    animate={{
                                        y: [-12, 12, -12],
                                        rotate: [i % 2 === 0 ? -3 : 3, i % 2 === 0 ? 3 : -3, i % 2 === 0 ? -3 : 3]
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 4 + i,
                                        ease: "easeInOut"
                                    }}
                                >
                                    <img
                                        src={platform.logo}
                                        alt={platform.name}
                                        className="w-full h-full object-contain drop-shadow-lg brightness-0 invert transition-all group-hover:brightness-100 group-hover:invert-0"
                                        onError={(e) => {
                                            if (platform.name === 'Amazon') {
                                                (e.target as HTMLImageElement).classList.remove('brightness-0', 'invert');
                                            }
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                                        }}
                                        onLoad={(e) => {
                                            if (platform.name === 'Amazon') {
                                                (e.target as HTMLImageElement).classList.remove('brightness-0', 'invert');
                                            }
                                        }}
                                    />
                                    <span className="hidden text-xs font-black text-white">{platform.name}</span>
                                </motion.div>
                            </motion.div>
                        ))}
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
