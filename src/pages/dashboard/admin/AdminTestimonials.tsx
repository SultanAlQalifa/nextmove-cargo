import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
    Star,
    Plus,
    Search,
    MoreVertical,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    User,
    ExternalLink,
} from "lucide-react";
import {
    testimonialService,
    Testimonial,
} from "../../../services/testimonialService";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import ConfirmationModal from "../../../components/common/ConfirmationModal";

export default function AdminTestimonials() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingTestimonial, setEditingTestimonial] =
        useState<Testimonial | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        role: "",
        content: "",
        rating: 5,
        is_active: true,
        display_order: 0,
    });

    const { success, error: toastError } = useToast();

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        testimonialId: "",
    });

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const fetchTestimonials = async () => {
        setIsLoading(true);
        try {
            const data = await testimonialService.getAll();
            setTestimonials(data);
        } catch (error) {
            console.error("Error fetching testimonials:", error);
            toastError("Erreur lors du chargement des témoignages.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (testimonial?: Testimonial) => {
        if (testimonial) {
            setEditingTestimonial(testimonial);
            setFormData({
                name: testimonial.name,
                role: testimonial.role || "",
                content: testimonial.content,
                rating: testimonial.rating,
                is_active: testimonial.is_active,
                display_order: testimonial.display_order,
            });
        } else {
            setEditingTestimonial(null);
            setFormData({
                name: "",
                role: "",
                content: "",
                rating: 5,
                is_active: true,
                display_order: testimonials.length + 1,
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingTestimonial) {
                await testimonialService.update(editingTestimonial.id, formData);
                success("Témoignage mis à jour avec succès !");
            } else {
                await testimonialService.create(formData);
                success("Témoignage créé avec succès !");
            }
            setIsModalOpen(false);
            fetchTestimonials();
        } catch (error) {
            console.error("Error saving testimonial:", error);
            toastError("Erreur lors de l'enregistrement.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        setConfirmModal({ isOpen: true, testimonialId: id });
    };

    const confirmDelete = async () => {
        try {
            await testimonialService.delete(confirmModal.testimonialId);
            success("Témoignage supprimé.");
            fetchTestimonials();
        } catch (error) {
            console.error("Error deleting testimonial:", error);
            toastError("Erreur lors de la suppression.");
        } finally {
            setConfirmModal({ isOpen: false, testimonialId: "" });
        }
    };

    const filteredTestimonials = testimonials.filter(
        (t) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.role?.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    if (isLoading) return <LoadingSpinner fullPage />;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Gestion des Témoignages"
                subtitle={`${testimonials.length} témoignages configurés`}
                action={{
                    label: "Ajouter un témoignage",
                    onClick: () => handleOpenModal(),
                    icon: Plus,
                }}
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Star className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Témoignages</p>
                            <p className="text-2xl font-bold text-gray-900">{testimonials.length}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Actifs</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {testimonials.filter((t) => t.is_active).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                            <Star className="w-6 h-6 fill-current" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Note Moyenne</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {(
                                    testimonials.reduce((acc, t) => acc + t.rating, 0) /
                                    (testimonials.length || 1)
                                ).toFixed(1)}
                                /5
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un témoignage..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-primary text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Client</th>
                                <th className="px-6 py-4 font-semibold">Témoignage</th>
                                <th className="px-6 py-4 font-semibold">Note</th>
                                <th className="px-6 py-4 font-semibold">Statut</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTestimonials.map((testimonial) => (
                                <tr key={testimonial.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden">
                                                {testimonial.avatar_url ? (
                                                    <img
                                                        src={testimonial.avatar_url}
                                                        alt={testimonial.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <User className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{testimonial.name}</p>
                                                <p className="text-xs text-gray-500">{testimonial.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-600 line-clamp-2 max-w-md">
                                            {testimonial.content}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1">
                                            {[1, 2, 3, 4, 5].map((s) => (
                                                <Star
                                                    key={s}
                                                    className={`w-4 h-4 ${s <= testimonial.rating
                                                        ? "text-yellow-400 fill-current"
                                                        : "text-gray-200"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {testimonial.is_active ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-full text-xs font-medium">
                                                <CheckCircle className="w-3 h-3" /> Actif
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs font-medium">
                                                <XCircle className="w-3 h-3" /> Inactif
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenModal(testimonial)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Modifier"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(testimonial.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredTestimonials.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        Aucun témoignage trouvé
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Création/Édition */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm px-4">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingTestimonial ? "Modifier le Témoignage" : "Ajouter un Témoignage"}
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
                                        Nom du client
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-primary"
                                        placeholder="Ex: Jean Dupont"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Rôle / Entreprise
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-primary"
                                        placeholder="Ex: Importateur Textile"
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Commentaire
                                </label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-primary resize-none"
                                    placeholder="Le contenu du témoignage..."
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Note (1-5)
                                    </label>
                                    <select
                                        id="testimonial-rating"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-primary"
                                        value={formData.rating}
                                        title="Sélectionner une note"
                                        onChange={(e) =>
                                            setFormData({ ...formData, rating: parseInt(e.target.value) })
                                        }
                                    >
                                        {[5, 4, 3, 2, 1].map((n) => (
                                            <option key={n} value={n}>
                                                {n} Étoiles
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Ordre d'affichage
                                    </label>
                                    <input
                                        id="testimonial-order"
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
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Statut
                                    </label>
                                    <div className="flex items-center gap-4 py-3">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                                                checked={formData.is_active}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, is_active: e.target.checked })
                                                }
                                            />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">Actif</span>
                                        </label>
                                    </div>
                                </div>
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
                                    {isSubmitting
                                        ? "Enregistrement..."
                                        : editingTestimonial
                                            ? "Mettre à jour"
                                            : "Créer le témoignage"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, testimonialId: "" })}
                onConfirm={confirmDelete}
                title="Supprimer le témoignage ?"
                message="Cette action est irréversible. Le témoignage ne sera plus affiché sur le site."
                confirmLabel="Supprimer"
                variant="danger"
            />
        </div>
    );
}
