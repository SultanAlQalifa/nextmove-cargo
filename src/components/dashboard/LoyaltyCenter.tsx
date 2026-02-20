import { motion } from 'framer-motion';
import {
    Crown, Star, Gift, ArrowRightLeft, Send,
    ChevronRight, TrendingUp, ShieldCheck
} from 'lucide-react';

interface LoyaltyCenterProps {
    points: number;
    tier: string;
    pointValue: number;
    onConvert: () => void;
    onTransfer: () => void;
}

export default function LoyaltyCenter({ points, tier, pointValue, onConvert, onTransfer }: LoyaltyCenterProps) {
    const nextTierPoints = 5000;
    const progress = Math.min((points / nextTierPoints) * 100, 100);

    const getTierColor = (t: string) => {
        switch (t.toLowerCase()) {
            case 'gold': return 'from-yellow-400 to-amber-600';
            case 'silver': return 'from-slate-300 to-slate-500';
            default: return 'from-orange-400 to-orange-700';
        }
    };

    return (
        <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Score Card */}
            <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl">
                <div className="grain-overlay opacity-[0.05]" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-blue-500/20 transition-colors duration-700"></div>

                <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className={`inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r ${getTierColor(tier)} text-white text-[10px] font-black uppercase tracking-[0.2em] mb-4 shadow-lg`}>
                                <Crown className="w-3 h-3 mr-2" />
                                Membre {tier}
                            </div>
                            <h2 className="text-4xl font-black tracking-tight mb-2">Votre Récompense</h2>
                            <p className="text-slate-400 text-sm max-w-xs">Chaque expédition vous rapproche de nouveaux avantages premium.</p>
                        </div>

                        <div className="relative w-32 h-32">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="64" cy="64" r="58"
                                    fill="transparent"
                                    stroke="rgba(255,255,255,0.05)"
                                    strokeWidth="8"
                                />
                                <motion.circle
                                    cx="64" cy="64" r="58"
                                    fill="transparent"
                                    stroke="url(#gradient)"
                                    strokeWidth="8"
                                    strokeDasharray={364.4}
                                    initial={{ strokeDashoffset: 364.4 }}
                                    animate={{ strokeDashoffset: 364.4 - (364.4 * progress) / 100 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    strokeLinecap="round"
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#8b5cf6" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black">{points}</span>
                                <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Pts</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                            <span>Progression Tier</span>
                            <span className="text-blue-400">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, delay: 0.5 }}
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-3 italic">
                            Encore {nextTierPoints - points} points pour devenir membre Silver.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <button
                            onClick={onConvert}
                            className="flex items-center justify-center gap-3 py-4 bg-white text-slate-900 rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl"
                        >
                            <ArrowRightLeft size={18} /> Convertir
                        </button>
                        <button
                            onClick={onTransfer}
                            className="flex items-center justify-center gap-3 py-4 bg-slate-800 text-white rounded-2xl font-black text-sm border border-white/10 hover:bg-slate-700 transition-all"
                        >
                            <Send size={18} /> Offrir
                        </button>
                    </div>
                </div>
            </div>

            {/* Side Stats Card */}
            <div className="space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-slate-100 dark:border-white/5 shadow-xl relative overflow-hidden">
                    <div className="grain-overlay opacity-[0.02]" />
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valeur Cash</div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white">
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(points * pointValue)}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                                <ShieldCheck size={14} className="text-emerald-500" /> Sécurisé
                            </div>
                            <ChevronRight size={14} className="text-slate-300" />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-600 dark:text-slate-400">
                                <Star size={14} className="text-amber-500" /> Multiplicateur x1.2
                            </div>
                            <ChevronRight size={14} className="text-slate-300" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden group">
                    <div className="grain-overlay opacity-[0.05]" />
                    <Gift className="absolute -right-4 -bottom-4 w-24 h-24 text-white/10 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                    <h3 className="font-black text-lg mb-2">Parrainez & Gagnez</h3>
                    <p className="text-white/70 text-xs mb-4 leading-relaxed">Invitez vos partenaires et recevez 500 points bonus dès leur première expédition.</p>
                    <button className="w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-xs font-black uppercase tracking-widest transition-all">
                        Inviter maintenant
                    </button>
                </div>
            </div>
        </div>
    );
}
