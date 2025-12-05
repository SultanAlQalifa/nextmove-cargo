import PageHeader from '../../../components/common/PageHeader';
import { FileText, Search, Filter } from 'lucide-react';

export default function ForwarderOffers() {
    return (
        <div>
            <PageHeader
                title="Mes Offres"
                subtitle="Gérez les offres que vous avez soumises aux clients"
            />

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Rechercher par client, destination..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
                    <Filter className="w-4 h-4" />
                    Statut
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune offre soumise</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                    Vous n'avez pas encore soumis d'offre. Consultez les RFQ disponibles pour trouver des opportunités.
                </p>
                <a
                    href="/dashboard/forwarder/rfq/available"
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90"
                >
                    Voir les RFQ disponibles
                </a>
            </div>
        </div>
    );
}
