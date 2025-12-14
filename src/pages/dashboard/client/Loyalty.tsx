import { useState } from "react";
import { Crown, Star, Gift, TrendingUp, History, X } from "lucide-react";
import PageHeader from "../../../components/common/PageHeader";
import { useAuth } from "../../../contexts/AuthContext";
import { useToast } from "../../../contexts/ToastContext";
import { supabase } from "../../../lib/supabase";

export default function LoyaltyDashboard() {
    const { profile } = useAuth();
    const { success, error: toastError } = useToast();
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [convertAmount, setConvertAmount] = useState("");
    const [loading, setLoading] = useState(false);

    const points = profile?.loyalty_points || 0;
    const nextTier = points < 2000 ? 2000 : points < 5000 ? 5000 : 10000;
    const progress = Math.min((points / nextTier) * 100, 100);
    const progressBarStyle = { width: `${progress}%` };

    const handleConvert = async (e: React.FormEvent) => {
        e.preventDefault();
        const pointsToConvert = parseInt(convertAmount);

        if (isNaN(pointsToConvert) || pointsToConvert <= 0) {
            toastError("Veuillez entrer un nombre valide.");
            return;
        }

        if (pointsToConvert > points) {
            toastError("Solde de points insuffisant.");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.rpc('exchange_loyalty_points', {
                points_to_exchange: pointsToConvert
            });

            if (error) throw error;

            success(`Succès ! ${pointsToConvert} points convertis en ${pointsToConvert * 10} FCFA.`);
            setIsConvertModalOpen(false);
            setConvertAmount("");
            window.location.reload();
        } catch (error: any) {
            console.error('Error converting points:', error);
            toastError("Erreur lors de la conversion: " + error.message);
        } finally {
            setLoading(false);
        }
    };

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
                            <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-1000" style={progressBarStyle}></div>
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
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Gift className="w-24 h-24 text-purple-500" />
                    </div>
                    <Gift className="w-8 h-8 text-purple-500 mb-4" />
                    <h3 className="font-bold text-lg mb-2">Convertir mes points</h3>
                    <p className="text-slate-500 text-sm mb-6">Échangez vos points contre du crédit portefeuille (1 pt = 10 FCFA).</p>
                    <button
                        onClick={() => setIsConvertModalOpen(true)}
                        className="w-full py-2 bg-purple-50 text-purple-600 font-bold rounded-xl text-sm hover:bg-purple-100 transition-colors"
                    >
                        Convertir maintenant
                    </button>
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

            {/* Convert Modal */}
            {isConvertModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative animate-in fade-in zoom-in duration-200">
                        <button
                            onClick={() => setIsConvertModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                            title="Fermer"
                            aria-label="Fermer"
                        >
                            <X size={20} />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Gift className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">Convertir mes points</h3>
                            <p className="text-sm text-gray-500 mt-1">1 point = 10 FCFA</p>
                        </div>

                        <form onSubmit={handleConvert}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Points à convertir (Max: {points})
                                </label>
                                <input
                                    type="number"
                                    value={convertAmount}
                                    onChange={(e) => setConvertAmount(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="Ex: 500"
                                    max={points}
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="bg-purple-50 p-3 rounded-lg flex justify-between items-center mb-6">
                                <span className="text-sm text-purple-700 font-medium">Vous recevrez :</span>
                                <span className="text-lg font-bold text-purple-700">
                                    {parseInt(convertAmount || "0") * 10} FCFA
                                </span>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !convertAmount}
                                className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? "Conversion..." : "Valider la conversion"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
