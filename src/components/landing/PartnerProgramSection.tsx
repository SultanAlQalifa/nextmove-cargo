import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Briefcase, ArrowRight, UserPlus } from "lucide-react";

export default function PartnerProgramSection() {
    return (
        <div className="py-24 bg-brand-light relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-brand-orange font-bold uppercase tracking-widest text-sm mb-4"
                    >
                        Rejoignez-nous
                    </motion.h2>
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl lg:text-5xl font-black text-brand-dark mb-6 tracking-tight"
                    >
                        Un réseau où <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-red-500">tout le monde</span> gagne.
                    </motion.h3>
                </div>

                <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Client Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-[2.5rem] p-10 lg:p-14 border border-slate-100 shadow-[0_20px_60px_rgb(0,0,0,0.04)] relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 transform group-hover:scale-110 transition-transform duration-700">
                            <Briefcase className="w-40 h-40 text-brand-dark" />
                        </div>

                        <div className="w-16 h-16 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center mb-8">
                            <UserPlus size={32} />
                        </div>
                        <h4 className="text-3xl font-black text-brand-dark mb-4">Je suis un Client</h4>
                        <p className="text-slate-600 font-light text-lg mb-8 leading-relaxed">
                            Vous avez des marchandises à expédier ? Publiez vos besoins en quelques clics, recevez des offres compétitives et payez en toute sécurité.
                        </p>

                        <ul className="space-y-4 mb-10">
                            {['Offres garanties sous 24h', 'Paiement sécurisé Escrow', 'Suivi de livraison en temps réel'].map((item, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-slate-700 font-medium">
                                    <div className="w-2 h-2 rounded-full bg-brand-blue"></div>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <Link
                            to="/register"
                            className="inline-flex w-full sm:w-auto items-center justify-center px-8 py-4 text-base font-bold rounded-xl text-white bg-brand-blue hover:bg-blue-700 shadow-lg shadow-brand-blue/20 transition-all hover:-translate-y-1"
                        >
                            Expédier maintenant <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </motion.div>

                    {/* Forwarder Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="bg-brand-dark rounded-[2.5rem] p-10 lg:p-14 border border-white/5 shadow-[0_20px_60px_rgb(0,0,0,0.2)] relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-brand-orange/20 via-transparent to-transparent opacity-50"></div>
                        <div className="absolute top-0 right-0 p-8 opacity-10 transform group-hover:scale-110 transition-transform duration-700">
                            <Briefcase className="w-40 h-40 text-white" />
                        </div>

                        <div className="w-16 h-16 rounded-2xl bg-brand-orange/20 text-brand-orange flex items-center justify-center mb-8 border border-brand-orange/30">
                            <Briefcase size={32} />
                        </div>
                        <h4 className="text-3xl font-black text-white mb-4">Je suis Transitaire</h4>
                        <p className="text-slate-400 font-light text-lg mb-8 leading-relaxed">
                            Développez votre volume d'affaires. Accédez à des milliers de demandes qualifiées et soyez garanti d'être payé à chaque livraison.
                        </p>

                        <ul className="space-y-4 mb-10">
                            {['Accès illimité aux RFQs', 'Paiement 100% garanti', 'Gestion simplifiée des expéditions'].map((item, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-slate-300 font-medium">
                                    <div className="w-2 h-2 rounded-full bg-brand-orange"></div>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <Link
                            to="/become-forwarder"
                            className="inline-flex w-full sm:w-auto items-center justify-center px-8 py-4 text-base font-bold rounded-xl text-brand-dark bg-brand-orange hover:bg-orange-600 hover:text-white shadow-lg shadow-brand-orange/20 transition-all hover:-translate-y-1"
                        >
                            Devenir Partenaire <ArrowRight className="ml-2 w-5 h-5" />
                        </Link>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
