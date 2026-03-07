import { motion } from "framer-motion";
import { Check, ShieldCheck } from "lucide-react";

export default function PaymentSection() {
    const paymentMethods = [
        { name: "Wave", color: "bg-blue-500 text-white" },
        { name: "Orange Money", color: "bg-orange-500 text-white" },
        { name: "CinetPay", color: "bg-emerald-500 text-white" },
        { name: "MTN MoMo", color: "bg-yellow-400 text-slate-900" },
        { name: "Free Money", color: "bg-red-500 text-white" },
        { name: "Virement Bancaire", color: "bg-slate-800 text-white" }
    ];

    return (
        <div className="py-24 bg-brand-light relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-blue/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <div>
                            <h2 className="text-brand-blue font-bold uppercase tracking-widest text-sm mb-4">Paiements Intégrés</h2>
                            <h3 className="text-4xl lg:text-5xl font-black text-brand-dark mb-6 tracking-tight leading-tight">
                                Payez comme <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-red-500">vous voulez</span>, où vous voulez.
                            </h3>
                            <p className="text-xl text-slate-600 font-light leading-relaxed">
                                Notre infrastructure est conçue pour la réalité des affaires en Afrique. Utilisez le mobile money ou les cartes bancaires en toute simplicité.
                            </p>
                        </div>

                        <ul className="space-y-4 pt-4">
                            {[
                                "Transactions 100% garanties par notre compte Escrow sécurisé.",
                                "Déblocage des fonds uniquement après confirmation de livraison.",
                                "Traitement instantané pour ne jamais retarder une expédition."
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-start gap-4">
                                    <div className="mt-1 flex-shrink-0 w-6 h-6 rounded-full bg-brand-orange/10 flex items-center justify-center">
                                        <Check className="w-4 h-4 text-brand-orange font-bold" />
                                    </div>
                                    <span className="text-lg text-slate-700 font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        {/* Visual Glass Card representing Escrow */}
                        <div className="bg-white/80 backdrop-blur-2xl border border-slate-200 p-8 lg:p-12 rounded-[2.5rem] shadow-[0_20px_60px_rgb(0,0,0,0.06)] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8">
                                <ShieldCheck className="w-24 h-24 text-brand-orange/10 transform rotate-12" />
                            </div>

                            <h4 className="text-xl font-bold text-slate-900 mb-8 tracking-tight">Moyens de paiement supportés</h4>

                            <div className="grid grid-cols-2 gap-4">
                                {paymentMethods.map((method, idx) => (
                                    <motion.div
                                        key={idx}
                                        whileHover={{ scale: 1.05 }}
                                        className={`p-4 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm ${method.color}`}
                                    >
                                        {method.name}
                                    </motion.div>
                                ))}
                            </div>

                            <div className="mt-10 p-5 bg-brand-dark rounded-2xl flex items-center justify-between text-white">
                                <div>
                                    <div className="text-sm text-slate-400 font-medium">Protection Escrow</div>
                                    <div className="font-bold tracking-widest mt-1 text-lg">ACTIF</div>
                                </div>
                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
                                    <ShieldCheck className="w-6 h-6 text-brand-orange" />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
