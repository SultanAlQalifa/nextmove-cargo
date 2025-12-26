import React, { useState } from "react";
import { X, Mail, CheckCircle, Loader2, Save } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { savedQuotesService } from "../../services/savedQuotesService";

interface SavedQuoteModalProps {
    isOpen: boolean;
    onClose: () => void;
    quoteDetails: any;
}

export default function SavedQuoteModal({
    isOpen,
    onClose,
    quoteDetails,
}: SavedQuoteModalProps) {
    const { user } = useAuth();
    const [email, setEmail] = useState(user?.email || "");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await savedQuotesService.saveQuote(
                quoteDetails,
                email,
                user?.id
            );
            setSuccess(true);
        } catch (err) {
            console.error("Error saving quote:", err);
            setError("Une erreur est survenue lors de la sauvegarde.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="relative p-6">
                    <button
                        onClick={onClose}
                        aria-label="Fermer"
                        className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>

                    {success ? (
                        <div className="text-center py-8 space-y-4">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Devis Sauvegardé !
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                Nous avons bien reçu votre demande. Un expert vous contactera bientôt si nécessaire.
                            </p>
                            <button
                                onClick={onClose}
                                className="mt-6 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/30"
                            >
                                Parfait, merci !
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in duration-300">
                                    <Save className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Sauvegarder & Recevoir
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    Recevez ce devis par email et sauvegardez-le pour plus tard.
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-sm">
                                    Récapitulatif
                                </h4>
                                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                    <div className="flex justify-between">
                                        <span>Transitaire:</span>
                                        <span className="font-medium">{quoteDetails?.forwarder_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Total Estimé:</span>
                                        <span className="font-bold text-orange-600 text-lg">
                                            {new Intl.NumberFormat("fr-FR", {
                                                style: "currency",
                                                currency: "XOF",
                                                maximumFractionDigits: 0,
                                            }).format(quoteDetails?.total_cost || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Votre adresse email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            readOnly={!!user?.email}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                            placeholder="nom@exemple.com"
                                        />
                                    </div>
                                    {user?.email && (
                                        <p className="text-xs text-gray-500">
                                            Connecté en tant que {user.email}
                                        </p>
                                    )}
                                </div>

                                {error && (
                                    <p className="text-sm text-red-600 dark:text-red-400 text-center">
                                        {error}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !email}
                                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"

                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Envoi en cours...
                                        </>
                                    ) : (
                                        "Recevoir mon devis"
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
