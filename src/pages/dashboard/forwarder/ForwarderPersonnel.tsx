import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import {
    Users,
    UserPlus,
    Mail,
    Shield,
    MoreVertical,
    Power,
    Search,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Briefcase,
    Clock,
    Download,
    Edit2,
    Check
} from 'lucide-react';
import { personnelService, StaffMember, Role } from '../../../services/personnelService';
import AddStaffModal from '../../../components/admin/AddStaffModal';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import { exportToCSV } from '../../../utils/exportUtils';
import UnifiedFilterSegment from '../../../components/dashboard/UnifiedFilterSegment';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

export default function ForwarderPersonnel() {
    const { error: toastError } = useToast();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('members');
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals State
    const [showAddStaffModal, setShowAddStaffModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

    // Filter State
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '3m' | '1y' | 'all' | 'custom'>('30d');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'activate' | 'deactivate' | null;
        id: string | null;
        title: string;
        message: string;
        variant: 'danger' | 'warning' | 'info' | 'success';
    }>({
        isOpen: false,
        type: null,
        id: null,
        title: '',
        message: '',
        variant: 'info'
    });

    // Stats State
    const [stats, setStats] = useState({
        total: { value: 0, trend: '+0', trendUp: true },
        active: { value: 0, trend: '+0%', trendUp: true },
        departments: { value: 0, trend: '0', trendUp: true }
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [staffData, rolesData] = await Promise.all([
                personnelService.getForwarderStaff(),
                personnelService.getRoles()
            ]);

            // Add custom "Driver" role if not present in DB roles yet
            // This ensures the UI shows it even if backend roles aren't fully seeded
            const driverRoleExists = rolesData.some(r => r.id === 'driver' || r.name.toLowerCase() === 'chauffeur');
            if (!driverRoleExists) {
                rolesData.push({
                    id: 'driver',
                    name: 'Chauffeur',
                    description: 'Livreur assigné aux expéditions',
                    permissions: [],
                    is_system: true
                });
            }

            setStaff(staffData);
            setRoles(rolesData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    // Apply Filters and Update Stats
    useEffect(() => {
        let result = [...staff];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(query) ||
                s.email.toLowerCase().includes(query) ||
                s.role.toLowerCase().includes(query)
            );
        }

        if (statusFilter !== 'all') {
            result = result.filter(s => s.status === statusFilter);
        }

        setFilteredStaff(result);

        // Update Stats
        const activeCount = result.filter(s => s.status === 'active').length;
        const uniqueRoles = new Set(result.map(s => s.role)).size;

        setStats({
            total: {
                value: result.length,
                trend: '+0', // Mock trend
                trendUp: true
            },
            active: {
                value: activeCount,
                trend: '+0%',
                trendUp: true
            },
            departments: {
                value: uniqueRoles,
                trend: '0',
                trendUp: true
            }
        });

    }, [searchQuery, timeRange, staff, statusFilter]);

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        setConfirmModal({
            isOpen: true,
            type: newStatus === 'active' ? 'activate' : 'deactivate',
            id,
            title: newStatus === 'active' ? 'Activer le compte' : 'Désactiver le compte',
            message: newStatus === 'active'
                ? "Êtes-vous sûr de vouloir activer ce compte ? L'utilisateur pourra accéder au système."
                : "Êtes-vous sûr de vouloir désactiver ce compte ? L'utilisateur ne pourra plus se connecter.",
            variant: newStatus === 'active' ? 'success' : 'danger'
        });
        setActiveMenu(null);
    };

    const handleConfirmAction = async () => {
        if (!confirmModal.id || !confirmModal.type) return;

        try {
            const newStatus = confirmModal.type === 'activate' ? 'active' : 'inactive';
            await personnelService.updateStatus(confirmModal.id, newStatus);
            await fetchData();
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            console.error('Error performing action:', error);
        }
    };

    const handleAddStaff = async (data: any) => {
        try {
            if (selectedStaff) {
                await personnelService.updateStaff(selectedStaff.id, data);
            } else {
                await personnelService.addForwarderStaff(data);
            }
            await fetchData();
            setSelectedStaff(null);
            setShowAddStaffModal(false);
        } catch (error: any) {
            toastError(error.message);
        }
    };

    const handleExport = () => {
        const headers = [
            { label: 'Nom', key: 'name' },
            { label: 'Email', key: 'email' },
            { label: 'Rôle', key: 'role' },
            { label: 'Statut', key: 'status' },
            { label: 'Dernière Activité', key: (item: StaffMember) => new Date(item.last_active).toLocaleDateString() }
        ];
        exportToCSV(filteredStaff, headers, 'mon_personnel');
    };

    const getRoleBadge = (roleId: string) => {
        const role = roles.find(r => r.id === roleId);
        const roleName = role ? role.name : roleId;

        return (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {roleName}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Gestion du Personnel"
                subtitle="Gérez les accès de votre équipe"
                action={{
                    label: "Ajouter un membre",
                    onClick: () => {
                        setSelectedStaff(null);
                        setShowAddStaffModal(true);
                    },
                    icon: UserPlus
                }}
            >
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <Download className="w-4 h-4" />
                    Exporter
                </button>
            </PageHeader>

            <UnifiedFilterSegment
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                timeRange={timeRange}
                setTimeRange={(range) => setTimeRange(range as any)}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                tabs={[
                    { id: 'members', label: 'Membres' }
                ]}
                showFilters={true}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                statusOptions={[
                    { value: 'all', label: 'Tous les statuts' },
                    { value: 'active', label: 'Actif' },
                    { value: 'inactive', label: 'Inactif' }
                ]}
            />

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
                    <h3 className="text-gray-500 text-sm font-medium">Total Personnel</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total.value}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                            <Shield className="w-6 h-6" />
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.active.trendUp ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                            {stats.active.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {stats.active.trend}
                        </span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Actifs</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.active.value}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <Briefcase className="w-6 h-6" />
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${stats.departments.trendUp ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                            {stats.departments.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />} {stats.departments.trend}
                        </span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Rôles</h3>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.departments.value}</p>
                </div>
            </div>

            {/* Content Area */}
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
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Membre</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rôle</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dernière Activité</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredStaff.map((member) => (
                                    <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{member.name}</p>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <Mail className="w-3 h-3" />
                                                        {member.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getRoleBadge(member.role)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {member.status === 'active' ? 'Actif' : 'Inactif'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                                {new Date(member.last_active).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="relative flex justify-end">
                                                <button
                                                    onClick={() => setActiveMenu(activeMenu === member.id ? null : member.id)}
                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>

                                                {activeMenu === member.id && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setActiveMenu(null)}
                                                        ></div>
                                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 animate-in fade-in zoom-in duration-200">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedStaff(member);
                                                                    setShowAddStaffModal(true);
                                                                    setActiveMenu(null);
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                                            >
                                                                <Briefcase className="w-4 h-4" /> Modifier rôle
                                                            </button>

                                                            <button
                                                                onClick={() => handleToggleStatus(member.id, member.status)}
                                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 ${member.status === 'active' ? 'text-red-600' : 'text-green-600'}`}
                                                            >
                                                                <Power className="w-4 h-4" />
                                                                {member.status === 'active' ? 'Désactiver' : 'Activer'}
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredStaff.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="p-4 bg-gray-50 rounded-full mb-3">
                                                    <Search className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <p>Aucun membre trouvé</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AddStaffModal
                isOpen={showAddStaffModal}
                onClose={() => {
                    setShowAddStaffModal(false);
                    setSelectedStaff(null);
                }}
                onSubmit={handleAddStaff}
                initialData={selectedStaff}
                roles={roles}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmAction}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
                confirmLabel={confirmModal.type === 'activate' ? 'Activer' : 'Désactiver'}
            />
        </div>
    );
}
