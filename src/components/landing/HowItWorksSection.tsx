import { motion } from "framer-motion";
import { FileText, CreditCard, PackageCheck } from "lucide-react";

export default function HowItWorksSection() {
    const steps = [
        {
            num: "01",
            title: "Créez votre demande (RFQ)",
            desc: "Indiquez les dimensions, le poids et la destination de votre fret. Les prestataires recevront une alerte instantanée.",
            icon: FileText
        },
        {
            num: "02",
            title: "Comparez & Payez",
            desc: "Recevez les offres sous 24h. Choisissez le meilleur rapport délai/prix et effectuez un paiement Escrow via Wave, CinetPay ou Virement.",
            icon: CreditCard
        },
        {
            num: "03",
            title: "Acceptez la livraison",
            desc: "Le prestataire met à jour la progression et dépose l'avis de livraison. Confirmez pour libérer les fonds en toute sécurité.",
            icon: PackageCheck
        }
    ];

    return (
        <div className="py-32 bg-brand-dark relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-24">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-brand-orange font-bold uppercase tracking-widest text-sm mb-4"
                    >
                        Le Processus
                    </motion.h2>
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight"
                    >
                        Comment ça marche ?
                    </motion.h3>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-400 font-light"
                    >
                        3 étapes simples pour transformer vos opérations logistiques.
                    </motion.p>
                </div>

                <div className="relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden lg:block absolute top-[60px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-brand-orange/10 via-brand-orange/50 to-brand-orange/10"></div>

                    <div className="grid lg:grid-cols-3 gap-16 lg:gap-8">
                        {steps.map((step, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.2 }}
                                className="relative flex flex-col items-center text-center group"
                            >
                                {/* Step Number Badge */}
                                <div className="absolute -top-4 -right-2 lg:right-1/4 bg-brand-orange text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg shadow-brand-orange/30 z-20">
                                    {step.num}
                                </div>

                                <div className="w-32 h-32 rounded-full bg-slate-900 border border-white/5 flex items-center justify-center mb-10 relative z-10 shadow-2xl transition-transform duration-500 group-hover:scale-110 group-hover:bg-brand-orange/10 group-hover:border-brand-orange/30">
                                    <div className="absolute inset-0 rounded-full border border-brand-orange/20 scale-110 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-700"></div>
                                    <step.icon size={40} className="text-brand-orange group-hover:text-brand-orange drop-shadow-lg" />
                                </div>

                                <h4 className="text-3xl font-black text-white mb-4 tracking-tight">{step.title}</h4>
                                <p className="text-slate-400 leading-relaxed font-light text-lg">
                                    {step.desc}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
