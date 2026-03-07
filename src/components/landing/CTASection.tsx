import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, PlaneTakeoff } from "lucide-react";

export default function CTASection() {
    return (
        <div className="bg-brand-orange relative overflow-hidden">
            {/* Dynamic Background Pattern */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/always-grey.png')] opacity-10 mix-blend-multiply"></div>

            {/* Decorative large icon */}
            <PlaneTakeoff className="absolute -top-10 -right-10 w-[400px] h-[400px] text-white/10 transform rotate-12 pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 relative z-10">
                <div className="max-w-3xl">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-4xl lg:text-6xl font-black text-white mb-6 tracking-tight leading-tight"
                    >
                        Prêt à propulser votre logistique vers l'avenir ?
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-brand-dark/80 font-medium mb-10 max-w-xl"
                    >
                        Rejoignez des centaines d'entreprises qui ont déjà fait le choix de la sécurité, de la transparence et de la rapidité.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col sm:flex-row gap-4"
                    >
                        <Link
                            to="/register"
                            className="inline-flex items-center justify-center px-8 py-4 text-lg font-black rounded-xl text-brand-orange bg-white hover:bg-slate-50 shadow-2xl shadow-black/20 transition-all hover:-translate-y-1 hover:scale-105"
                        >
                            Créer un compte <ArrowRight className="ml-2 w-6 h-6" />
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Bottom transition arc */}
            <div className="absolute -bottom-1 left-0 right-0 w-full overflow-hidden leading-none z-30 transform translate-y-[1px]">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="block w-full h-8 lg:h-12 filter drop-shadow-sm">
                    <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="fill-brand-dark"></path>
                    <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="fill-brand-dark"></path>
                    <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="fill-brand-dark"></path>
                </svg>
            </div>
        </div>
    );
}
