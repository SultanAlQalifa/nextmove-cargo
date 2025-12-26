import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { BookOpen, CheckCircle, Smartphone, Globe, TrendingUp, ArrowRight, Star, Play, Coins, Rocket, Package } from "lucide-react";


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
            title: "Module 1 : Les Fondamentaux du Sourcing",
            desc: "Comprendre Alibaba, 1688 et Shein. Comment trouver les 'vrais' fournisseurs et éviter les intermédiaires.",
            icon: Globe,
            color: "bg-blue-50 text-blue-600"
        },
        {
            title: "Module 2 : Négociation & Paiement",
            desc: "Les techniques pour réduire les prix de 20%. Payer en sécurité depuis l'Afrique (Alipay, WeChat Pay).",
            icon: TrendingUp,
            color: "bg-green-50 text-green-600"
        },
        {
            title: "Module 3 : Logistique & Douane (NextMove)",
            desc: "Tout comprendre sur le CBM, le poids volu, et comment ne jamais perdre un colis avec NextMove Cargo.",
            icon: BookOpen,
            color: "bg-orange-50 text-orange-600"
        },
        {
            title: "Module 4 : Vendre en Ligne (E-commerce)",
            desc: "Créer une boutique pro sur WhatsApp Business, Facebook Ads et TikTok pour écouler vos stocks rapidement.",
            icon: Smartphone,
            color: "bg-purple-50 text-purple-600"
        }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 font-sans">

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 lg:pt-48 overflow-hidden bg-[#fafafa] dark:bg-gray-950">
                <div className="absolute inset-0 bg-white dark:bg-slate-950 -z-10">
                </div>

                {/* Floating Animations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{ y: [-10, 10, -10], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-20 left-[10%] opacity-20 dark:opacity-10"
                    >
                        <Coins className="w-24 h-24 text-amber-500" />
                    </motion.div>
                    <motion.div
                        animate={{ y: [15, -15, 15], rotate: [0, -10, 5, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute top-40 right-[15%] opacity-20 dark:opacity-10"
                    >
                        <Rocket className="w-32 h-32 text-orange-500" />
                    </motion.div>
                    <motion.div
                        animate={{ y: [-20, 20, -20] }}
                        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                        className="absolute bottom-20 left-[5%] opacity-10"
                    >
                        <Package className="w-40 h-40 text-blue-500" />
                    </motion.div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-bold text-sm mb-8 border border-orange-200/50 shadow-sm"
                    >
                        <Star className="w-4 h-4 fill-current" /> Nouvelle Cohorte 2026
                    </motion.div>

                    <h1 className="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">
                        L'École des <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-600">Importateurs d'Élite</span>.
                    </h1>

                    <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed mb-12">
                        Ne soyez plus un simple acheteur. Devenez un expert du sourcing en Chine et Turquie.
                        NextMove Academy vous donne les clés pour bâtir un <span className="font-bold text-slate-900 dark:text-white">empire e-commerce</span> depuis l'Afrique.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            to="/register?type=student"
                            className="group relative px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-1 transition-all overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 -skew-x-12 -translate-x-full" />
                            <span className="relative">M'inscrire à la liste d'attente</span>
                        </Link>
                        <button
                            onClick={() => setShowDemo(true)}
                            className="px-8 py-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-lg rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50 dark:hover:bg-slate-800/80 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                        >
                            <Play className="w-5 h-5 fill-current" /> Démo "Gladiateur"
                        </button>
                    </div>
                </div>
            </div>

            {/* Program Section */}
            <div id="programme" className="py-24 bg-white dark:bg-gray-950">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Un Programme Conçu pour le Succès</h2>
                        <p className="text-slate-500">4 modules intensifs pour passer de débutant à expert.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {modules.map((mod, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group relative p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-orange-200 dark:hover:border-orange-900/50 shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-orange-50/50 dark:to-orange-900/10 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className={`relative w-16 h-16 rounded-2xl ${mod.color} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 shadow-sm`}>
                                    <mod.icon className="w-8 h-8" />
                                </div>
                                <h3 className="relative text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                    {mod.title}
                                </h3>
                                <p className="relative text-slate-500 dark:text-slate-400 leading-relaxed text-lg">
                                    {mod.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>


            {/* Journey Sections (Text + Visuals) */}
            <div className="py-24 bg-white dark:bg-gray-950 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">

                    {/* Section 1: Sourcing */}
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-6"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase">
                                Étape 01 : Sourcing de Précision
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                                Trouvez les <span className="text-blue-600">Meilleurs Fournisseurs</span> Sans Intermédiaires.
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                                Nous vous enseignons comment naviguer sur Alibaba, 1688 et Shein comme un pro. Apprenez à vérifier les audits d'usine, à négocier les prix et à obtenir des échantillons de qualité avant de commander en gros.
                            </p>
                            <ul className="space-y-4">
                                {["Négociation culturelle chinoise", "Vérification des licences d'usine", "Paiement sécurisé Alipay/WeChat"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                                        <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                                            <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                            viewport={{ once: true }}
                            className="relative"
                        >

                            <img
                                src="/assets/marketing/academy-gladiators.png"
                                alt="Sourcing en Chine"
                                className="relative rounded-[2.5rem] shadow-2xl border-4 border-white dark:border-slate-800 z-10"
                            />
                        </motion.div>
                    </div>

                    {/* Section 2: Logistique (Reverse) */}
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                            viewport={{ once: true }}
                            className="relative order-2 lg:order-1"
                        >

                            <img
                                src="/assets/marketing/academy-students.png"
                                alt="Logistique NextMove"
                                className="relative rounded-[2.5rem] shadow-2xl border-4 border-white dark:border-slate-800 z-10"
                            />
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-6 order-1 lg:order-2"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-bold text-xs uppercase">
                                Étape 02 : Logistique Blindée
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                                Importez Sans <span className="text-orange-500">Stress</span> avec Nos Entrepôts.
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                                Bénéficiez d'une intégration directe avec NextMove Cargo. Suivez vos colis en temps réel depuis nos entrepôts de Guangzhou et Istanbul jusqu'à votre porte au Sénégal.
                            </p>
                            <ul className="space-y-4">
                                {["Tarifs préférentiels étudiants", "Groupage sécurisé", "Dédouanement pris en charge"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                                        <div className="w-5 h-5 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                                            <CheckCircle className="w-3.5 h-3.5 text-orange-600" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>

                    {/* Section 3: Scale */}
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="space-y-6"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-bold text-xs uppercase">
                                Étape 03 : Domination du Marché
                            </div>
                            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                                Dominez la Vente <span className="text-purple-600">Digitale</span> en Afrique.
                            </h2>
                            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                                Le sourcing n'est que la moitié du travail. Nous vous apprenons à écouler vos stocks via Facebook Ads, TikTok Shop et WhatsApp Business pour maximiser vos profits.
                            </p>
                            <ul className="space-y-4">
                                {["Ads Conversion Haute", "Branding irrésistible", "Gestion de stock & Cashflow"].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-medium">
                                        <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                                            <CheckCircle className="w-3.5 h-3.5 text-purple-600" />
                                        </div>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 30 }}
                            whileInView={{ opacity: 1, scale: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="relative"
                        >

                            <img
                                src="/assets/marketing/academy-unboxing.png"
                                alt="Marketing Digital"
                                className="relative rounded-[2.5rem] shadow-2xl border-4 border-white dark:border-slate-800 z-10"
                            />
                        </motion.div>
                    </div>

                </div>
            </div>

            {/* CTA Final */}
            <div className="py-24 bg-slate-900 text-center px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-[100px] -z-0" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -z-0" />

                <div className="relative z-10 max-w-4xl mx-auto">
                    <h2 className="text-4xl lg:text-6xl font-black text-white mb-8">
                        Prêt à devenir un <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">Importateur d'Élite</span> ?
                    </h2>
                    <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
                        Le prochain départ est proche. Ne laissez pas passer cette opportunité de transformer votre vie et votre business.
                    </p>
                    <Link
                        to="/register?type=student"
                        className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-2xl font-black text-xl shadow-2xl shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all"
                    >
                        Rejoindre la NextMove Academy <ArrowRight className="w-6 h-6" />
                    </Link>
                </div>
            </div>
        </div >
    );
}
