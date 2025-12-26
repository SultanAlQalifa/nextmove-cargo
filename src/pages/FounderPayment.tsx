import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { Check, ShieldCheck, ArrowRight, Sparkles, Loader2, CreditCard } from "lucide-react";
import confetti from "canvas-confetti";
import PaymentModal from "../components/payment/PaymentModal";

export default function FounderPayment() {
    const navigate = useNavigate();
    const { user, refreshProfile } = useAuth();
    const { success, error: showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const { data } = await supabase.from("platform_settings").select("*").single();
        if (data) setSettings(data);
    };

    const handlePaymentSuccess = async () => {
        setLoading(true);
        try {
            // Grant badge by updating profile
            const { error: updateError } = await supabase.auth.updateUser({
                data: { is_founder: true }
            });

            if (updateError) throw updateError;

            // Also update the public profile
            await supabase
                .from('profiles')
                .update({ is_founder: true } as any)
                .eq('id', user?.id);

            // Success Feedback
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
            console.error("Profile update error after payment:", err);
            showError("Paiement reçu, mais erreur lors de l'activation du badge. Contactez le support.");
        } finally {
            setLoading(false);
        }
    };

    if (!settings) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
    );

    const price = settings?.founder_offer_price || 25000;

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
                            {price.toLocaleString()} <span className="text-2xl text-slate-400">FCFA</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-2">Paiement unique • Satisfait ou remboursé</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={() => setIsPaymentModalOpen(true)}
                            disabled={loading}
                            className="group w-full py-5 px-6 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-amber-500/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <span>Payer maintenant</span>
                                    <CreditCard className="w-6 h-6" />
                                </>
                            )}
                        </button>

                        <p className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Connexion sécurisée SSL
                        </p>
                    </div>
                </div>

            </div>

            <PaymentModal
                isOpen={isPaymentModalOpen}
                onClose={() => setIsPaymentModalOpen(false)}
                onSuccess={handlePaymentSuccess}
                planName="Membre Fondateur"
                amount={price}
                currency="XOF"
                allowedMethods={["wave", "wallet", "paytech", "cinetpay"]}
                showCoupons={false}
                showVAT={false}
            />
        </div>
    );
}
