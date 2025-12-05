import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { Package, Plus, Search, Check, X, Trash2, AlertCircle } from 'lucide-react';
import { packageTypeService, PackageType } from '../../../services/packageTypeService';

export default function AdminPackageTypes() {
    const [types, setTypes] = useState<PackageType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'pending'>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newTypeLabel, setNewTypeLabel] = useState('');

    useEffect(() => {
        loadTypes();
    }, []);

    const loadTypes = async () => {
        setLoading(true);
        try {
            const data = await packageTypeService.getAllPackageTypes();
            setTypes(data);
        } catch (error) {
            console.error('Error loading package types:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir approuver ce type de colis ?')) {
            await packageTypeService.approvePackageType(id);
            loadTypes();
        }
    };

    const handleReject = async (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir rejeter ce type de colis ?')) {
            await packageTypeService.rejectPackageType(id);
            loadTypes();
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce type de colis ?')) {
            await packageTypeService.deletePackageType(id);
            loadTypes();
        }
    };

    const handleAddType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTypeLabel.trim()) return;

        await packageTypeService.addPackageType(newTypeLabel);
        setNewTypeLabel('');
        setIsAddModalOpen(false);
        loadTypes();
    };

    const filteredTypes = types.filter(t => {
        const matchesSearch = t.label.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        if (filter === 'active') return t.status === 'active';
        if (filter === 'pending') return t.status === 'pending';
        return true;
    });

    return (
        <div className="space-y-8 pb-12">
            <PageHeader
                title="Gestion des Types de Colis"
                subtitle="Gérez les types de colis disponibles sur la plateforme"
                action={{
                    label: "Ajouter un Type",
                    onClick: () => setIsAddModalOpen(true),
                    icon: Plus
                }}
            />

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Tous
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'active' ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Actifs
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'pending' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        En Attente
                        {types.filter(t => t.status === 'pending').length > 0 && (
                            <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                                {types.filter(t => t.status === 'pending').length}
                            </span>
                        )}
                    </button>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un type..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Type de Colis</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Statut</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Ajouté le</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">Chargement...</td>
                                </tr>
                            ) : filteredTypes.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">Aucun type de colis trouvé</td>
                                </tr>
                            ) : (
                                filteredTypes.map((type) => (
                                    <tr key={type.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <Package size={20} />
                                                </div>
                                                <span className="font-medium text-gray-900">{type.label}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${type.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    type.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                {type.status === 'active' ? 'Actif' : type.status === 'pending' ? 'En Attente' : 'Rejeté'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {new Date(type.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {type.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(type.id)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Approuver"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(type.id)}
                                                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                            title="Rejeter"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(type.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">Ajouter un Type de Colis</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddType} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Type</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Palette Euro"
                                    className="w-full rounded-xl border-gray-200 focus:border-primary focus:ring-primary p-2.5"
                                    value={newTypeLabel}
                                    onChange={e => setNewTypeLabel(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
                                >
                                    Ajouter
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
