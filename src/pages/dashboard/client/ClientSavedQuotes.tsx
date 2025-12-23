import { useState, useEffect } from "react";
import { savedQuotesService, SavedQuote } from "../../../services/savedQuotesService";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Archive, Trash2, ArrowRight, Package, Calculator, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { showNotification } from "../../../components/common/NotificationToast";

export default function ClientSavedQuotes() {
    const [quotes, setQuotes] = useState<SavedQuote[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        loadQuotes();
    }, []);

    const loadQuotes = async () => {
        try {
            const data = await savedQuotesService.getSavedQuotes();
            setQuotes(data);
        } catch (err) {
            console.error("Error loading quotes:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce devis ?")) return;

        setDeletingId(id);
        try {
            await savedQuotesService.deleteQuote(id);
            setQuotes(prev => prev.filter(q => q.id !== id));
            showNotification("Devis supprimé", "Le devis a été supprimé avec succès.", "success");
        } catch (err) {
            console.error(err);
            showNotification("Erreur", "Impossible de supprimer le devis.", "error");
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mes Devis Sauvegardés</h1>
                    <p className="text-gray-500 dark:text-gray-400">Retrouvez ici vos simulations de transport</p>
                </div>
                <Link
                    to="/#calculator"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                >
                    <Calculator className="w-4 h-4" />
                    Nouveau Devis
                </Link>
            </div>

            {quotes.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Archive className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Aucun devis sauvegardé</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Vous n'avez pas encore sauvegardé de simulation.</p>
                    <Link
                        to="/#calculator"
                        className="text-primary hover:underline font-medium"
                    >
                        Faire une estimation maintenant &rarr;
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quotes.map((quote) => {
                        const details = quote.quote_details;
                        return (
                            <div
                                key={quote.id}
                                className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 hover:shadow-lg transition-all"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                                        <Package className="w-6 h-6" />
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(details.total_cost || 0)}
                                        </div>
                                        <div className="text-xs text-gray-500">Estimé le {format(new Date(quote.created_at), "dd MMM yyyy", { locale: fr })}</div>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Mode</span>
                                        <span className="font-medium capitalize">{details.transport_mode}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Départ</span>
                                        <span className="font-medium">{details.origin_country}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Arrivée</span>
                                        <span className="font-medium">{details.destination_country}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Transitaire</span>
                                        <span className="font-medium text-gray-900 dark:text-white">{details.forwarder_name}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        onClick={() => handleDelete(quote.id)}
                                        disabled={deletingId === quote.id}
                                        title="Supprimer"
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        {deletingId === quote.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                                    </button>
                                    <Link
                                        to="/contact" // Ideally direct to a booking flow pre-filled
                                        className="flex-1 flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-700 hover:bg-primary hover:text-white text-gray-700 dark:text-gray-300 font-medium py-2 rounded-lg transition-all"
                                    >
                                        Réserver
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
