import { motion } from "framer-motion";
import { Shield, CheckCircle, CreditCard, Wallet } from "lucide-react";

export default function PaymentSolutions() {
    const paymentMethods = [
        { name: "Wave", logo: "/assets/wave-icon.png", color: "from-blue-400/20" },
        { name: "Orange Money", logo: "/assets/om-logo.png", color: "from-orange-500/20" },
        { name: "CinetPay", logo: "/assets/cinetpay-logo.png", color: "from-indigo-500/20" },
        { name: "MTN MoMo", logo: "/assets/mtn-logo.png", color: "from-yellow-500/20" },
        { name: "Free Money", logo: "/assets/free-money-logo.png", color: "from-red-500/20" }
    ];

    return (
        <section className="py-32 bg-transparent relative overflow-hidden font-sans">
            {/* Soft Ambient Radiance */}
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-24 items-center">
                    {/* Left: Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black text-[10px] tracking-[0.2em] uppercase">
                            <Shield className="w-4 h-4" /> Global Security Standards
                        </div>

                        <h2 className="text-5xl lg:text-7xl font-black text-quantum-gradient leading-[0.9] tracking-tighter">
                            Local Wallets. <br />
                            <span className="text-accent-gradient">Global Trust.</span>
                        </h2>

                        <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed font-light">
                            NextMove Cargo sécurise chaque transaction grâce à notre système d'Escrow. Vos fonds ne sont libérés qu'après confirmation de la livraison, éliminant tout risque pour les clients et les prestataires.
                        </p>

                        <div className="space-y-6 pt-4">
                            {[
                                { title: "Escrow Logic", desc: "Payments are held in a secure container until delivery confirmation." },
                                { title: "Multi-Wallet Hub", desc: "Seamlessly pay with Orange Money, Wave, Free, and more." },
                                { title: "Automated Dispute Resolution", desc: "Smart-contract inspired arbitration for every shipment." }
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4 p-6 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
                                    <div className="mt-1 p-3 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-slate-100 font-black text-lg tracking-tight">{item.title}</h4>
                                        <p className="text-slate-500 font-light">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right: Logos & Cards */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                            {paymentMethods.map((method, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -10 }}
                                    className={`aspect-square rounded-[2rem] p-8 flex items-center justify-center quantum-card relative group overflow-hidden`}
                                >
                                    <div className={`absolute inset-0 bg-gradient-to-br ${method.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                    <div className="relative group z-10">
                                        <img
                                            src={method.logo}
                                            alt={method.name}
                                            className="w-full h-auto object-contain max-h-16 filter brightness-0 invert opacity-50 group-hover:opacity-100 group-hover:brightness-100 group-hover:invert-0 transition-all duration-700"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${method.name}&background=6366f1&color=fff&size=256`;
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                            <div className="aspect-square rounded-[2rem] quantum-card bg-indigo-600/10 p-8 flex flex-col items-center justify-center text-center group">
                                <Wallet className="w-10 h-10 mb-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                                <span className="font-black uppercase tracking-widest text-[10px] text-slate-400">And more...</span>
                            </div>
                        </div>

                        {/* Floating Security Badge */}
                        <div className="absolute -bottom-10 right-10 quantum-card p-6 rounded-3xl border border-white/10 shadow-3xl flex items-center gap-4 animate-float">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="font-black text-slate-100">100% Secured</div>
                                <div className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">NMC Escrow Protection</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
