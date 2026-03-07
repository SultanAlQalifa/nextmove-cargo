import { motion } from "framer-motion";

export default function SocialProofSection() {
    const logos = [
        { name: "CinetPay", url: "https://upload.wikimedia.org/wikipedia/commons/4/41/Cinetpay_logo.png" },
        { name: "Wave", url: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Wave_logo.png" },
        { name: "Orange Money", url: "https://upload.wikimedia.org/wikipedia/commons/5/5c/Orange_logo.svg" },
        { name: "MTN MoMo", url: "https://upload.wikimedia.org/wikipedia/commons/9/93/MTN_Logo.svg" }
    ];

    return (
        <div className="py-16 bg-brand-light border-y border-slate-200 overflow-hidden relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <p className="text-center text-sm font-bold uppercase tracking-widest text-slate-400 mb-8">
                    Ils nous font confiance & Intégrations
                </p>

                {/* Simple Marquee for Logos */}
                <div className="flex overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-brand-light to-transparent z-10"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-brand-light to-transparent z-10"></div>

                    <motion.div
                        animate={{ x: [0, -1000] }}
                        transition={{
                            x: { repeat: Infinity, repeatType: "loop", duration: 30, ease: "linear" }
                        }}
                        className="flex items-center gap-16 md:gap-32 w-max"
                    >
                        {[...logos, ...logos, ...logos].map((logo, idx) => (
                            <div key={idx} className="flex items-center justify-center w-32 h-12 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                                <img src={logo.url} alt={logo.name} className="max-h-12 max-w-full object-contain" />
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
