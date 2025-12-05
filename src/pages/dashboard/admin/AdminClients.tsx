import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import {
    Users,
    Search,
    Mail,
    Phone,
    MapPin,
    MoreVertical,
    Eye,
    Building
} from 'lucide-react';
import { personnelService } from '../../../services/personnelService';
import { useToast } from '../../../contexts/ToastContext';

export default function AdminClients() {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { error: toastError } = useToast();

    const fetchClients = async () => {
        setLoading(true);
        try {
            const data = await personnelService.getClients();
            setClients(data);
        } catch (error) {
            console.error('Error fetching clients:', error);
            toastError('Erreur lors du chargement des clients');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, []);

    const filteredClients = clients.filter(c => {
        const matchesSearch =
            (c.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (c.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (c.company_name?.toLowerCase() || '').includes(searchQuery.toLowerCase());

        return matchesSearch;
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Gestion des Clients"
                subtitle="Consultez la liste des clients inscrits"
            />

            {/* Filters */}
            <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
                <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher un client..."
                        className="w-full pl-9 pr-8 py-2 bg-transparent hover:bg-gray-50 focus:bg-white border border-transparent focus:border-primary/20 rounded-xl text-sm focus:outline-none transition-all"
                    />
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Localisation</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Inscription</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredClients.map((c) => (
                                    <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold">
                                                    {c.full_name?.charAt(0) || 'C'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{c.full_name || 'Client'}</p>
                                                    {c.company_name && (
                                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                                            <Building className="w-3 h-3" />
                                                            {c.company_name}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail className="w-3 h-3 text-gray-400" />
                                                    {c.email}
                                                </div>
                                                {c.phone && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Phone className="w-3 h-3 text-gray-400" />
                                                        {c.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {c.country || c.address ? (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <MapPin className="w-3 h-3 text-gray-400" />
                                                    {c.country} {c.address && `- ${c.address}`}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(c.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                                                <MoreVertical className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredClients.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="p-4 bg-gray-50 rounded-full mb-3">
                                                    <Users className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <p>Aucun client trouvé</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
