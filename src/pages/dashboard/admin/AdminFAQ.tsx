import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
    HelpCircle,
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { faqService, FAQ } from "../../../services/faqService";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import ConfirmationModal from "../../../components/common/ConfirmationModal";

export default function AdminFAQ() {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);

    const [formData, setFormData] = useState({
        category: "Général",
        question: "",
        answer: "",
        is_active: true,
        display_order: 0,
    });

    const { success, error: toastError } = useToast();

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        faqId: "",
    });

    const categories = ["Général", "Expéditions", "Paiements", "Douanes", "Calculateur", "Compte"];

    useEffect(() => {
        fetchFaqs();
    }, []);

    const fetchFaqs = async () => {
        setIsLoading(true);
        try {
            const data = await faqService.getAll();
            setFaqs(data);
        } catch (error) {
            console.error("Error fetching faqs:", error);
            toastError("Erreur lors du chargement de la FAQ.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (faq?: FAQ) => {
        if (faq) {
            setEditingFaq(faq);
            setFormData({
                category: faq.category,
                question: faq.question,
                answer: faq.answer,
                is_active: faq.is_active,
                display_order: faq.display_order,
            });
        } else {
            setEditingFaq(null);
            setFormData({
                category: "Général",
                question: "",
                answer: "",
                is_active: true,
                display_order: faqs.length + 1,
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingFaq) {
                await faqService.update(editingFaq.id, formData);
                success("Question mise à jour avec succès !");
            } else {
                await faqService.create(formData);
                success("Nouvelle question ajoutée !");
            }
            setIsModalOpen(false);
            fetchFaqs();
        } catch (error) {
            console.error("Error saving faq:", error);
            toastError("Erreur lors de l'enregistrement.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        setConfirmModal({ isOpen: true, faqId: id });
    };

    const confirmDelete = async () => {
        try {
            await faqService.delete(confirmModal.faqId);
            success("Question supprimée.");
            fetchFaqs();
        } catch (error) {
            console.error("Error deleting faq:", error);
            toastError("Erreur lors de la suppression.");
        } finally {
            setConfirmModal({ isOpen: false, faqId: "" });
        }
    };

    const filteredFaqs = faqs.filter(
        (f) =>
            f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            f.category.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const groupedFaqs = filteredFaqs.reduce((acc, faq) => {
        if (!acc[faq.category]) acc[faq.category] = [];
        acc[faq.category].push(faq);
        return acc;
    }, {} as Record<string, FAQ[]>);

    if (isLoading) return <LoadingSpinner fullPage />;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Gestion de la FAQ"
                subtitle={`${faqs.length} questions-réponses`}
                action={{
                    label: "Ajouter une question",
                    onClick: () => handleOpenModal(),
                    icon: Plus,
                }}
            />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher dans la FAQ..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="p-6 space-y-8">
                    {Object.entries(groupedFaqs).map(([category, items]) => (
                        <div key={category} className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                <HelpCircle className="w-4 h-4" /> {category}
                            </h3>
                            <div className="grid gap-4">
                                {items.map((faq) => (
                                    <div
                                        key={faq.id}
                                        className="p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 transition-all group"
                                    >
                                        <div className="flex justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h4 className="font-bold text-gray-900">{faq.question}</h4>
                                                    {!faq.is_active && (
                                                        <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-bold uppercase">
                                                            Masqué
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                            <div className="flex flex-col gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleOpenModal(faq)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                    title="Modifier"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(faq.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {filteredFaqs.length === 0 && searchQuery && (
                        <div className="py-12 text-center text-gray-500">
                            Aucun résultat pour "{searchQuery}"
                        </div>
                    )}
                </div>
            </div>

            {/* Modal FAQ */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm px-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingFaq ? "Modifier la Question" : "Nouvelle Question FAQ"}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                title="Fermer"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Catégorie
                                    </label>
                                    <select
                                        id="faq-category"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-primary"
                                        value={formData.category}
                                        title="Sélectionner une catégorie"
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {categories.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Ordre d'affichage
                                    </label>
                                    <input
                                        id="faq-order"
                                        type="number"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-primary"
                                        value={formData.display_order}
                                        aria-label="Ordre d'affichage"
                                        placeholder="0"
                                        onChange={(e) =>
                                            setFormData({ ...formData, display_order: parseInt(e.target.value) })
                                        }
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Question
                                </label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-primary"
                                    placeholder="Ex: Quels sont les délais de livraison ?"
                                    value={formData.question}
                                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Réponse
                                </label>
                                <textarea
                                    required
                                    rows={6}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-primary resize-none"
                                    placeholder="La réponse détaillée..."
                                    value={formData.answer}
                                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-4 py-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={formData.is_active}
                                        onChange={(e) =>
                                            setFormData({ ...formData, is_active: e.target.checked })
                                        }
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Afficher sur le site
                                    </span>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2.5 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-8 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20 disabled:opacity-50"
                                >
                                    {isSubmitting ? "Enregistrement..." : editingFaq ? "Mettre à jour" : "Ajouter à la FAQ"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, faqId: "" })}
                onConfirm={confirmDelete}
                title="Supprimer cette question ?"
                message="Cette action est irréversible. La question ne sera plus visible par vos clients."
                confirmLabel="Supprimer"
                variant="danger"
            />
        </div>
    );
}
