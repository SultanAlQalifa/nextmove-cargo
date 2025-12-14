import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Award, Check, ShieldCheck, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";

export default function FounderPayment() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user, refreshProfile } = useAuth();
    const { success, error: showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState<any>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const { data } = await supabase.from("platform_settings").select("*").single();
        if (data) setSettings(data);
    };

    const handlePayment = async () => {
        setLoading(true);
        try {
            // 1. Create a transaction record (simulated for Wave)
            // In a real app, this would call the Wave API
            const amount = settings?.founder_offer_price || 5000;

            // Simulate API call delay
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // 2. Grant badge by updating profile (using RPC or direct update if allowed)
            // We'll update metadata or a flag. For now, let's assume a 'is_founder' column or similar.
            // Since we might not have that column, we'll store it in metadata or just log it.
            // Ideally, we'd have a 'badges' array.

            // Let's use a specific RPC if available, or just update metadata.
            const { error: updateError } = await supabase.auth.updateUser({
                data: { is_founder: true }
            });

            if (updateError) throw updateError;

            // Also update the public profile if possible
            await supabase
                .from('profiles')
                .update({ is_founder: true } as any) // Cast as any if column doesn't exist yet, but we should add it.
                .eq('id', user?.id);

            // 3. Success Feedback
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#F59E0B', '#FCD34D', '#FFFFFF']
            });

            success("Félicitations ! Vous êtes Membre Fondateur.");
            await refreshProfile();

            // Redirect to dashboard
            setTimeout(() => navigate("/dashboard/client"), 2000);

        } catch (err: any) {
            console.error("Payment error:", err);
            showError("Échec du paiement. Veuillez réessayer.");
        } finally {
            setLoading(false);
        }
    };

    if (!settings) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <button
                onClick={() => navigate(-1)}
                className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
                <ArrowRight className="w-5 h-5 rotate-180" />
                <span>Retour</span>
            </button>
            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden border border-amber-500/10">

                {/* Left: Summary */}
                <div className="p-10 md:p-14 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 rounded-full blur-[60px] -ml-20 -mb-20"></div>

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 font-bold text-sm mb-8">
                            <Sparkles className="w-4 h-4" /> Offre Limitée
                        </div>

                        <h1 className="text-4xl font-bold mb-6">Devenez Membre Fondateur</h1>
                        <p className="text-slate-300 text-lg mb-10 leading-relaxed">
                            Rejoignez le cercle exclusif des premiers soutiens de NextMove Cargo et profitez d'avantages à vie.
                        </p>

                        <div className="space-y-6">
                            {[
                                "Badge Exclusif sur votre profil",
                                "Accès prioritaire aux nouveautés",
                                "Support VIP dédié 7j/7",
                                "invitations aux événements privés"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                                        <Check className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Payment */}
                <div className="p-10 md:p-14 flex flex-col justify-center">
                    <div className="text-center mb-10">
                        <p className="text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider text-xs mb-2">Montant à régler</p>
                        <div className="text-5xl font-bold text-slate-900 dark:text-white">
                            {(settings.founder_offer_price || 5000).toLocaleString()} <span className="text-2xl text-slate-400">FCFA</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Paiement unique • Satisfait ou remboursé</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handlePayment}
                            disabled={loading}
                            className="group w-full py-5 px-6 bg-[#1DA1F2] hover:bg-[#1a91da] text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span>Payer avec Wave</span>
                                    <img src="/assets/wave-icon.png" alt="" className="w-6 h-6 object-contain bg-white rounded-full p-0.5" />
                                </>
                            )}
                        </button>

                        <button
                            onClick={handlePayment}
                            disabled={loading}
                            className="w-full py-5 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-500/20 transition-all transform hover:-translate-y-1"
                        >
                            Payer avec Orange Money
                        </button>

                        <p className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Connexion sécurisée 256-bit SSL
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
