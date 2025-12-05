import Calculator from '../components/Calculator';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Clock, TrendingUp, Star, CheckCircle, Zap, Globe, Award } from 'lucide-react';

export default function CalculatorPage() {
    const { t } = useTranslation();

    const benefits = [
        {
            icon: Zap,
            title: "Devis Instantanés",
            desc: "Obtenez des estimations précises en moins de 30 secondes grâce à notre algorithme IA.",
            color: "blue"
        },
        {
            icon: ShieldCheck,
            title: "Prix Garantis",
            desc: "Pas de frais cachés. Le prix affiché est le prix que vous payez, douane incluse.",
            color: "emerald"
        },
        {
            icon: Globe,
            title: "Réseau Global",
            desc: "Accès aux meilleurs transitaires vérifiés pour la Chine, la Turquie et l'Europe.",
            color: "indigo"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 font-sans">
            {/* Hero Section */}
            <div className="relative pt-32 pb-48 lg:pt-48 lg:pb-80 overflow-hidden">
                {/* Background Image & Gradient */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1494412574643-35d324698420?q=80&w=2070&auto=format&fit=crop"
                        alt="Logistics Calculator"
                        className="w-full h-full object-cover scale-105 animate-in fade-in duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/80 to-slate-50 dark:to-gray-950" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                        </span>
                        <span className="text-sm font-medium text-blue-100 tracking-wide uppercase">Estimateur IA en Temps Réel</span>
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-bold text-white mb-8 leading-tight tracking-tight max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        {t('calculator.pageTitle')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">en quelques secondes</span>
                    </h1>

                    <p className="text-xl text-slate-300 leading-relaxed font-light max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
                        {t('calculator.pageSubtitle')}
                    </p>
                </div>
            </div>

            {/* Floating Calculator Section */}
            <div className="relative z-20 -mt-64 pb-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                    <Calculator />
                </div>
            </div>

            {/* Benefits Section */}
            <div className="py-24 bg-white dark:bg-gray-900 border-t border-slate-100 dark:border-gray-800 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-20">
                        <h2 className="text-blue-600 font-bold tracking-widest uppercase text-sm mb-4">Pourquoi nous choisir</h2>
                        <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6">La précision au service de votre logistique</h2>
                        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-light">
                            Optimisez vos coûts d'importation avec l'outil le plus précis du marché.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {benefits.map((benefit, idx) => (
                            <div key={idx} className="group p-10 rounded-[2.5rem] bg-slate-50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 border border-slate-100 dark:border-gray-700 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform duration-300 group-hover:scale-110 ${benefit.color === 'blue' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                    benefit.color === 'emerald' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                        'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                                    }`}>
                                    <benefit.icon size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{benefit.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg">
                                    {benefit.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-24 pt-12 border-t border-slate-100 dark:border-gray-800">
                        <div className="flex flex-wrap justify-center gap-12 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                            <div className="flex items-center gap-3 text-slate-400 hover:text-blue-600 transition-colors font-bold text-xl group cursor-default">
                                <Award className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                <span>Top Transitaire 2024</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-400 hover:text-green-600 transition-colors font-bold text-xl group cursor-default">
                                <ShieldCheck className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                <span>Paiement Sécurisé</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-400 hover:text-yellow-500 transition-colors font-bold text-xl group cursor-default">
                                <Star className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                <span>4.9/5 Avis Clients</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
