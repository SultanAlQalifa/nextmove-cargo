import { useState } from "react";
import { X, Send, AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { reviewService } from "../../services/reviewService";
import StarRating from "../common/StarRating";

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    shipment: {
        id: string;
        tracking_number: string;
        forwarder_id: string;
        forwarder?: {
            company_name: string;
            full_name: string;
        };
    };
    onSuccess?: () => void;
}

export default function ReviewModal({
    isOpen,
    onClose,
    shipment,
    onSuccess,
}: ReviewModalProps) {
    const { user } = useAuth();
    const { success, error: toastError } = useToast();
    const [rating, setRating] = useState(7);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        try {
            await reviewService.submitReview({
                shipment_id: shipment.id,
                client_id: user.id,
                forwarder_id: shipment.forwarder_id,
                rating,
                comment,
            });

            success("Merci pour votre avis ! Cela aide les autres clients.");
            onSuccess?.();
            onClose();
        } catch (err: any) {
            console.error("Review submission error:", err);
            toastError("Erreur lors de l'envoi de l'avis : " + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const forwarderName = shipment.forwarder?.company_name || shipment.forwarder?.full_name || "le prestataire";

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b dark:border-slate-700">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Évaluer votre expérience</h3>
                        <p className="text-sm text-slate-500 mt-1">Expédition {shipment.tracking_number}</p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Fermer"
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Forwarder Info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Comment s'est passée votre livraison avec <strong>{forwarderName}</strong> ?
                        </p>
                    </div>

                    {/* Rating */}
                    <div className="space-y-3 text-center">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Votre note sur 7 étoiles</label>
                        <div className="flex justify-center">
                            <StarRating
                                rating={rating}
                                maxRating={7}
                                onRatingChange={setRating}
                                interactive={true}
                                size="lg"
                            />
                        </div>
                        <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                            {rating === 7 ? "Exceptionnel" : rating >= 6 ? "Excellent" : rating >= 5 ? "Très bien" : rating >= 4 ? "Satisfaisant" : rating >= 3 ? "Moyen" : rating >= 2 ? "Décevant" : "Très mauvais"}
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Commentaire (Optionnel)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Qu'est-ce qui vous a plu ou déplu ?"
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-slate-700 dark:text-white"
                        />
                    </div>

                    {/* Action Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Envoyer mon avis
                                <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
