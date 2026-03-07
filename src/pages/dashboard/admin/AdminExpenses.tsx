import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import { useToast } from "../../../contexts/ToastContext";
import {
    Receipt,
    Plus,
    Trash2,
    Search,
    Filter,
    X,
    ArrowUpRight,
    TrendingUp,
    DollarSign,
    FileText,
    Clock
} from "lucide-react";
import { expenseService, CompanyExpense } from "../../../services/expenseService";

export default function AdminExpenses() {
    const { success, error: toastError } = useToast();
    const [expenses, setExpenses] = useState<CompanyExpense[]>([]);
    const [loading, setLoading] = useState(true);
    const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
    const [receiptText, setReceiptText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const data = await expenseService.getExpenses();
            setExpenses(data);
        } catch (error) {
            console.error("Error fetching expenses:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleQuickAdd = async () => {
        if (!receiptText.trim()) return;
        try {
            const parsedData = expenseService.parseReceiptText(receiptText);
            await expenseService.createExpense(parsedData);
            success("Dépense enregistrée avec succès");
            setReceiptText("");
            setIsQuickAddOpen(false);
            fetchExpenses();
        } catch (error: any) {
            toastError(error.message || "Erreur lors de l'enregistrement");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cette dépense ?")) return;
        try {
            await expenseService.deleteExpense(id);
            success("Dépense supprimée");
            fetchExpenses();
        } catch (error: any) {
            toastError(error.message || "Erreur lors de la suppression");
        }
    };

    const filteredExpenses = expenses.filter(exp => {
        const matchesSearch = exp.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
            exp.article.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === "all" || exp.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const totalMonthly = expenses.reduce((acc, curr) => {
        // Basic conversion logic if mixing currencies, for now just sum if same
        // In a real app we'd convert to base currency
        return acc + curr.amount;
    }, 0);

    const formatCurrency = (amount: number, currency: string = "XOF") => {
        return new Intl.NumberFormat("fr-XO", {
            style: "currency",
            currency: currency,
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Gestion des Dépenses"
                subtitle="Suivez les coûts opérationnels et abonnements de la plateforme"
                action={{
                    label: "Saisie Rapide",
                    onClick: () => setIsQuickAddOpen(!isQuickAddOpen),
                    icon: Receipt,
                }}
            />

            {/* Quick Add Section */}
            {isQuickAddOpen && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-primary" /> Extraction Automatique
                        </h3>
                        <button
                            onClick={() => setIsQuickAddOpen(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Fermer"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                        Copiez et collez le contenu d'un e-mail de confirmation ou d'un reçu ci-dessous. Notre système IA extraira le marchand, le montant et le service.
                    </p>
                    <textarea
                        value={receiptText}
                        onChange={(e) => setReceiptText(e.target.value)}
                        placeholder="Collez ici le texte du reçu (ex: Confirmation Google Play...)"
                        className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none text-sm"
                    />
                    <div className="flex justify-end mt-4">
                        <button
                            onClick={handleQuickAdd}
                            disabled={!receiptText.trim()}
                            className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            <TrendingUp className="w-4 h-4" /> Analyser & Enregistrer
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-600 rounded-full flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" /> Mensuel
                        </span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Dépenses Totales</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                        {formatCurrency(totalMonthly)}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <Clock className="w-6 h-6" />
                        </div>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Dernier Paiement</h3>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                        {expenses[0]?.merchant || "N/A"}
                    </p>
                    <p className="text-sm text-gray-400">
                        {expenses[0] ? new Date(expenses[0].date).toLocaleDateString() : ""}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                            <FileText className="w-6 h-6" />
                        </div>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Volume</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                        {expenses.length}
                    </p>
                    <p className="text-sm text-gray-400">Transactions enregistrées</p>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par marchand ou article..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg focus:bg-white focus:border-primary/20 outline-none transition-all text-sm"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-gray-50 border border-transparent rounded-lg px-3 py-2 text-sm outline-none focus:bg-white focus:border-primary/20 cursor-pointer"
                        title="Filtrer par catégorie"
                    >
                        <option value="all">Toutes les catégories</option>
                        <option value="software_subscription">Logiciels / SaaS</option>
                        <option value="marketing">Marketing</option>
                        <option value="office">Bureautique</option>
                        <option value="utility">Services Publics</option>
                        <option value="other">Autre</option>
                    </select>
                </div>
            </div>

            {/* Expenses Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marchand</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Article</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="relative px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Chargement...</td>
                            </tr>
                        ) : filteredExpenses.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">Aucune dépense trouvée</td>
                            </tr>
                        ) : (
                            filteredExpenses.map((exp) => (
                                <tr key={exp.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(exp.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold">
                                                {exp.merchant[0]}
                                            </div>
                                            <span className="text-sm font-bold text-gray-900">{exp.merchant}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {exp.article}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm font-bold text-red-600">-{formatCurrency(exp.amount, exp.currency)}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            {exp.status === 'cleared' ? 'Payé' : exp.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleDelete(exp.id)}
                                            className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all"
                                            title="Supprimer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
