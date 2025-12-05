import PageHeader from '../../../components/common/PageHeader';
import { MessageCircle, Search } from 'lucide-react';

export default function ForwarderMessages() {
    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <PageHeader
                title="Messagerie"
                subtitle="Discutez avec vos clients et négociez les offres"
            />

            <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex">
                {/* Sidebar List */}
                <div className="w-80 border-r border-gray-100 flex flex-col">
                    <div className="p-4 border-b border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Rechercher un client..."
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-transparent rounded-lg text-sm focus:bg-white focus:border-primary/20 focus:outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 text-center text-gray-500 text-sm">
                        Aucune conversation active
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col items-center justify-center bg-gray-50/50">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                        <MessageCircle className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez une conversation</h3>
                    <p className="text-gray-500 max-w-sm text-center">
                        Vos échanges avec les clients concernant les RFQ et les expéditions apparaîtront ici.
                    </p>
                </div>
            </div>
        </div>
    );
}
