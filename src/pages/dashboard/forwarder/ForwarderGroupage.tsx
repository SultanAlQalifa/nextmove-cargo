import ForwarderConsolidations from '../../../components/dashboard/ForwarderConsolidations';

export default function ForwarderGroupage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Mes Offres de Groupage</h1>
                <p className="text-gray-500 mt-1">Gérez vos services de consolidation et optimisez le chargement des conteneurs.</p>
            </div>
            <ForwarderConsolidations />
        </div>
    );
}
