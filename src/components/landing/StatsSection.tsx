import { motion } from "framer-motion";
import { Users, Globe, Package, Star } from "lucide-react";
import { useEffect, useState } from "react";

const Counter = ({ value, label, icon: Icon, delay }: any) => {
    const [count, setCount] = useState("0");

    useEffect(() => {
        // Simple mock animation for numbers
        let start = 0;
        const end = parseFloat(value.replace(/[^0-9.]/g, ''));
        const isDecimal = value.includes('.');
        const suffix = value.replace(/[0-9.]/g, '');

        if (end === 0) {
            setCount(value);
            return;
        }

        const duration = 2000;
        const incrementTime = (duration / end) > 50 ? 50 : (duration / end);

        const timer = setInterval(() => {
            start += end / (duration / incrementTime);
            if (start >= end) {
                clearInterval(timer);
                setCount(value);
            } else {
                if (isDecimal) {
                    setCount(start.toFixed(1) + suffix);
                } else {
                    setCount(Math.floor(start).toLocaleString() + suffix);
                }
            }
        }, incrementTime);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay }}
            className="flex flex-col items-center text-center p-8 lg:p-10 rounded-3xl bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-2 transition-transform duration-300 group"
        >
            <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 text-brand-orange flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Icon size={32} />
            </div>
            <div className="text-4xl lg:text-5xl font-black text-brand-dark mb-2 tracking-tight">
                {count}
            </div>
            <div className="text-slate-500 font-bold uppercase tracking-widest text-xs lg:text-sm">
                {label}
            </div>
        </motion.div>
    );
};

export default function StatsSection() {
    const stats = [
        { label: "Utilisateurs Actifs", value: "129+", icon: Users },
        { label: "Pays Couverts", value: "4", icon: Globe },
        { label: "Expéditions en Transit", value: "12482", icon: Package },
        { label: "Taux de Réussite", value: "99.8%", icon: Star },
    ];

    return (
        <div className="py-24 relative z-40 bg-brand-light">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((stat, idx) => (
                        <Counter key={idx} {...stat} delay={idx * 0.15} />
                    ))}
                </div>
            </div>
        </div>
    );
}
