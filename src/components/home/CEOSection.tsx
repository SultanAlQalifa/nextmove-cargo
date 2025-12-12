import { Quote } from "lucide-react";

export default function CEOSection() {
    return (
        <section className="py-24 bg-slate-50 dark:bg-slate-900 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-6xl mx-auto bg-white dark:bg-slate-800 rounded-[3rem] shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
                    <div className="grid md:grid-cols-2 gap-0">
                        {/* Image Side */}
                        <div className="relative h-96 md:h-auto min-h-[400px] overflow-hidden group">
                            <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                            {/* Note: Placeholder image - User needs to provide actual photo */}
                            <img
                                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800"
                                alt="PDG NextMove Cargo"
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 to-transparent z-20">
                                <h3 className="text-2xl font-bold text-white">Cheikh Abdoul Khadre Djeylani Djitte</h3>
                                <p className="text-white/80 font-medium">PDG & Fondateur</p>
                            </div>
                        </div>

                        {/* Content Side */}
                        <div className="p-12 md:p-16 flex flex-col justify-center relative">
                            <Quote className="w-16 h-16 text-primary/10 absolute top-10 right-10" />

                            <div className="space-y-6 relative z-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold w-fit">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                    Le mot du PDG
                                </div>

                                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight">
                                    "Réinventer la logistique pour l'Afrique de demain."
                                </h2>

                                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                                    Chez NextMove Cargo, notre vision dépasse le simple transport de marchandises. Nous bâtissons des ponts numériques entre l'Europe, l'Asie et l'Afrique pour permettre à chaque entrepreneur, chaque commerçant et chaque particulier de prospérer sans frontières.
                                </p>

                                <p className="text-base text-slate-500 dark:text-slate-400">
                                    Notre engagement est simple : transparence totale, rapidité inégalée et une sécurité absolue. Bienvenue dans la nouvelle ère de la logistique.
                                </p>

                                <div className="pt-6">
                                    {/* Signature (Text or Image) */}
                                    <div className="text-2xl font-handwriting text-primary font-bold opacity-80 rotate-[-2deg]">
                                        C.A.K.D. Djitte
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
