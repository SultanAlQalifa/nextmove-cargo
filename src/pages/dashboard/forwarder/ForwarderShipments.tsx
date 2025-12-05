import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { Truck, Search, Filter, RefreshCw, AlertCircle, CheckCircle2, Clock, Plus, Upload } from 'lucide-react';
import { shipmentService, Shipment } from '../../../services/shipmentService';
import { useToast } from '../../../contexts/ToastContext';
import ForwarderShipmentTable from '../../../components/shipment/ForwarderShipmentTable';
import AddShipmentModal from '../../../components/dashboard/AddShipmentModal';
import BulkUploadModal from '../../../components/dashboard/BulkUploadModal';

export default function ForwarderShipments() {
    const { success } = useToast();
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'delivered' | 'delayed'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

    useEffect(() => {
        loadShipments();
    }, []);

    const loadShipments = async () => {
        setLoading(true);
        try {
            const data = await shipmentService.getForwarderShipments();
            setShipments(data);
        } catch (error) {
            console.error('Error loading shipments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = (shipment: Shipment) => {
        success(`Mise à jour du statut pour ${shipment.tracking_number}`);
    };

    const handleViewDetails = (shipment: Shipment) => {
        success(`Détails de l'expédition ${shipment.tracking_number}`);
    };

    const filteredShipments = shipments.filter(shipment => {
        const matchesSearch =
            shipment.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shipment.origin.port.toLowerCase().includes(searchTerm.toLowerCase()) ||
            shipment.destination.port.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (filter === 'active') return ['pending', 'in_transit', 'customs'].includes(shipment.status);
        if (filter === 'delivered') return shipment.status === 'delivered';
        // Mock delayed logic
        if (filter === 'delayed') return false;

        return true;
    });

    const stats = {
        active: shipments.filter(s => ['pending', 'in_transit', 'customs'].includes(s.status)).length,
        delivered: shipments.filter(s => s.status === 'delivered').length,
        delayed: 0 // Mock
    };

    return (
        <div className="space-y-8 pb-12">
            <PageHeader
                title="Gestion des Expéditions"
                subtitle="Suivez et mettez à jour les expéditions de vos clients"
                action={{
                    label: "Ajouter une Expédition",
                    onClick: () => setIsAddModalOpen(true),
                    icon: Plus
                }}
            >
                <button
                    onClick={() => setIsBulkModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <Upload className="w-5 h-5" />
                    <span className="font-medium">Importer Excel</span>
                </button>
            </PageHeader>

            <AddShipmentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={loadShipments}
            />

            <BulkUploadModal
                isOpen={isBulkModalOpen}
                onClose={() => setIsBulkModalOpen(false)}
                onSuccess={loadShipments}
                type="shipments"
            />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl">
                            <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-medium">En Cours</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.active}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-50 rounded-xl">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Livrées (Mois)</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.delivered}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-orange-50 rounded-xl">
                            <AlertCircle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-medium">Retardées</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.delayed}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === 'all'
                            ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20'
                            : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        Toutes
                    </button>
                    <button
                        onClick={() => setFilter('active')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === 'active'
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        En cours
                    </button>
                    <button
                        onClick={() => setFilter('delivered')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${filter === 'delivered'
                            ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                            : 'text-gray-500 hover:bg-gray-50'
                            }`}
                    >
                        Livrées
                    </button>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="N° Suivi, Client..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={loadShipments}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : filteredShipments.length > 0 ? (
                <ForwarderShipmentTable
                    shipments={filteredShipments}
                    onUpdateStatus={handleUpdateStatus}
                    onViewDetails={handleViewDetails}
                />
            ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Truck className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Aucune expédition trouvée</h3>
                    <p className="text-gray-500 mt-1">Aucune expédition ne correspond à vos critères.</p>
                </div>
            )}
        </div>
    );
}
