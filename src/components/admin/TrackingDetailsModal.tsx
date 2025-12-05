import { X, Truck, MapPin, Calendar, CheckCircle, Clock, Package, FileText } from 'lucide-react';

interface TrackingDetailsModalProps {
    shipmentId: string;
    onClose: () => void;
    onViewDetails: () => void;
}

export default function TrackingDetailsModal({ shipmentId, onClose, onViewDetails }: TrackingDetailsModalProps) {
    // Mock tracking data
    const trackingEvents = [
        {
            id: 1,
            status: 'Livré',
            location: 'Paris, FR',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            description: 'Colis livré au destinataire',
            completed: true
        },
        {
            id: 2,
            status: 'En cours de livraison',
            location: 'Paris, FR',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
            description: 'En cours de livraison vers le destinataire',
            completed: true
        },
        {
            id: 3,
            status: 'Arrivé au centre',
            location: 'Paris, FR',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            description: 'Arrivé au centre de distribution local',
            completed: true
        },
        {
            id: 4,
            status: 'En transit',
            location: 'Dubai, UAE',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            description: 'Départ du centre de transit',
            completed: true
        },
        {
            id: 5,
            status: 'Ramassé',
            location: 'Shanghai, CN',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
            description: 'Colis ramassé par le transporteur',
            completed: true
        }
    ];

    return (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <Truck className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Suivi du colis</h2>
                            <p className="text-sm text-gray-500">{shipmentId}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <div className="relative pl-8 space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                        {trackingEvents.map((event, index) => (
                            <div key={event.id} className="relative">
                                <div className={`absolute -left-[34px] p-1.5 rounded-full border-4 border-white shadow-sm ${index === 0 ? 'bg-green-500' : 'bg-gray-200'}`}>
                                    {index === 0 ? (
                                        <CheckCircle className="w-3 h-3 text-white" />
                                    ) : (
                                        <div className="w-3 h-3 rounded-full" />
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className={`font-semibold ${index === 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                                            {event.status}
                                        </p>
                                        <span className="text-xs text-gray-400">
                                            {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">{event.description}</p>
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                        <MapPin className="w-3 h-3" />
                                        {event.location}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                    >
                        Fermer
                    </button>
                    <button
                        onClick={onViewDetails}
                        className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                        <FileText className="w-4 h-4" />
                        Voir Facture Intégrale
                    </button>
                </div>
            </div>
        </div>
    );
}
