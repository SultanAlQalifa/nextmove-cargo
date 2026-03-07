import { useState, useEffect } from "react";
import {
    Plus,
    ChevronRight,
    ChevronDown,
    Edit2,
    Trash2,
    Folder,
    Package,
    Zap,
    Ship,
    Plane,
    Truck,
    ShoppingBag,
    Clock,
    Box,
    Network,
    Eye,
    Settings2,
    Save,
    X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "../../../components/common/PageHeader";
import { serviceBranchService, ServiceBranch } from "../../../services/serviceBranchService";
import { showNotification } from "../../../components/common/NotificationToast";
import ConfirmationModal from "../../../components/common/ConfirmationModal";

const ICON_MAP: Record<string, any> = {
    Plane,
    Ship,
    Truck,
    ShoppingBag,
    Zap,
    Clock,
    Box,
    Package,
    Folder,
    Network
};

export default function AdminTreeBuilder() {
    const [tree, setTree] = useState<ServiceBranch[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingNode, setEditingNode] = useState<ServiceBranch | null>(null);
    const [parentIdForNewNode, setParentIdForNewNode] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<ServiceBranch>>({
        name: "",
        slug: "",
        icon: "Folder",
        description: "",
        is_active: true,
        position: 0
    });

    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        id: string | null;
    }>({ isOpen: false, id: null });

    useEffect(() => {
        loadTree();
    }, []);

    const loadTree = async () => {
        setLoading(true);
        try {
            const data = await serviceBranchService.getTree();
            setTree(data);
        } catch (error) {
            console.error("Error loading tree:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleNode = (id: string) => {
        const newExpandedResponse = new Set(expandedNodes);
        if (newExpandedResponse.has(id)) {
            newExpandedResponse.delete(id);
        } else {
            newExpandedResponse.add(id);
        }
        setExpandedNodes(newExpandedResponse);
    };

    const handleOpenModal = (node?: ServiceBranch, parentId: string | null = null) => {
        if (node) {
            setEditingNode(node);
            setFormData(node);
            setParentIdForNewNode(null);
        } else {
            setEditingNode(null);
            setParentIdForNewNode(parentId);
            setFormData({
                name: "",
                slug: "",
                icon: "Folder",
                description: "",
                is_active: true,
                position: 0,
                parent_id: parentId
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingNode) {
                await serviceBranchService.updateBranch(editingNode.id, formData);
                showNotification("Succès", "Branche mise à jour", "success"); // Changed notification
            } else {
                await serviceBranchService.createBranch(formData as any);
                showNotification("Succès", "Branche créée", "success"); // Changed notification
            }
            loadTree();
            setIsModalOpen(false);
        } catch (error: any) {
            showNotification("Erreur", error.message || "Erreur lors de la sauvegarde", "error"); // Changed notification
        }
    };

    const handleDelete = (id: string) => {
        setConfirmation({ isOpen: true, id });
    };

    const confirmDelete = async () => {
        if (confirmation.id) {
            try {
                await serviceBranchService.deleteBranch(confirmation.id);
                showNotification("Succès", "Branche supprimée", "success"); // Changed notification
                loadTree();
            } catch (error: any) {
                showNotification("Erreur", error.message || "Erreur lors de la suppression", "error"); // Changed notification
            }
            setConfirmation({ isOpen: false, id: null });
        }
    };

    const renderNode = (node: ServiceBranch, depth = 0) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const Icon = ICON_MAP[node.icon || "Folder"] || Folder;

        return (
            <div key={node.id} className="select-none">
                <motion.div
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`group flex items-center py-2 px-3 rounded-xl transition-all hover:bg-white/50 dark:hover:bg-slate-800/50 border border-transparent hover:border-primary/10 mb-1 ${!node.is_active ? 'opacity-50' : ''}`}
                    style={{ marginLeft: `${depth * 24}px` }}
                >
                    <div
                        className="flex items-center gap-3 flex-1 cursor-pointer"
                        onClick={() => hasChildren ? toggleNode(node.id) : null}
                    >
                        <div className="w-6 h-6 flex items-center justify-center">
                            {hasChildren ? (
                                isExpanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />
                            ) : (
                                <div className="w-1 h-1 bg-gray-300 rounded-full" />
                            )}
                        </div>

                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${node.parent_id === null ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-500'}`}>
                            <Icon size={16} />
                        </div>

                        <div className="flex flex-col">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                {node.name}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">
                                /{node.slug}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => handleOpenModal(undefined, node.id)}
                            className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Ajouter une sous-branche"
                        >
                            <Plus size={14} />
                        </button>
                        <button
                            onClick={() => handleOpenModal(node)}
                            className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                            title="Modifier"
                        >
                            <Edit2 size={14} />
                        </button>
                        <button
                            onClick={() => handleDelete(node.id)}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Supprimer"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                </motion.div>

                <AnimatePresence>
                    {isExpanded && hasChildren && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            {node.children?.map(child => renderNode(child, depth + 1))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-20">
            <PageHeader
                title="Arborescence des Services"
                subtitle="Modélisez la hiérarchie des services et branches logistiques"
                // Removed icon={LayoutTree}
                action={{
                    label: "Nouvelle Branche Racine",
                    onClick: () => handleOpenModal(),
                    icon: Plus,
                }}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Tree View */}
                <div className="lg:col-span-8">
                    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-gray-100 dark:border-slate-800 p-6 shadow-xl shadow-slate-200/50 dark:shadow-none min-h-[500px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-[400px] gap-4">
                                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                <span className="text-sm text-gray-400">Génération de l'arborescence...</span>
                            </div>
                        ) : tree.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[400px] text-center">
                                <div className="w-16 h-16 bg-gray-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-gray-400 mb-4">
                                    <Network size={32} /> {/* Changed icon from LayoutTree to Network */}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Aucune branche détectée</h3>
                                <p className="text-gray-500 max-w-xs mt-2">Commencez par créer une branche racine (ex: Fret Aérien) pour construire votre structure.</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {tree.map(node => renderNode(node))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Info/Preview Panel */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-gradient-to-br from-primary to-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-primary/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Zap size={80} />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Structure Intelligente</h3>
                        <p className="text-white/80 text-sm leading-relaxed mb-4">
                            Cette arborescence définit le flux utilisateur dans le "Decision Tree". Chaque branche peut porter des tarifs, documents requis et métadonnées spécifiques.
                        </p>
                        <div className="flex items-center gap-4 text-xs font-medium">
                            <div className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
                                <Eye size={12} />
                                Temps réel
                            </div>
                            <div className="bg-white/20 px-3 py-1 rounded-full flex items-center gap-1">
                                <Settings2 size={12} />
                                Dynamique
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 p-6 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Statistiques</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Branches totales</span>
                                <span className="font-bold text-primary">{tree.length + tree.reduce((acc, n) => acc + (n.children?.length || 0), 0)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Niveaux de profondeur</span>
                                <span className="font-bold text-indigo-500">2</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Dernière mise à jour</span>
                                <span className="text-xs text-gray-400">{new Date().toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Node Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-lg shadow-2xl border border-white/20 overflow-hidden"
                    >
                        <div className="p-8 pb-0">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {editingNode ? "Modifier la Branche" : "Nouvelle Branche"}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {parentIdForNewNode ? "Ajout d'une sous-branche" : "Branche de niveau racine"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Fermer"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nom de la branche</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') })}
                                            className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            placeholder="Ex: Fret Aérien Premium"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">ID (Slug unique)</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.slug}
                                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-xs font-mono text-gray-600 dark:text-slate-400 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            placeholder="air-premium"
                                        />
                                    </div>

                                    <div>
                                        <label id="icon-select-label" className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Icône</label>
                                        <select
                                            value={formData.icon}
                                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                            aria-labelledby="icon-select-label"
                                            title="Choisir une icône"
                                        >
                                            {Object.keys(ICON_MAP).map(key => (
                                                <option key={key} value={key}>{key}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Description</label>
                                    <textarea
                                        value={formData.description || ""}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-gray-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none h-24 resize-none transition-all"
                                        placeholder="Détails sur ce mode de transport ou service..."
                                    />
                                </div>

                                <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-800 p-4 rounded-2xl">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">État de la branche</span>
                                        <span className="text-xs text-gray-500">Rendre visible par les utilisateurs</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${formData.is_active ? 'bg-primary' : 'bg-gray-300'}`}
                                        title={formData.is_active ? "Désactiver" : "Activer"}
                                    >
                                        <motion.div
                                            layout
                                            className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full"
                                            animate={{ x: formData.is_active ? 24 : 0 }}
                                        />
                                    </button>
                                </div>

                                <div className="flex gap-3 pt-4 p-8 bg-gray-50 dark:bg-slate-900/50 -mx-8">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-4 px-6 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-4 px-6 bg-primary hover:bg-primary/90 text-white rounded-2xl font-bold shadow-lg shadow-primary/30 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Save size={18} />
                                        {editingNode ? "Enregistrer les modifications" : "Créer la branche"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
                title="Supprimer cette branche ?"
                message="Attention : la suppression d'une branche entraîne la suppression de toutes ses sous-branches de manière définitive."
                variant="danger"
                confirmLabel="Supprimer"
            />
        </div>
    );
}
