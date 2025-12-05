import { useState } from 'react';
import { Plus } from 'lucide-react';
import ConsolidationList from '../../../components/consolidation/ConsolidationList';
import CreateConsolidationModal from '../../../components/consolidation/CreateConsolidationModal';
import { Consolidation } from '../../../types/consolidation';

export default function ClientGroupage() {
    const [activeTab, setActiveTab] = useState<'marketplace' | 'my_requests'>('marketplace');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [selectedConsolidation, setSelectedConsolidation] = useState<Consolidation | undefined>(undefined);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleCreate = () => {
        setModalMode('create');
        setSelectedConsolidation(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (consolidation: Consolidation) => {
        setModalMode('edit');
        setSelectedConsolidation(consolidation);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Groupage Marketplace</h1>
                    <p className="text-gray-500 mt-1">Find and join consolidation offers from verified forwarders.</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    Create Request
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('marketplace')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                            ${activeTab === 'marketplace'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
                        `}
                    >
                        Marketplace Offers
                    </button>
                    <button
                        onClick={() => setActiveTab('my_requests')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                            ${activeTab === 'my_requests'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
                        `}
                    >
                        My Requests
                    </button>
                </nav>
            </div>

            <ConsolidationList
                key={`${activeTab}-${refreshTrigger}`}
                type={activeTab === 'marketplace' ? 'forwarder_offer' : 'client_request'}
                showActions={activeTab === 'my_requests'}
                onEdit={handleEdit}
            />

            <CreateConsolidationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSuccess}
                mode={modalMode}
                initialData={selectedConsolidation}
                defaultType="client_request"
            />
        </div>
    );
}
