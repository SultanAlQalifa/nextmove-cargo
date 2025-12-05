import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { MapPin, Plus, Search, Check, X, Trash2, Globe, AlertCircle } from 'lucide-react';
import { locationService, Location } from '../../../services/locationService';

export default function AdminLocations() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'pending'>('all');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newLocationName, setNewLocationName] = useState('');

    useEffect(() => {
        loadLocations();
    }, []);

    const loadLocations = async () => {
        setLoading(true);
        try {
            const data = await locationService.getAllLocations();
            setLocations(data);
        } catch (error) {
            console.error('Error loading locations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir approuver cette destination ?')) {
            await locationService.approveLocation(id);
            loadLocations();
        }
    };

    const handleReject = async (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir rejeter cette destination ?')) {
            await locationService.rejectLocation(id);
            loadLocations();
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette destination ?')) {
            await locationService.deleteLocation(id);
            loadLocations();
        }
    };

    const handleAddLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLocationName.trim()) return;

        await locationService.addLocation(newLocationName, 'country');
        setNewLocationName('');
        setIsAddModalOpen(false);
        loadLocations();
    };

    const filteredLocations = locations.filter(loc => {
        const matchesSearch = loc.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;
        if (filter === 'active') return loc.status === 'active';
        if (filter === 'pending') return loc.status === 'pending';
        return true;
    });

    return (
        <div className="space-y-8 pb-12">
            <PageHeader
                title="Gestion des Destinations"
                subtitle="Gérez les pays et ports disponibles sur la plateforme"
                action={{
                    label: "Ajouter une Destination",
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
                        Toutes
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'active' ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        Actives
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'pending' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        En Attente
                        {locations.filter(l => l.status === 'pending').length > 0 && (
                            <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                                {locations.filter(l => l.status === 'pending').length}
                            </span>
                        )}
                    </button>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Rechercher un pays..."
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
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Pays / Destination</th>
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
                            ) : filteredLocations.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">Aucune destination trouvée</td>
                                </tr>
                            ) : (
                                filteredLocations.map((loc) => (
                                    <tr key={loc.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                                    <Globe size={20} />
                                                </div>
                                                <span className="font-medium text-gray-900">{loc.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${loc.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    loc.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                {loc.status === 'active' ? 'Active' : loc.status === 'pending' ? 'En Attente' : 'Rejetée'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500">
                                            {new Date(loc.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {loc.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(loc.id)}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Approuver"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(loc.id)}
                                                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                            title="Rejeter"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(loc.id)}
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
                            <h3 className="text-lg font-bold text-gray-900">Ajouter une Destination</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddLocation} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du Pays</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ex: Japon"
                                    className="w-full rounded-xl border-gray-200 focus:border-primary focus:ring-primary p-2.5"
                                    value={newLocationName}
                                    onChange={e => setNewLocationName(e.target.value)}
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
