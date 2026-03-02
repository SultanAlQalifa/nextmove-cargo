import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { BookOpen, CheckCircle, Smartphone, Globe, TrendingUp, ArrowRight, Star, Play, Coins, Rocket, Package, ShieldCheck, Zap } from "lucide-react";


import { useState, useEffect, lazy, Suspense } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Academy() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [showDemo, setShowDemo] = useState(false);

    useEffect(() => {
        // Redirect logged-in clients to their dashboard version
        if (user && profile?.role === 'client') {
            navigate('/dashboard/client/academy');
        }
    }, [user, profile, navigate]);

    // TODO: Phase 1 tasks
    // - [x] Élever le niveau visuel de la Landing Page (`Academy.tsx`)
    // - [ ] Transformer le Dashboard Étudiant en "Gladiator HUD 2.0" (`AcademyDashboard.tsx`)
    // If demo mode is active, show the Gladiator Dashboard (Publicly available demo)
    if (showDemo) {
        const AcademyDashboard = lazy(() => import("../components/academy/AcademyDashboard"));
        return (
            <Suspense fallback={<div className="h-screen flex items-center justify-center">Chargement...</div>}>
                <AcademyDashboard />
            </Suspense>
        );
    }
    const modules = [
        {
            title: "Phase 01 : Sourcing de Précision",
            desc: "Dominez Alibaba, 1688 et Shein. Apprenez à identifier les audits d'usine et à négocier comme un pro de Guangzhou.",
            icon: Globe,
            color: "text-blue-400 bg-blue-500/10 border-blue-500/20"
        },
        {
            title: "Phase 02 : Flux Monétaires",
            desc: "Paiements sécurisés (Alipay, WeChat) et optimisation des frais de change. La finance import-export simplifiée.",
            icon: TrendingUp,
            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        },
        {
            title: "Phase 03 : Logistique & Hubs",
            desc: "Maîtrisez le CBM et le fret aérien/maritime. Une intégration directe avec les entrepôts NextMove Cargo.",
            icon: BookOpen,
            color: "text-orange-400 bg-orange-500/10 border-orange-500/20"
        },
        {
            title: "Phase 04 : Domination Digitale",
            desc: "Vendez tout, partout. Stratégies Facebook Ads, TikTok Shop et Branding Premium pour l'Afrique.",
            icon: Smartphone,
            color: "text-purple-400 bg-purple-500/10 border-purple-500/20"
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 font-sans">

            {/* Hero Section - Elite Visual Upgrade */}
            <div className="relative pt-32 pb-24 lg:pt-52 overflow-hidden bg-slate-950">
                {/* Immersive Background Layers */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0A192F] via-[#020617] to-gray-950" />
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_-20%,#1e293b,transparent)] opacity-50" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-orange-500/5 blur-[120px] rounded-full" />
                    <div className="grain-overlay opacity-[0.05]" />
                </div>

                {/* Floating Elite Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{
                            y: [-20, 20, -20],
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.05, 1],
                            opacity: [0.1, 0.2, 0.1]
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-[10%] left-[5%]"
                    >
                        <Coins className="w-32 h-32 text-amber-500 blur-[2px]" />
                    </motion.div>
                    <motion.div
                        animate={{
                            y: [30, -30, 30],
                            rotate: [0, -15, 15, 0],
                            scale: [1.1, 1, 1.1],
                            opacity: [0.1, 0.15, 0.1]
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute top-[20%] right-[8%]"
                    >
                        <Rocket className="w-48 h-48 text-orange-500 blur-[3px]" />
                    </motion.div>
                    <motion.div
                        animate={{
                            scale: [0.8, 1.2, 0.8],
                            opacity: [0.05, 0.1, 0.05]
                        }}
                        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -bottom-20 right-1/4"
                    >
                        <div className="w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]" />
                    </motion.div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-orange-400 font-black text-xs mb-10 shadow-2xl tracking-[0.3em] uppercase"
                    >
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_#f97316]" />
                        Cohorte Elite 2026
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-6xl lg:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9]"
                    >
                        L'École des <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-200 to-orange-500 animate-shimmer bg-[length:200%_auto]">
                            Importateurs d'Élite
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="text-xl lg:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-16 font-medium italic"
                    >
                        Ne soyez plus un simple acheteur. Dominez le sourcing mondial. <br />
                        <span className="text-white font-bold not-italic">NextMove Academy</span> : Votre passeport pour l'indépendance stratégique.
                    </motion.p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <Link
                            to="/register?type=student"
                            className="group relative px-12 py-5 bg-white text-slate-950 rounded-2xl font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative z-10 group-hover:text-white transition-colors uppercase tracking-wider">
                                Rejoindre l'Élite
                            </span>
                        </Link>
                        <button
                            onClick={() => setShowDemo(true)}
                            className="group px-10 py-5 bg-transparent text-white font-black text-lg rounded-2xl border-2 border-white/10 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all flex items-center justify-center gap-3"
                        >
                            <div className="p-2 bg-white/5 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-all">
                                <Play className="w-5 h-5 fill-current" />
                            </div>
                            <span>Accès Démo</span>
                        </button>
                    </div>

                    {/* Trust indicators */}
                    <div className="mt-20 flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6" />
                            <span className="font-bold text-sm tracking-widest uppercase">Certifié Qualiopi</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Globe className="w-6 h-6" />
                            <span className="font-bold text-sm tracking-widest uppercase">Réseau Mondial</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Zap className="w-6 h-6" />
                            <span className="font-bold text-sm tracking-widest uppercase">Expertise IA</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Program Section - Grid Elite Upgrade */}
            <div id="programme" className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <motion.span
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            className="text-orange-600 dark:text-orange-400 font-black text-xs uppercase tracking-[0.4em] mb-4 block"
                        >
                            Curriculum de Puissance
                        </motion.span>
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                            Bâtissez Votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">Empire Stratégique</span>
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium">Un parcours immersif en 4 phases pour passer de l'ombre de la consommation à la lumière de l'importation d'élite.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                        {modules.map((mod, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className={`group relative p-10 rounded-[3rem] bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 hover:border-orange-500/30 transition-all duration-700 overflow-hidden flex flex-col justify-between
                                    ${i === 0 ? "md:col-span-12 lg:col-span-7 min-h-[400px]" :
                                        i === 1 ? "md:col-span-12 lg:col-span-5" :
                                            i === 2 ? "md:col-span-12 lg:col-span-5" :
                                                "md:col-span-12 lg:col-span-7"
                                    }`}
                            >
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute -right-20 -top-20 w-64 h-64 bg-slate-200/20 dark:bg-white/5 blur-[80px] rounded-full group-hover:bg-orange-500/10 transition-all duration-700" />

                                <div>
                                    <div className={`w-16 h-16 rounded-2xl ${mod.color} flex items-center justify-center mb-8 border transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-lg shadow-black/5`}>
                                        <mod.icon className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-6 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors tracking-tight">
                                        {mod.title}
                                    </h3>
                                    <p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                        {mod.desc}
                                    </p>
                                </div>

                                <div className="mt-10 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-black text-[10px] tracking-[0.2em] uppercase">
                                        Exploration <ArrowRight className="w-4 h-4 group-hover:translate-x-3 transition-transform duration-500" />
                                    </div>
                                    <div className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">
                                        Module 0{i + 1}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>


            {/* Journey Sections - Elite Narrative Upgrade */}
            <div className="py-32 bg-white dark:bg-slate-950 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-1/3 h-[1000px] bg-blue-500/5 blur-[150px] -z-0 pointer-events-none" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-40 relative z-10">

                    {/* Section 1: Sourcing */}
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-[0.3em]">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                Phase 01 : Sourcing Elite
                            </div>
                            <h2 className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[0.9] tracking-tighter">
                                Trouvez les <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Maitres Fabricants</span>.
                            </h2>
                            <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                Ne subissez plus les prix du marché local. Apprenez à extraire la valeur à la source. Nous vous ouvrons les portes des usines de Guangzhou et d'Istanbul.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {["Négociation culturelle", "Audit de fiabilité IA", "Paiements sécurisés", "Échantillonnage pro"].map((item, i) => (
                                    <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <CheckCircle className="w-4 h-4 text-blue-500" />
                                        </div>
                                        <span className="font-bold text-sm text-slate-700 dark:text-slate-200">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
                            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", damping: 15 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-orange-500/20 blur-[60px] rounded-[3rem] -z-10" />
                            <div className="relative p-2 bg-white/10 dark:bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/20 shadow-2xl">
                                <img
                                    src="/assets/marketing/academy-gladiators.png"
                                    alt="Sourcing Elite"
                                    className="rounded-[2.5rem] shadow-2xl grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Section 2: Logistique (Reverse) */}
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", damping: 15 }}
                            className="relative order-2 lg:order-1"
                        >
                            <div className="absolute inset-0 bg-gradient-to-bl from-orange-600/20 to-blue-500/20 blur-[60px] rounded-[3rem] -z-10" />
                            <div className="relative p-2 bg-white/10 dark:bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/20 shadow-2xl">
                                <img
                                    src="/assets/marketing/academy-students.png"
                                    alt="Logistique NextMove"
                                    className="rounded-[2.5rem] shadow-2xl grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
                                />
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8 order-1 lg:order-2"
                        >
                            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 font-black text-[10px] uppercase tracking-[0.3em]">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                Phase 02 : Logistique Blindée
                            </div>
                            <h2 className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[0.9] tracking-tighter">
                                Importez Sans <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-500">Zéro Friction</span>.
                            </h2>
                            <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                Le tracking n'est plus un luxe, c'est une arme. Bénéficiez d'une intégration native avec la plateforme NextMove Cargo pour un flux ininterrompu.
                            </p>
                            <ul className="grid grid-cols-1 gap-4">
                                {[
                                    { t: "Tarifs Préférentiels", d: "Prix exclusifs pour les membres Academy." },
                                    { t: "Groupage Sécurisé", d: "Optimisez vos coûts sur chaque CBM importé." },
                                    { t: "Fret Prioritaire", d: "Vos colis passent en tête de liste dans nos Hubs." }
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-4 p-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
                                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                                            <TrendingUp className="w-5 h-5 text-orange-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-900 dark:text-white uppercase text-xs tracking-wider mb-1">{item.t}</h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{item.d}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>

                    {/* Section 3: Scale */}
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 font-black text-[10px] uppercase tracking-[0.3em]">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                                Phase 03 : Domination Digitale
                            </div>
                            <h2 className="text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[0.9] tracking-tighter">
                                Vendez avec <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-500">Impact Maximal</span>.
                            </h2>
                            <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                Sourcing + Logistique + Digital Marketing. La triade du succès. Nous vous apprenons à bâtir une marque que les clients adorent.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                {["Facebook Ads 2.0", "TikTok Empire", "WhatsApp Business Pro", "Branding Elite"].map((tag, i) => (
                                    <span key={i} className="px-5 py-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[10px] uppercase tracking-widest shadow-xl">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 50 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", damping: 15 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 to-indigo-500/20 blur-[60px] rounded-[3rem] -z-10" />
                            <div className="relative p-2 bg-white/10 dark:bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/20 shadow-2xl">
                                <img
                                    src="/assets/marketing/academy-unboxing.png"
                                    alt="Marketing Digital Elite"
                                    className="rounded-[2.5rem] shadow-2xl grayscale-[0.2] hover:grayscale-0 transition-all duration-700"
                                />
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>

            {/* CTA Final - Immersive Elite Exit */}
            <div className="py-32 bg-slate-950 text-center px-4 relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-500/10 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full" />
                    <div className="grain-overlay opacity-[0.05]" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="mb-12 inline-flex items-center gap-3 px-6 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-3xl"
                    >
                        <Star className="w-5 h-5 text-orange-500 fill-current" />
                        <span className="text-white font-black text-xs uppercase tracking-widest leading-none">Rejoignez les 500+ Étudiants Diplômés</span>
                    </motion.div>

                    <h2 className="text-6xl lg:text-8xl font-black text-white mb-10 tracking-tighter leading-[0.85]">
                        Le Futur de <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-200 to-orange-500">Votre Business</span> <br />
                        Commence Ici.
                    </h2>

                    <p className="text-xl lg:text-3xl text-slate-400 mb-16 max-w-3xl mx-auto font-medium leading-relaxed italic">
                        "Ne laissez pas la peur de l'inconnu brider votre ambition. <br />
                        Prenez les commandes de votre destin logistique."
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <Link
                            to="/register?type=student"
                            className="group relative px-16 py-6 bg-white text-slate-950 rounded-[2rem] font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative z-10 group-hover:text-white transition-colors uppercase tracking-widest">
                                Postuler à l'Academy
                            </span>
                        </Link>
                        <div className="text-slate-500 font-bold text-sm tracking-widest uppercase">
                            Prochain départ : <span className="text-white underline decoration-orange-500 decoration-2 underline-offset-4">01 Avril 2026</span>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
