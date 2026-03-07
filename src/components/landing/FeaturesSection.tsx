import { motion } from "framer-motion";
import { ShieldCheck, CheckCircle, Truck, Globe } from "lucide-react";

export default function FeaturesSection() {
    const features = [
        {
            title: "Paiement Escrow Sécurisé",
            desc: "Votre argent est bloqué en sécurité dans notre système. Le prestataire n'est payé que lorsque vous confirmez la bonne réception de la marchandise.",
            icon: ShieldCheck,
            color: "text-brand-orange",
            bgHover: "hover:border-brand-orange/40",
        },
        {
            title: "Prestataires Certifiés KYC",
            desc: "Chaque transitaire est rigoureusement vérifié (CNI, RCCM, Fiscalité). Seuls les professionnels légalement constitués accèdent à notre marché.",
            icon: CheckCircle,
            color: "text-brand-blue",
            bgHover: "hover:border-brand-blue/40",
        },
        {
            title: "Suivi Multimodal en Direct",
            desc: "Aérien, maritime ou terrestre. Suivez l'évolution de vos colis en temps réel, depuis l'entrepôt en Asie/Europe jusqu'à votre réseau en Afrique.",
            icon: Truck,
            color: "text-emerald-500",
            bgHover: "hover:border-emerald-500/40",
        },
        {
            title: "Réseau Afrique-Monde",
            desc: "Connectez-vous à un hub logistique global avec des routes maritimes et aériennes optimisées spécifiquement pour l'import-export vers l'Afrique de l'Ouest.",
            icon: Globe,
            color: "text-sky-400",
            bgHover: "hover:border-sky-400/40",
        }
    ];

    return (
        <div className="py-32 bg-brand-dark/95 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-brand-orange font-bold uppercase tracking-widest text-sm mb-4"
                    >
                        Pourquoi NextMove Cargo ?
                    </motion.h2>
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight"
                    >
                        Un écosystème conçu pour votre <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-sky-400">sécurité</span>.
                    </motion.h3>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-400 font-light leading-relaxed"
                    >
                        Fini les incertitudes et les paiements risqués. Notre technologie garantit une confiance absolue et une exécution irréprochable entre clients et prestataires de fret.
                    </motion.p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className={`p-10 rounded-[2rem] bg-white/5 backdrop-blur-xl border border-white/10 ${feature.bgHover} transition-all duration-300 group hover:-translate-y-1 shadow-2xl shadow-black/50`}
                        >
                            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:bg-white/10 shadow-inner">
                                <feature.icon size={32} className={`${feature.color} opacity-90 group-hover:opacity-100 drop-shadow-lg`} />
                            </div>
                            <h4 className="text-2xl font-bold text-white mb-4 tracking-tight">{feature.title}</h4>
                            <p className="text-slate-400 leading-relaxed font-light text-lg">
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
