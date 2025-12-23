import { useState, useEffect } from "react";
import { savedQuotesService, SavedQuote } from "../../../services/savedQuotesService";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Search, Filter, Trash2, Eye, Truck, Ship, Plane } from "lucide-react";
import { showNotification } from "../../../components/common/NotificationToast";
import LoadingSpinner from "../../../components/common/LoadingSpinner";

export default function AdminSavedQuotes() {
    const [quotes, setQuotes] = useState<SavedQuote[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterMode, setFilterMode] = useState<string>("all");

    useEffect(() => {
        loadQuotes();
    }, []);

    const loadQuotes = async () => {
        try {
            const data = await savedQuotesService.getSavedQuotes();
            setQuotes(data);
        } catch (err) {
            console.error("Error loading quotes:", err);
            showNotification("Erreur", "Impossible de charger les devis", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce devis de la base de données ?")) return;

        try {
            await savedQuotesService.deleteQuote(id);
            setQuotes(prev => prev.filter(q => q.id !== id));
            showNotification("Succès", "Devis supprimé", "success");
        } catch (err) {
            showNotification("Erreur", "Suppression échouée", "error");
        }
    };

    const filteredQuotes = quotes.filter(quote => {
        const details = quote.quote_details;
        const searchString = `${quote.email || ''} ${details.origin_country || ''} ${details.destination_country || ''}`.toLowerCase();
        const matchesSearch = searchString.includes(searchTerm.toLowerCase());

        const matchesFilter = filterMode === 'all' || details.transport_mode === filterMode;

        return matchesSearch && matchesFilter;
    });

    const getTransportIcon = (mode: string) => {
        switch (mode) {
            case 'air': return <Plane size={16} />;
            case 'sea': return <Ship size={16} />;
            case 'road': return <Truck size={16} />;
            default: return <Truck size={16} />;
        }
    };

    if (loading) return <div className="h-96 flex items-center justify-center"><LoadingSpinner /></div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Devis Sauvegardés</h1>
                    <p className="text-gray-500">Gestion des estimations clients</p>
                </div>

                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            aria-label="Rechercher des devis"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <select
                        aria-label="Filtrer par mode de transport"
                        value={filterMode}
                        onChange={(e) => setFilterMode(e.target.value)}
                        className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    >
                        <option value="all">Tous modes</option>
                        <option value="air">Aérien</option>
                        <option value="sea">Maritime</option>
                        <option value="road">Routier</option>
                    </select>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-sm font-semibold uppercase">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Client / Email</th>
                                <th className="px-6 py-4">Trajet</th>
                                <th className="px-6 py-4">Mode</th>
                                <th className="px-6 py-4">Montant Est.</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredQuotes.map((quote) => {
                                const details = quote.quote_details;
                                return (
                                    <tr key={quote.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {format(new Date(quote.created_at), "dd/MM/yyyy HH:mm")}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {quote.email || "Anonyme"}
                                            </div>
                                            {quote.user_id && <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">Inscrit</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{details.origin_country}</span>
                                                <span className="text-gray-400">→</span>
                                                <span className="font-medium">{details.destination_country}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize`}>
                                                {getTransportIcon(details.transport_mode)}
                                                {details.transport_mode}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                            {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(details.total_cost || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleDelete(quote.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredQuotes.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Aucun devis trouvé.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
