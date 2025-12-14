
import { useState } from "react";
import { X, RefreshCcw, AlertCircle } from "lucide-react";

interface Payment {
    id: string;
    amount: number;
    currency: string;
    reference: string;
    status: string;
    user: {
        full_name: string;
        email: string;
    };
}

interface RefundRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    payment: Payment | null;
    onConfirm: (paymentId: string, amount: number, reason: string) => Promise<void>;
}

export default function RefundRequestModal({ isOpen, onClose, payment, onConfirm }: RefundRequestModalProps) {
    const [amount, setAmount] = useState<number | "">("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen || !payment) return null;

    // Default to full refund if not set
    const handleInit = () => {
        if (amount === "") setAmount(payment.amount);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onConfirm(payment.id, Number(amount), reason);
            onClose();
        } catch (error) {
            console.error("Error processing refund:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onMouseEnter={handleInit}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <RefreshCcw className="w-5 h-5 text-gray-500" />
                        Rembourser un Paiement
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" title="Fermer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Paiement Original :</span>
                            <span className="font-bold text-gray-900">{payment.reference}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Montant Total :</span>
                            <span className="font-bold text-gray-900">{payment.amount.toLocaleString()} {payment.currency}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Client :</span>
                            <span className="font-medium text-gray-900">{payment.user.full_name}</span>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-3 items-start">
                        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800">
                            Le remboursement sera crédité sur le portefeuille du client ou via la méthode de paiement originale si supportée.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Montant à rembourser ({payment.currency})
                        </label>
                        <input
                            type="number"
                            max={payment.amount}
                            min={1}
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder={payment.amount.toString()}
                            required
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">Max: {payment.amount.toLocaleString()}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Motif du remboursement
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                            placeholder="Ex: Erreur de facturation, annulation de service..."
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? "Traitement..." : "Confirmer Remboursement"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
