import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import CreateUserModal from '../../../components/admin/CreateUserModal';
import UserProfileModal from '../../../components/admin/UserProfileModal';
import { useToast } from '../../../contexts/ToastContext';
import {
    User,
    Search,
    Filter,
    MoreVertical,
    Shield,
    Calendar,
    X,
    Users,
    UserCheck,
    UserPlus,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

export default function UserManagement() {
    const { success, error: toastError } = useToast();
    // Data State
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '3m' | '1y' | 'all' | 'custom'>('30d');
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    // Stats State
    const [stats, setStats] = useState({
        total: { value: 0, trend: '+0%', trendUp: true },
        active: { value: 0, trend: '+0%', trendUp: true },
        new: { value: 0, trend: '+0%', trendUp: true }
    });

    // Fetch Users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            // Dynamic import to avoid circular dependencies if any
            const { profileService } = await import('../../../services/profileService');
            const data = await profileService.getAllProfiles();

            // Map profile data to UI format
            const mappedUsers = data.map(p => ({
                id: p.id,
                friendly_id: p.friendly_id,
                name: p.full_name || p.email.split('@')[0],
                email: p.email,
                role: p.role ? (p.role.charAt(0).toUpperCase() + p.role.slice(1)) : 'Client',
                status: p.account_status === 'active' ? 'Actif' : (p.account_status === 'suspended' ? 'Suspendu' : 'Inactif'),
                joined_at: (p as any).created_at || new Date().toISOString(),
                phone: p.phone || '-',
                company: p.company_name || '-',
                location: p.country || '-'
            }));

            setUsers(mappedUsers);
            setFilteredUsers(mappedUsers);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (userId: string, currentStatus: string) => {
        try {
            const { profileService } = await import('../../../services/profileService');
            // If currently active, suspend. If suspended or inactive, activate.
            const newStatus = currentStatus === 'Actif' ? 'suspended' : 'active';
            await profileService.updateStatus(userId, newStatus);
            await fetchUsers();
            success(`Utilisateur ${newStatus === 'active' ? 'activé' : 'suspendu'} avec succès.`);
        } catch (err) {
            console.error(err);
            toastError('Erreur lors de la mise à jour du statut.');
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Apply Filters
    useEffect(() => {
        let result = [...users];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(u =>
                u.name.toLowerCase().includes(query) ||
                u.email.toLowerCase().includes(query)
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter(u => u.status === statusFilter);
        }

        // Mock time range filtering (keep logic for now)
        if (timeRange !== 'all') {
            // In a real app, filter by joined_at
            // For demo, we'll just slice to show visual change
            // if (timeRange === '7d') result = result.slice(0, 3);
        }

        setFilteredUsers(result);

        // Update Stats based on filtered data
        setStats({
            total: {
                value: result.length,
                trend: '+0%',
                trendUp: true
            },
            active: {
                value: result.filter(u => u.status === 'Actif').length,
                trend: '+0%',
                trendUp: true
            },
            new: {
                value: result.length, // Simplified for now
                trend: '+0%',
                trendUp: true
            }
        });

    }, [users, searchQuery, timeRange, customDateRange, statusFilter]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Gestion des Utilisateurs"
                subtitle="Gérez les comptes clients, transitaires et administrateurs"
                action={{
                    label: "Ajouter un utilisateur",
                    onClick: () => setIsCreateModalOpen(true),
                    icon: User
                }}
            />

            {/* Unified Filter Segment */}
            <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 inline-flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
                {/* Time Range Segmented Control */}
                <div className="flex bg-gray-50 rounded-xl p-1">
                    {[
                        { id: '7d', label: '7J' },
                        { id: '30d', label: '30J' },
                        { id: '3m', label: '3M' },
                        { id: '1y', label: '1A' },
                        { id: 'all', label: 'Tout' },
                        { id: 'custom', icon: Calendar },
                    ].map((period) => (
                        <button
                            key={period.id}
                            onClick={() => setTimeRange(period.id as any)}
                            className={`
                                px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                                ${timeRange === period.id
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                                }
                            `}
                            title={period.id === 'custom' ? 'Période personnalisée' : undefined}
                        >
                            {period.icon ? <period.icon className="w-4 h-4" /> : period.label}
                        </button>
                    ))}
                </div>

                {/* Status Filter Dropdown */}
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="pl-9 pr-8 py-2 bg-gray-50 border border-transparent hover:bg-white hover:border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer min-w-[140px]"
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="Actif">Actif</option>
                        <option value="Inactif">Inactif</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                {/* Custom Date Inputs */}
                {timeRange === 'custom' && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-200 bg-gray-50 p-1 rounded-xl">
                        <input
                            type="date"
                            value={customDateRange.start}
                            onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                            className="pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-28"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={customDateRange.end}
                            onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                            className="pl-2 pr-1 py-1 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-28"
                        />
                    </div>
                )}

                <div className="w-px bg-gray-100 hidden sm:block mx-1 h-8"></div>

                {/* Search */}
                <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher par nom, email..."
                        className="w-full pl-9 pr-8 py-2 bg-transparent hover:bg-gray-50 focus:bg-white border border-transparent focus:border-primary/20 rounded-xl text-sm focus:outline-none transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Users className="w-6 h-6" />
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.total.trendUp ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                            {stats.total.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {stats.total.trend}
                        </span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Utilisateurs Totaux</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total.value}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                            <UserCheck className="w-6 h-6" />
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.active.trendUp ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                            {stats.active.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {stats.active.trend}
                        </span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Utilisateurs Actifs</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.active.value}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <UserPlus className="w-6 h-6" />
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.new.trendUp ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                            {stats.new.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {stats.new.trend}
                        </span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Nouveaux Utilisateurs</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.new.value}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date d'inscription</th>
                            <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-sm overflow-hidden shrink-0">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                            <div className="text-sm text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${user.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                                            user.role === 'Transitaire' ? 'bg-orange-100 text-orange-800' :
                                                'bg-blue-100 text-blue-800'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${user.status === 'Actif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(user.joined_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="relative">
                                        <button
                                            onClick={() => setActiveMenu(activeMenu === user.id ? null : user.id)}
                                            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                                        >
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                        {activeMenu === user.id && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setActiveMenu(null)}
                                                ></div>
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 animate-in fade-in zoom-in duration-200">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedUser(user);
                                                            setIsCreateModalOpen(false);
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                    >
                                                        <User className="w-4 h-4" /> Voir profil
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm(`Promouvoir ${user.name} en Transitaire ?`)) {
                                                                try {
                                                                    const { profileService } = await import('../../../services/profileService');
                                                                    await profileService.upgradeToForwarder(user.id);
                                                                    await fetchUsers();
                                                                    success('Utilisateur promu transitaire avec succès !');
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    toastError('Erreur lors de la mise à jour.');
                                                                }
                                                            }
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                                    >
                                                        <Shield className="w-4 h-4" /> Promouvoir Transitaire
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm(`Supprimer définitivement ${user.name} ?`)) {
                                                                try {
                                                                    // We use supabase directly for deletion as it's not in profileService
                                                                    const { supabase } = await import('../../../lib/supabase');
                                                                    const { error } = await supabase.from('profiles').delete().eq('id', user.id);
                                                                    if (error) throw error;
                                                                    await fetchUsers();
                                                                    success('Utilisateur supprimé.');
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    toastError('Erreur: Impossible de supprimer (peut-être des données liées).');
                                                                }
                                                            }
                                                            setActiveMenu(null);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                    >
                                                        <X className="w-4 h-4" /> Supprimer
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="p-4 bg-gray-50 rounded-full mb-3">
                                            <Search className="w-8 h-8 text-gray-400" />
                                        </div>
                                        <p>Aucun utilisateur trouvé</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isCreateModalOpen && (
                <CreateUserModal
                    user={selectedUser}
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setSelectedUser(null);
                    }}
                    onSuccess={() => {
                        // Refresh logic would go here
                        setSelectedUser(null);
                    }}
                />
            )}

            {selectedUser && !isCreateModalOpen && (
                <UserProfileModal
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onEdit={() => setIsCreateModalOpen(true)}
                    onToggleStatus={() => handleToggleStatus(selectedUser.id, selectedUser.status)}
                />
            )}
        </div>
    );
}
