import { Crown, Star, Gift, TrendingUp, History } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import { useAuth } from "../../../contexts/AuthContext";

export default function LoyaltyDashboard() {
    const { profile } = useAuth();
    const points = profile?.loyalty_points || 0;
    const nextTier = points < 2000 ? 2000 : points < 5000 ? 5000 : 10000;
    const progress = Math.min((points / nextTier) * 100, 100);

    return (
        <div className="space-y-8 pb-12">
            <PageHeader
                title="Programme de Fidélité"
                subtitle="Gagnez des points à chaque expédition et débloquez des avantages exclusifs."
            />

            {/* Hero Card */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                                <Crown className="w-6 h-6 text-yellow-300" fill="currentColor" />
                            </div>
                            <span className="font-bold text-lg bg-white/10 px-3 py-1 rounded-full border border-white/20">
                                Statut {profile?.tier || "Bronze"}
                            </span>
                        </div>
                        <h2 className="text-5xl font-bold mb-2">{points} <span className="text-2xl font-medium text-indigo-200">pts</span></h2>
                        <p className="text-indigo-100 max-w-md">
                            Il vous manque {nextTier - points} points pour atteindre le niveau supérieur et bénéficier de réductions sur vos prochaines expéditions.
                        </p>
                    </div>

                    <div className="w-full md:w-1/3 bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10">
                        <div className="flex justify-between text-sm mb-2 font-medium">
                            <span>Progression</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-3 bg-indigo-900/50 rounded-full overflow-hidden">
                            {/* eslint-disable-next-line react/forbid-dom-props */}
                            <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="flex justify-between text-xs mt-2 text-indigo-200">
                            <span>{points} pts</span>
                            <span>{nextTier} pts</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <Gift className="w-8 h-8 text-purple-500 mb-4" />
                    <h3 className="font-bold text-lg mb-2">Récompenses</h3>
                    <p className="text-slate-500 text-sm">Échangez vos points contre des réductions directes sur vos factures de transport.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <TrendingUp className="w-8 h-8 text-emerald-500 mb-4" />
                    <h3 className="font-bold text-lg mb-2">Bonus Multiplicateur</h3>
                    <p className="text-slate-500 text-sm">Les membres Gold gagnent 1.5x plus de points sur chaque expédition.</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <Star className="w-8 h-8 text-amber-500 mb-4" />
                    <h3 className="font-bold text-lg mb-2">Service Prioritaire</h3>
                    <p className="text-slate-500 text-sm">Traitement prioritaire de vos demandes et support dédié 24/7.</p>
                </div>
            </div>

            {/* History Table Placeholder */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <History className="w-5 h-5 text-slate-400" />
                    <h3 className="font-bold text-slate-900">Historique des points</h3>
                </div>
                <div className="p-12 text-center text-slate-500">
                    Aucun historique de points disponible pour le moment.
                </div>
            </div>
        </div>
    );
}
