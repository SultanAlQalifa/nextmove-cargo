import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Consolidation, ConsolidationFilters, ConsolidationType } from '../../types/consolidation';
import { consolidationService } from '../../services/consolidationService';
import { Package, Anchor, Plane, Calendar, ArrowRight, Filter, Search, Edit, Trash2, XCircle, AlertCircle, ShieldCheck, Zap, Box, ClipboardCheck, FileCheck, Truck, Warehouse } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';

interface ConsolidationListProps {
    type?: ConsolidationType;
    showActions?: boolean;
    onEdit?: (consolidation: Consolidation) => void;
}

export default function ConsolidationList({ type, showActions, onEdit }: ConsolidationListProps) {
    const { t } = useTranslation();
    const [consolidations, setConsolidations] = useState<Consolidation[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [filters, setFilters] = useState<ConsolidationFilters>({
        status: 'open',
        type: type
    });

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setCurrentUserId(data.user?.id || null);
        });
    }, []);

    useEffect(() => {
        setFilters(prev => ({ ...prev, type }));
    }, [type]);

    useEffect(() => {
        loadConsolidations();
    }, [filters]);

    const loadConsolidations = async () => {
        setLoading(true);
        try {
            const data = await consolidationService.getConsolidations(filters);
            setConsolidations(data);
        } catch (error) {
            console.error('Error loading consolidations:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'open': return 'bg-green-100 text-green-800';
            case 'closing_soon': return 'bg-yellow-100 text-yellow-800';
            case 'full': return 'bg-red-100 text-red-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            case 'completed': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this request?')) return;
        try {
            await consolidationService.updateConsolidation(id, { status: 'cancelled' });
            loadConsolidations();
        } catch (error) {
            console.error('Error cancelling consolidation:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this request? This action cannot be undone.')) return;
        try {
            await consolidationService.deleteConsolidation(id);
            loadConsolidations();
        } catch (error) {
            console.error('Error deleting consolidation:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {t('calculator.origin')}
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Ex: Shanghai"
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={filters.origin_port || ''}
                                onChange={(e) => setFilters({ ...filters, origin_port: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            {t('calculator.destination')}
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Ex: Dakar"
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={filters.destination_port || ''}
                                onChange={(e) => setFilters({ ...filters, destination_port: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="w-full sm:w-auto">
                        <select
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={filters.transport_mode || ''}
                            onChange={(e) => setFilters({ ...filters, transport_mode: e.target.value as any || undefined })}
                        >
                            <option value="">{t('calculator.transportMode')}</option>
                            <option value="sea">{t('calculator.sea.label')}</option>
                            <option value="air">{t('calculator.air.label')}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            ) : consolidations.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-slate-300 dark:border-gray-700">
                    <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white">No consolidations found</h3>
                    <p className="text-slate-500 dark:text-slate-400">Try adjusting your filters</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {consolidations.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 hover:shadow-md transition-shadow overflow-hidden group">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                        {item.status.replace('_', ' ').toUpperCase()}
                                    </div>
                                    {item.transport_mode === 'sea' ? (
                                        <Anchor className="h-5 w-5 text-blue-500" />
                                    ) : (
                                        <Plane className="h-5 w-5 text-sky-500" />
                                    )}
                                </div>

                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 line-clamp-1">
                                    {item.title || `${item.origin_port} → ${item.destination_port}`}
                                </h3>

                                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-4">
                                    <span>{item.origin_port}</span>
                                    <ArrowRight className="h-4 w-4" />
                                    <span>{item.destination_port}</span>
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">Departure</span>
                                        <span className="font-medium text-slate-900 dark:text-white">
                                            {item.departure_date ? format(new Date(item.departure_date), 'MMM d, yyyy') : 'TBD'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">Load</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-24 h-2 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${Math.min(((item.current_load_cbm || 0) / (item.total_capacity_cbm || 1)) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <span className="font-medium text-slate-900 dark:text-white">
                                                {Math.round(((item.current_load_cbm || 0) / (item.total_capacity_cbm || 1)) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                    {item.price_per_cbm && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500 dark:text-slate-400">Price / CBM</span>
                                            <span className="font-bold text-blue-600 dark:text-blue-400">
                                                {item.price_per_cbm.toLocaleString()} {item.currency}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {item.services_requested && item.services_requested.length > 0 && (
                                    <div className="mb-6 pt-4 border-t border-slate-100 dark:border-gray-700">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Services Requested:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {item.services_requested.map(serviceId => {
                                                const serviceIcons: Record<string, any> = {
                                                    insurance: ShieldCheck,
                                                    priority: Zap,
                                                    packaging: Box,
                                                    inspection: ClipboardCheck,
                                                    customs_clearance: FileCheck,
                                                    door_to_door: Truck,
                                                    storage: Warehouse
                                                };
                                                const Icon = serviceIcons[serviceId] || Package;
                                                return (
                                                    <div key={serviceId} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-gray-700 text-xs text-slate-600 dark:text-slate-300" title={serviceId.replace('_', ' ')}>
                                                        <Icon className="h-3 w-3" />
                                                        <span className="capitalize">{serviceId.replace(/_/g, ' ')}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {showActions && item.initiator_id === currentUserId ? (
                                        <>
                                            {item.status !== 'cancelled' && item.status !== 'completed' && (
                                                <>
                                                    <button
                                                        onClick={() => onEdit?.(item)}
                                                        className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancel(item.id)}
                                                        className="flex-1 py-2.5 px-4 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg font-medium hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                        Cancel
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="py-2.5 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <button className="w-full py-2.5 px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-medium hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                                            View Details
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
