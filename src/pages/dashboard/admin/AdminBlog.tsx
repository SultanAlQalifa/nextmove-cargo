import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
    Newspaper,
    Plus,
    Search,
    Edit2,
    Trash2,
    Image as ImageIcon,
    Calendar,
    Tag,
    ExternalLink,
    Save,
    X,
    Loader2,
} from "lucide-react";
import { blogService, BlogPost } from "../../../services/blogService";
import { storageService } from "../../../services/storageService";
import { useToast } from "../../../contexts/ToastContext";
import LoadingSpinner from "../../../components/common/LoadingSpinner";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import RichEditor from "../../../components/common/RichEditor";

export default function AdminBlog() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        slug: "",
        category: "Conseils",
        excerpt: "",
        content: "",
        featured_image: "",
    });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");

    const { success, error: toastError } = useToast();

    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        postId: "",
    });

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const data = await blogService.getPosts();
            setPosts(data);
        } catch (error) {
            console.error("Error fetching posts:", error);
            toastError("Erreur lors du chargement des articles");
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (post?: BlogPost) => {
        if (post) {
            setEditingPost(post);
            setFormData({
                title: post.title,
                slug: post.slug,
                category: post.category,
                excerpt: post.excerpt,
                content: post.content,
                featured_image: post.featured_image,
            });
            setImagePreview(post.featured_image);
        } else {
            setEditingPost(null);
            setFormData({
                title: "",
                slug: "",
                category: "Conseils",
                excerpt: "",
                content: "",
                featured_image: "",
            });
            setImagePreview("");
        }
        setImageFile(null);
        setIsModalOpen(true);
    };

    const handleSlugify = (title: string) => {
        return title
            .toLowerCase()
            .replace(/[^\w ]+/g, "")
            .replace(/ +/g, "-");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            let imageUrl = formData.featured_image;

            if (imageFile) {
                imageUrl = await storageService.uploadBlogImage(imageFile);
            }

            const postData = {
                ...formData,
                featured_image: imageUrl,
            };

            if (editingPost) {
                await blogService.updatePost(editingPost.id, postData);
                success("Article mis à jour avec succès");
            } else {
                await blogService.createPost(postData);
                success("Article créé avec succès");
            }

            setIsModalOpen(false);
            fetchPosts();
        } catch (error: any) {
            console.error("Error saving post:", error);
            toastError(error.message || "Erreur lors de l'enregistrement");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await blogService.deletePost(id);
            success("Article supprimé");
            fetchPosts();
        } catch (error) {
            console.error("Error deleting post:", error);
            toastError("Erreur lors de la suppression");
        }
    };

    const filteredPosts = posts.filter(
        (post) =>
            post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.category.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <PageHeader
                title="Gestion du Blog"
                subtitle="Créez et gérez vos articles pour la plateforme"
                action={{
                    label: "Nouvel Article",
                    icon: Plus,
                    onClick: () => handleOpenModal(),
                }}
            />

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher un article..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {isLoading ? (
                    <div className="p-20 flex justify-center">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="p-20 text-center text-gray-500">
                        <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>Aucun article trouvé</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">
                                    <th className="px-6 py-4">Article</th>
                                    <th className="px-6 py-4">Catégorie</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredPosts.map((post) => (
                                    <tr
                                        key={post.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                    <img
                                                        src={post.featured_image}
                                                        className="w-full h-full object-cover"
                                                        alt=""
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 dark:text-white line-clamp-1">
                                                        {post.title}
                                                    </div>
                                                    <div className="text-xs text-gray-500 line-clamp-1">
                                                        /{post.slug}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                                                {post.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500">
                                                {new Date(post.published_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <a
                                                    href={`/blog/${post.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-gray-400 hover:text-primary transition-colors"
                                                    title="Voir l'article sur le site"
                                                >
                                                    <ExternalLink className="w-5 h-5" />
                                                </a>
                                                <button
                                                    onClick={() => handleOpenModal(post)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                                    title="Modifier l'article"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setConfirmModal({ isOpen: true, postId: post.id })
                                                    }
                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                    title="Supprimer l'article"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal create/edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {editingPost ? "Modifier l'article" : "Nouvel Article"}
                                    </h3>
                                    <p className="text-gray-500">
                                        Remplissez les informations de votre contenu
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                    title="Fermer le formulaire"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                Titre de l'article
                                            </label>
                                            <input
                                                id="blog-title"
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-primary"
                                                placeholder="Titre de l'article"
                                                value={formData.title}
                                                onChange={(e) => {
                                                    const title = e.target.value;
                                                    setFormData({
                                                        ...formData,
                                                        title,
                                                        slug: editingPost
                                                            ? formData.slug
                                                            : handleSlugify(title),
                                                    });
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                URL (Slug)
                                            </label>
                                            <input
                                                id="blog-slug"
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-primary"
                                                placeholder="URL (slug)"
                                                value={formData.slug}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, slug: e.target.value })
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                Catégorie
                                            </label>
                                            <select
                                                id="blog-category"
                                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-primary"
                                                value={formData.category}
                                                title="Sélectionner une catégorie"
                                                onChange={(e) =>
                                                    setFormData({ ...formData, category: e.target.value })
                                                }
                                            >
                                                <option value="Conseils">Conseils</option>
                                                <option value="Guide">Guide</option>
                                                <option value="Technologie">Technologie</option>
                                                <option value="Actualité">Actualité</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                                Image à la une
                                            </label>
                                            <div className="relative group aspect-video rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900 flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary transition-colors cursor-pointer">
                                                {imagePreview ? (
                                                    <>
                                                        <img
                                                            src={imagePreview}
                                                            className="w-full h-full object-cover"
                                                            alt="Preview"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <ImageIcon className="w-10 h-10 text-white" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-center">
                                                        <ImageIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                                        <div className="text-xs text-gray-500">
                                                            Cliquez pour uploader
                                                        </div>
                                                    </div>
                                                )}
                                                <input
                                                    id="featured_image"
                                                    type="file"
                                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                                    accept="image/*"
                                                    title="Télécharger une image à la une"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            setImageFile(file);
                                                            setImagePreview(URL.createObjectURL(file));
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        Résumé (Excerpt)
                                    </label>
                                    <textarea
                                        required
                                        rows={3}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-primary"
                                        placeholder="Une courte description pour la carte de l'article..."
                                        value={formData.excerpt}
                                        onChange={(e) =>
                                            setFormData({ ...formData, excerpt: e.target.value })
                                        }
                                    />
                                </div>

                                <div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                            Contenu complet
                                        </label>
                                        <RichEditor
                                            value={formData.content}
                                            onChange={(html) => setFormData({ ...formData, content: html })}
                                            placeholder="Rédigez votre article ici..."
                                            className="h-[500px]"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl font-bold hover:bg-gray-200 transition-all"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Enregistrement...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" />
                                                Enregistrer
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {confirmModal.isOpen && (
                <ConfirmationModal
                    isOpen={confirmModal.isOpen}
                    title="Supprimer l'article ?"
                    message="Cette action est irréversible. L'article sera définitivement retiré du blog."
                    variant="danger"
                    onConfirm={() => handleDelete(confirmModal.postId)}
                    onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                />
            )}
        </div>
    );
}
