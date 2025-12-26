import { useState } from "react";
import { Award, X } from "lucide-react";
import { academyService } from "../../services/academyService";
import PaymentModal from "../payment/PaymentModal";

interface CertificatePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    courseTitle: string;
    enrollmentId: string;
    price?: number;
}

export default function CertificatePaymentModal({
    isOpen,
    onClose,
    onSuccess,
    courseTitle,
    enrollmentId,
    price = 5000
}: CertificatePaymentModalProps) {
    const [showActualPayment, setShowActualPayment] = useState(false);

    const AMOUNT = price;
    const CURRENCY = "XOF";

    if (!isOpen) return null;

    if (showActualPayment) {
        return (
            <PaymentModal
                isOpen={true}
                onClose={() => {
                    setShowActualPayment(false);
                    onClose();
                }}
                onSuccess={async (txId) => {
                    // Finalize internal record
                    if (txId) {
                        await academyService.payForCertificate(enrollmentId, txId);
                        onSuccess();
                    }
                }}
                planName={`Certificat - ${courseTitle}`}
                amount={AMOUNT}
                currency={CURRENCY}
                allowedMethods={["wave", "wallet", "paytech", "cinetpay"]}
                showCoupons={false}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh] border border-slate-100">
                {/* Header with Academy Branding */}
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
                        title="Fermer"
                        aria-label="Fermer la modale"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Offer Content */}
                <div className="p-8 space-y-8 text-center">
                    <div className="space-y-4">
                        <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 inline-block">
                            <Award className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                            <h4 className="font-black text-slate-900 text-xl">{courseTitle}</h4>
                        </div>

                        <div className="space-y-2">
                            <p className="text-slate-600">Obtenez votre certification signée et vérifiée pour valider vos compétences.</p>
                            <ul className="text-sm text-slate-500 space-y-1 font-medium">
                                <li>• Version numérique haute résolution</li>
                                <li>• Signature numérique sécurisée</li>
                                <li>• Ajoutable à votre profil LinkedIn</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <p className="text-slate-500 font-medium text-sm mb-2">Frais de certification</p>
                        <div className="text-4xl font-black text-slate-900 tracking-tight">
                            {AMOUNT.toLocaleString()} <span className="text-lg text-slate-500 font-bold">{CURRENCY}</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowActualPayment(true)}
                        className="w-full py-4 bg-orange-500 text-white text-lg font-black rounded-xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Award className="w-5 h-5" />
                        Procéder au Paiement
                    </button>

                    <p className="text-[10px] text-slate-400 font-medium">
                        Paiement sécurisé par NextMove Cargo. Les frais de transaction et TVA seront calculés à l'étape suivante.
                    </p>
                </div>
            </div>
        </div>
    );
}
