import { useState, useEffect } from "react";
import { useToast } from "../../contexts/ToastContext";
import {
    X,
    CreditCard,
    Smartphone,
    CheckCircle,
    AlertCircle,
    Wallet,
    Award
} from "lucide-react";
import { paymentService } from "../../services/paymentService";
import { academyService } from "../../services/academyService";
import { supabase } from "../../lib/supabase";

interface CertificatePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    courseTitle: string;
    enrollmentId: string;
}

type PaymentMethod = "wave" | "wallet" | "paytech";

export default function CertificatePaymentModal({
    isOpen,
    onClose,
    onSuccess,
    courseTitle,
    enrollmentId
}: CertificatePaymentModalProps) {
    const { success: showSuccess } = useToast();
    const [step, setStep] = useState<"method" | "processing" | "success" | "error">("method");
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [error, setError] = useState("");
    const [walletBalance, setWalletBalance] = useState(0);

    const AMOUNT = 5000;
    const CURRENCY = "XOF";

    useEffect(() => {
        if (isOpen) {
            setStep("method");
            setSelectedMethod(null);
            setPhoneNumber("");
            setError("");
            fetchWalletBalance();
        }
    }, [isOpen]);

    const fetchWalletBalance = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from("wallets")
                .select("balance")
                .eq("user_id", user.id)
                .maybeSingle();
            if (data) setWalletBalance(Number(data.balance));
        }
    };

    const handlePayment = async () => {
        if (!selectedMethod) return;

        if (selectedMethod === "wave" && !phoneNumber) {
            setError("Veuillez entrer votre numéro de téléphone");
            return;
        }

        setStep("processing");
        setError("");

        try {
            let transactionId = "";

            if (selectedMethod === "wave") {
                const { transaction_id: waveTxId, wave_launch_url } = await paymentService.initializeWavePayment(AMOUNT, CURRENCY);

                if (wave_launch_url) {
                    window.open(wave_launch_url, "_blank");
                } else {
                    throw new Error("Erreur: URL de paiement Wave manquante");
                }

                const verification = await paymentService.verifyWavePayment(waveTxId);
                if (verification.status === "succeeded") {
                    transactionId = waveTxId;
                } else {
                    throw new Error("Paiement non validé");
                }

            } else if (selectedMethod === "wallet") {
                if (walletBalance < AMOUNT) {
                    throw new Error("Solde insuffisant dans votre portefeuille");
                }

                transactionId = `CERT-${enrollmentId}-${Date.now()}`;

                await paymentService.payWithWallet(
                    AMOUNT,
                    transactionId,
                    `Certificat: ${courseTitle}`
                );

            } else if (selectedMethod === "paytech") {
                const { redirect_url, transaction_id } = await paymentService.initializePayTechPayment(
                    AMOUNT,
                    CURRENCY,
                    {
                        item_name: `Certificat - ${courseTitle}`,
                        enrollment_id: enrollmentId
                    }
                );

                if (redirect_url) {
                    // For PayTech, redirection handles everything usually, but here we are in a Modal flow.
                    // Usually we'd redirect and return. 
                    // For simpler UX here, we might need to change flow or trust webhook.
                    // But relying on redirect changes the page context.
                    // Let's assume we redirect and let the user come back.
                    // OR use a popup window?
                    // "window.location.href = redirect_url" updates the page.
                    // We should use window.location.href but that breaks the modal state.
                    // For now, let's Stick to Wave/Wallet which are seamless or popup-friendly.
                    // But user asked for PayTech. 
                    // I'll implement PayTech redirect.
                    window.location.href = redirect_url;
                    return;
                }
                transactionId = transaction_id;
            }

            // Finalize internal record
            if (transactionId) {
                await academyService.payForCertificate(enrollmentId, transactionId);
                setStep("success");
                setTimeout(() => {
                    showSuccess("Certificat débloqué !");
                    onSuccess();
                    onClose();
                }, 2000);
            }

        } catch (err: any) {
            console.error("Payment error:", err);
            setStep("error");
            setError(err.message || "Une erreur est survenue lors du paiement.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-100">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 text-lg">Débloquer le Certificat</h3>
                            <p className="text-xs text-slate-500 font-medium">Certification Officielle NextMove</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        title="Fermer la modale"
                        aria-label="Fermer la modale"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">
                    {step === "method" && (
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center space-y-2">
                                <p className="text-slate-500 font-medium text-sm">Prix de la certification</p>
                                <div className="text-4xl font-black text-slate-900 tracking-tight">
                                    {AMOUNT.toLocaleString()} <span className="text-lg text-slate-500 font-bold">{CURRENCY}</span>
                                </div>
                                <p className="text-xs text-orange-600 font-bold bg-orange-50 inline-block px-3 py-1 rounded-full border border-orange-100">
                                    Version Imprimable HD + Signature Vérifiée
                                </p>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm font-bold text-slate-900">Moyen de paiement</p>

                                <button
                                    onClick={() => walletBalance >= AMOUNT ? setSelectedMethod("wallet") : null}
                                    className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98]
                    ${selectedMethod === "wallet"
                                            ? "border-slate-900 bg-slate-50 ring-2 ring-slate-900/10"
                                            : walletBalance >= AMOUNT
                                                ? "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                                : "border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed"
                                        }`}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                                        <Wallet className="w-5 h-5" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-slate-900">Mon Portefeuille</p>
                                            {selectedMethod === "wallet" && <CheckCircle className="w-5 h-5 text-slate-900" />}
                                        </div>
                                        <p className="text-xs text-slate-500">Solde: {walletBalance.toLocaleString()} {CURRENCY}</p>
                                        {walletBalance < AMOUNT && <p className="text-xs text-red-500 font-bold">Solde insuffisant</p>}
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSelectedMethod("wave")}
                                    className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98]
                    ${selectedMethod === "wave" ? "border-[#1dc4ff] bg-[#1dc4ff]/5 ring-2 ring-[#1dc4ff]/20" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-[#1dc4ff] flex items-center justify-center text-white font-bold text-xs">Wave</div>
                                    <div className="text-left flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-slate-900">Wave Mobile Money</p>
                                            {selectedMethod === "wave" && <CheckCircle className="w-5 h-5 text-[#1dc4ff]" />}
                                        </div>
                                        <p className="text-xs text-slate-500">Paiement via l'application Wave</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setSelectedMethod("paytech")}
                                    className={`w-full p-4 rounded-xl border flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98]
                    ${selectedMethod === "paytech" ? "border-blue-600 bg-blue-50 ring-2 ring-blue-600/20" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">PayTech</div>
                                    <div className="text-left flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-slate-900">Autres (Orange Money, Free...)</p>
                                            {selectedMethod === "paytech" && <CheckCircle className="w-5 h-5 text-blue-600" />}
                                        </div>
                                        <p className="text-xs text-slate-500">Cartes bancaires et Mobile Money</p>
                                    </div>
                                </button>
                            </div>

                            {selectedMethod === "wave" && (
                                <div className="animate-in slide-in-from-top-2">
                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5 ml-1">Numéro Wave</label>
                                    <div className="relative">
                                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            placeholder="77 000 00 00"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#1dc4ff] focus:ring-4 focus:ring-[#1dc4ff]/10 outline-none font-bold text-slate-900 placeholder:font-normal transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-3 font-medium animate-in shake">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handlePayment}
                                disabled={!selectedMethod}
                                className="w-full py-4 bg-slate-900 text-white text-lg font-black rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                            >
                                Payer {AMOUNT.toLocaleString()} {CURRENCY}
                            </button>
                        </div>
                    )}

                    {step === "processing" && (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-slate-100 border-t-orange-500 rounded-full animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <CreditCard className="w-8 h-8 text-orange-500 animate-pulse" />
                                </div>
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-xl mb-2">Paiement en cours...</h4>
                                <p className="text-slate-500 text-sm max-w-xs mx-auto">Veuillez valider la transaction sur votre téléphone. Ne fermez pas cette fenêtre.</p>
                            </div>
                        </div>
                    )}

                    {step === "success" && (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 animate-in zoom-in duration-300">
                            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-100">
                                <CheckCircle className="w-12 h-12" />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-2xl mb-2">Félicitations ! 🎉</h4>
                                <p className="text-slate-500 font-medium">Votre certificat est maintenant disponible.</p>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-8">
                                <div className="h-full bg-green-500 animate-progress"></div>
                            </div>
                        </div>
                    )}

                    {step === "error" && (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-6 animate-in zoom-in duration-300">
                            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                                <AlertCircle className="w-12 h-12" />
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 text-2xl mb-2">Oups !</h4>
                                <p className="text-slate-500 font-medium mb-1">Le paiement a échoué.</p>
                                <p className="text-red-500 text-sm">{error}</p>
                            </div>
                            <button
                                onClick={() => setStep("method")}
                                className="px-8 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                            >
                                Réessayer
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
