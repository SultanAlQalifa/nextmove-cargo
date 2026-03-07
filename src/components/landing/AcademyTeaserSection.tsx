import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { GraduationCap, ArrowRight } from "lucide-react";

export default function AcademyTeaserSection() {
    return (
        <div className="py-24 bg-white relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-brand-dark rounded-[3rem] p-10 lg:p-16 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12 shadow-2xl">
                    {/* Decorative Pattern */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/connected.png')] opacity-10"></div>

                    <div className="relative z-10 lg:max-w-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-brand-orange flex items-center justify-center text-white shadow-lg shadow-brand-orange/30">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <h2 className="text-brand-orange font-bold uppercase tracking-widest text-sm">NextMove Academy</h2>
                        </div>

                        <h3 className="text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
                            Devenez un expert du Fret International.
                        </h3>
                        <p className="text-lg text-slate-400 font-light leading-relaxed mb-8">
                            Découvrez nos programmes de certification exclusifs en import-export. Formation de niveau Elite, accès direct aux courtiers, et masterclass animées par notre PDG.
                        </p>

                        <Link
                            to="/academy"
                            className="inline-flex items-center font-bold text-white hover:text-brand-orange transition-colors group"
                        >
                            Découvrir les formations <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative z-10 w-full lg:w-96 aspect-square"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-orange to-brand-blue rounded-full opacity-30 blur-3xl mix-blend-screen"></div>
                        <img
                            src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop"
                            alt="Academy"
                            className="w-full h-full object-cover rounded-[2rem] border-2 border-white/10 shadow-2xl skew-y-3 transform-gpu hover:skew-y-0 transition-transform duration-500"
                        />
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
