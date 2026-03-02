import { motion } from "framer-motion";
import { LucideIcon, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardBannerProps {
    title: string;
    description: string;
    badge?: string;
    icon?: LucideIcon;
    action?: {
        label: string;
        to?: string;
        onClick?: () => void;
        icon?: LucideIcon;
    };
    variant?: "primary" | "warning" | "success";
    size?: "sm" | "md" | "lg";
}

export default function DashboardBanner({
    title,
    description,
    badge,
    icon: Icon,
    action,
    variant = "primary",
    size = "lg"
}: DashboardBannerProps) {
    const gradients = {
        primary: "from-[#0A192F] via-[#112240] to-[#16213E]",
        warning: "from-amber-500 via-orange-600 to-amber-700",
        success: "from-emerald-500 via-teal-600 to-emerald-700",
    };

    const sizes = {
        sm: "p-6 md:p-8 rounded-[1.5rem] mb-6",
        md: "p-8 md:p-10 rounded-[2rem] mb-8",
        lg: "p-8 md:p-12 rounded-[2.5rem] mb-10"
    };

    const containerVariants: any = {
        initial: { opacity: 0, scale: 0.98, y: 10 },
        animate: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.08
            }
        },
        hover: {
            y: -2,
            transition: { duration: 0.3, ease: "easeOut" }
        }
    };

    const itemVariants: any = {
        initial: { opacity: 0, x: -15 },
        animate: { opacity: 1, x: 0, transition: { duration: 0.4 } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            className={`relative overflow-hidden bg-gradient-to-br ${gradients[variant]} ${sizes[size]} text-white shadow-2xl shadow-black/40 group border border-white/10`}
        >
            {/* Dynamic Background Elements with Parallax-like motion */}
            <motion.div
                animate={{
                    scale: [1, 1.15, 1],
                    rotate: [0, 3, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 right-0 -mr-20 -mt-20 w-[35rem] h-[35rem] bg-white/10 rounded-full blur-[100px] mix-blend-overlay opacity-30 pointer-events-none"
            />

            {/* Mesh Gradient Effect */}
            <div className="absolute inset-0 opacity-20 mix-blend-soft-light pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02] mix-blend-overlay pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-12">
                <div className="flex-1 text-center lg:text-left">
                    {badge && (
                        <motion.div
                            variants={itemVariants}
                            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-[9px] font-black uppercase tracking-[0.25em] text-white/90 mb-6 shadow-xl`}
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                            <Sparkles className="w-3 h-3" />
                            {badge}
                        </motion.div>
                    )}

                    <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8">
                        {Icon && (
                            <motion.div
                                variants={itemVariants}
                                whileHover={{ rotate: 8, scale: 1.05 }}
                                className={`w-16 h-16 md:w-20 md:h-20 rounded-[1.8rem] bg-gradient-to-br from-white/25 to-white/5 backdrop-blur-2xl border border-white/25 flex items-center justify-center mx-auto lg:mx-0 shadow-2xl ring-1 ring-white/40`}
                            >
                                <Icon className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-lg" />
                            </motion.div>
                        )}
                        <motion.div variants={itemVariants} className="flex-1">
                            <h1 className={`${size === "sm" ? "text-2xl md:text-3xl" : "text-3xl md:text-5xl"} font-black tracking-tighter mb-2 uppercase leading-none drop-shadow-2xl`}>
                                {title}
                            </h1>
                            <p className={`max-w-xl text-white/90 ${size === "sm" ? "text-xs md:text-sm" : "text-sm md:text-lg"} font-medium leading-relaxed drop-shadow-sm`}>
                                {description}
                            </p>
                        </motion.div>
                    </div>
                </div>

                {action && (
                    <motion.div
                        variants={itemVariants}
                        className="relative group/action"
                    >
                        {/* Glow effect for button */}
                        <div className="absolute -inset-1 bg-white/20 rounded-2xl blur opacity-0 group-hover/action:opacity-50 transition duration-500" />

                        {action.to ? (
                            <Link
                                to={action.to}
                                className="relative flex items-center gap-3 px-8 py-4 md:px-10 md:py-5 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-2xl hover:bg-slate-50 transition-all active:scale-95"
                            >
                                {action.icon && <action.icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />}
                                {action.label}
                                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover/action:translate-x-2 transition-transform duration-300" />
                            </Link>
                        ) : (
                            <button
                                onClick={action.onClick}
                                className="relative flex items-center gap-3 px-8 py-4 md:px-10 md:py-5 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-2xl hover:bg-slate-50 transition-all active:scale-95"
                            >
                                {action.icon && <action.icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />}
                                {action.label}
                                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover/action:translate-x-2 transition-transform duration-300" />
                            </button>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Aesthetic Detail: Animated Pulse Line */}
            <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-0 h-[3px] w-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
            />
        </motion.div>
    );
}
