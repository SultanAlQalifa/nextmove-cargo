import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

export default function TestimonialsSection() {
    const testimonials = [
        {
            name: "Jean-Pierre Kouakou",
            role: "Importateur, Abidjan",
            content: "Depuis que j'utilise NextMove Cargo, je n'ai plus peur de me faire arnaquer. Le système Escrow est une libération. Je dors enfin sur mes deux oreilles quand ma marchandise est en mer.",
            avatar: "https://i.pravatar.cc/150?u=jeanpierre",
            rating: 5
        },
        {
            name: "Sarah Diop",
            role: "Gérante E-commerce, Dakar",
            content: "L'interface est claire, l'équipe support est toujours là. Mon transitaire habituel m'a rejoint sur la plateforme, et on gère tout de manière transparente.",
            avatar: "https://i.pravatar.cc/150?u=sarah",
            rating: 5
        },
        {
            name: "Alioune Kane",
            role: "Transitaire Certifié, Dubaï-Dakar",
            content: "Pour nous les professionnels de la logistique, c'est l'outil parfait. Gain de temps énorme sur la prospection et paiement garanti à 100% dès la livraison.",
            avatar: "https://i.pravatar.cc/150?u=alioune",
            rating: 5
        }
    ];

    return (
        <div className="py-24 bg-brand-dark relative">
            <div className="absolute inset-0 bg-gradient-to-b from-brand-dark via-slate-900 to-brand-dark"></div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-brand-orange font-bold uppercase tracking-widest text-sm mb-4"
                    >
                        Avis Clients
                    </motion.h2>
                    <motion.h3
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl lg:text-5xl font-black text-white mb-6 tracking-tight"
                    >
                        Ceux qui l'utilisent en <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-red-500">parlent le mieux</span>.
                    </motion.h3>
                </div>

                <div className="grid md:grid-cols-3 gap-8 text-white">
                    {testimonials.map((testi, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white/5 backdrop-blur-md rounded-3xl p-8 border border-white/10 relative group hover:border-brand-orange/30 transition-colors"
                        >
                            <Quote className="absolute top-6 right-6 w-12 h-12 text-white/5 group-hover:text-brand-orange/10 transition-colors" />

                            <div className="flex items-center gap-1 mb-6 text-brand-orange">
                                {[...Array(testi.rating)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-current" />
                                ))}
                            </div>

                            <p className="text-slate-300 font-light leading-relaxed mb-8 relative z-10">
                                "{testi.content}"
                            </p>

                            <div className="flex items-center gap-4 mt-auto">
                                <img
                                    src={testi.avatar}
                                    alt={testi.name}
                                    className="w-12 h-12 rounded-full border-2 border-brand-orange/50 object-cover"
                                />
                                <div>
                                    <h4 className="font-bold text-white text-sm">{testi.name}</h4>
                                    <p className="text-slate-500 text-xs uppercase tracking-wider">{testi.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
