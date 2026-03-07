import { motion } from "framer-motion";
import { Quote } from "lucide-react";

export default function CEOSection() {
    return (
        <div className="py-32 relative bg-brand-dark overflow-hidden">
            {/* Texture Background */}
            <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-blue/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">

                    {/* Image */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-brand-orange/20 to-transparent rounded-[2.5rem] blur-2xl transform -rotate-3 scale-105"></div>
                        <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 aspect-[4/5] lg:aspect-square">
                            {/* Note: Placeholder image, to be replaced by actual CEO photo */}
                            <img
                                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop"
                                alt="PDG NextMove Cargo"
                                className="w-full h-full object-cover grayscale opacity-90 hover:grayscale-0 transition-all duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent"></div>

                            <div className="absolute bottom-10 left-10">
                                <h4 className="text-3xl font-black text-white px-2">Sultan Al-Qalifa</h4>
                                <p className="text-brand-orange font-bold uppercase tracking-widest text-sm mt-1 px-2">Fondateur & PDG</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Citation */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        <Quote className="w-16 h-16 text-brand-orange/40" />

                        <h3 className="text-3xl md:text-4xl lg:text-5xl font-light text-white leading-tight">
                            "L'Afrique de l'Ouest n'est pas seulement une destination de plus sur la carte mondiale du commerce. C'est le <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-orange-400">cœur battant</span> de l'économie de demain."
                        </h3>

                        <p className="text-lg text-slate-400 leading-relaxed font-light">
                            Notre vision avec NextMove Cargo a toujours été simple mais ambitieuse : bâtir un pont numérique robuste et transparent entre le continent africain et les pôles industriels asiatiques et européens. Nous avons éliminé la friction et supprimé les risques avec notre technologie Escrow. La confiance n'est plus une promesse, c'est une garantie encodée dans notre plateforme.
                        </p>

                        <div className="pt-8">
                            {/* Optional Signature Styling */}
                            <div className="font-serif italic text-3xl text-white/50">S. Al-Qalifa</div>
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
}
