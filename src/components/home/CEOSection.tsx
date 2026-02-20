import { Quote } from "lucide-react";
import { motion } from "framer-motion";

export default function CEOSection() {
    return (
        <section className="py-32 bg-slate-50 dark:bg-slate-950 relative overflow-hidden">
            {/* Soft Ambient Radiance */}
            <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <div className="container mx-auto px-6 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-6xl mx-auto glass-card-premium rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-white/5"
                >
                    <div className="grid md:grid-cols-2 gap-0">
                        {/* Image Side */}
                        <div className="relative h-96 md:h-auto min-h-[500px] overflow-hidden group">
                            <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-colors duration-700 z-10"></div>
                            <motion.img
                                initial={{ scale: 1.1 }}
                                whileInView={{ scale: 1 }}
                                transition={{ duration: 1.5 }}
                                src="/assets/ceo.jpg"
                                alt="Cheikh Abdoul Khadre Djeylani Djitte - PDG NextMove Cargo"
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000 object-top"
                                loading="lazy"
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent z-20">
                                <h3 className="text-3xl font-black text-white tracking-tight">C.A.K.D. Djitte</h3>
                                <p className="text-blue-400 font-bold uppercase tracking-[0.2em] text-xs">PDG & Fondateur</p>
                            </div>
                        </div>

                        {/* Content Side */}
                        <div className="p-16 md:p-24 flex flex-col justify-center relative">
                            <Quote className="w-24 h-24 text-primary/5 absolute top-12 right-12" />

                            <div className="space-y-10 relative z-10">
                                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.3em] w-fit">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                                    Vision Elite
                                </div>

                                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight tracking-tighter">
                                    "Le Nexus Logistique de l'Afrique <span className="text-gradient">Nouvelle</span>."
                                </h2>

                                <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed italic font-light">
                                    "NextMove Cargo ne transporte pas simplement des conteneurs ; nous pilotons la connectivité du continent. En fusionnant la puissance du fret multimodal avec l'intelligence digitale, nous construisons un Nexus où chaque marchandise circule sans friction."
                                </p>

                                <div className="flex items-center gap-6 pt-6">
                                    {/* Signature */}
                                    <div className="text-4xl font-handwriting text-primary/80 rotate-[-3deg] select-none">
                                        C.A.K.Djitte
                                    </div>
                                    <div className="h-px w-20 bg-slate-200 dark:bg-slate-800"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
