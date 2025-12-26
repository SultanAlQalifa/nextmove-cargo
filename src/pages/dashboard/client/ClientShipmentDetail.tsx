import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Package,
    MapPin,
    Calendar,
    Clock,
    Truck,
    CheckCircle2,
    FileText,
    ShieldCheck,
    CreditCard
} from "lucide-react";
import { shipmentService, Shipment } from "../../../services/shipmentService";
import { useToast } from "../../../contexts/ToastContext";
import { useCurrency } from "../../../contexts/CurrencyContext";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import { invoiceService } from "../../../services/invoiceService";
import PaymentModal from "../../../components/payment/PaymentModal";
import { addressService, ForwarderAddress } from "../../../services/addressService";
import ReviewModal from "../../../components/shipments/ReviewModal";
import { reviewService } from "../../../services/reviewService";

// Helper Component for Addresses
const ForwarderAddressesDisplay = ({ forwarderId, originCountry, destCountry }: { forwarderId: string, originCountry: string, destCountry: string }) => {
    const [addresses, setAddresses] = useState<ForwarderAddress[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        addressService.getAddresses(forwarderId).then(data => {
            setAddresses(data);
            setLoading(false);
        });
    }, [forwarderId]);

    const originAddr = addresses.find(a => a.type === 'collection' && (a.country === originCountry || a.is_default));
    const destAddr = addresses.find(a => a.type === 'reception' && (a.country === destCountry || a.is_default));

    if (loading) return <div className="p-4 text-center text-xs text-gray-500">Chargement adresses...</div>;
    if (!originAddr && !destAddr) return null;

    return (
        <div className="space-y-4">
            {originAddr && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h4 className="text-xs font-bold uppercase text-blue-800 mb-2 flex items-center gap-2">
                        <Package className="w-3.5 h-3.5" /> Adresse de Dépôt ({originAddr.country})
                    </h4>
                    <p className="text-sm font-semibold text-blue-900">{originAddr.name}</p>
                    <p className="text-xs text-blue-800 mt-1 whitespace-pre-line">{originAddr.address_line1} {originAddr.city}</p>
                    {originAddr.contact_phone && <p className="text-xs text-blue-700 mt-1">Tel: {originAddr.contact_phone}</p>}
                </div>
            )}
            {destAddr && (
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <h4 className="text-xs font-bold uppercase text-green-800 mb-2 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5" /> Lieu de Retrait ({destAddr.country})
                    </h4>
                    <p className="text-sm font-semibold text-green-900">{destAddr.name}</p>
                    <p className="text-xs text-green-800 mt-1 whitespace-pre-line">{destAddr.address_line1} {destAddr.city}</p>
                    {destAddr.instructions && <p className="text-xs text-green-700 mt-1 italic">Note: {destAddr.instructions}</p>}
                </div>
            )}
        </div>
    );
};

// Client Shipment Detail Page
export default function ClientShipmentDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { error, success } = useToast();
    const { formatPrice } = useCurrency();

    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [loading, setLoading] = useState(true);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);

    useEffect(() => {
        if (id) {
            loadShipment(id);
        }
    }, [id]);

    const loadShipment = async (shipmentId: string) => {
        try {
            const data = await shipmentService.getShipmentById(shipmentId);
            if (!data) {
                error("Expédition introuvable");
                navigate("/dashboard/client/shipments");
                return;
            }
            setShipment(data);

            // Check if reviewed
            if (data.status === 'completed') {
                const existingReview = await reviewService.getReviewForShipment(shipmentId);
                setHasReviewed(!!existingReview);
            }
        } catch (err) {
            console.error("Error loading shipment:", err);
            error("Erreur lors du chargement de l'expédition");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDelivery = async () => {
        if (!shipment) return;
        try {
            // In a real app, this would update status to 'completed' or trigger a feedback form
            await shipmentService.updateShipment(shipment.id, { status: "completed" });
            success("Réception confirmée ! Merci.");
            setIsConfirmModalOpen(false);
            loadShipment(shipment.id);
            // Prompt for review
            setIsReviewModalOpen(true);
        } catch (e) {
            console.error("Confirmation failed:", e);
            error("Erreur lors de la confirmation");
        }
    };

    const handlePaymentSuccess = () => {
        setIsPaymentModalOpen(false);
        success("Paiement initié avec succès !");
        // Reload to get updated status if it changed server-side, 
        // or optimistically update
        if (shipment) {
            loadShipment(shipment.id);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "delivered": return "bg-green-100 text-green-800";
            case "completed": return "bg-green-100 text-green-800";
            case "cancelled": return "bg-red-100 text-red-800";
            case "pending": return "bg-blue-100 text-blue-800"; // Confirmed, but not yet picked up
            case "pending_payment": return "bg-yellow-100 text-yellow-800"; // Waiting payment
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const StatusBadge = ({ status }: { status: string }) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
            {status === 'pending' && 'Confirmé / En Attente Enlèvement'}
            {status === 'pending_payment' && 'En Attente Paiement'}
            {status === 'picked_up' && 'Ramassé'}
            {status === 'in_transit' && 'En Transit'}
            {status === 'customs' && 'Douane'}
            {status === 'delivered' && 'Livré'}
            {status === 'completed' && 'Reçu & Confirmé'}
            {status === 'cancelled' && 'Annulé'}
        </span>
    );

    const TrackingProgress = ({ status }: { status: string }) => {
        const steps = [
            { key: 'pending', label: 'En Attente' },
            { key: 'picked_up', label: 'Ramassé' },
            { key: 'in_transit', label: 'En Transit' },
            { key: 'customs', label: 'Douane' },
            { key: 'delivered', label: 'Livré' }
        ];

        const barRef = useState<HTMLDivElement | null>(null);
        const [barEl, setBarEl] = barRef;

        const currentIdx = steps.findIndex(s => s.key === status);
        const activeIdx = status === 'completed' ? 4 : (currentIdx === -1 ? 0 : currentIdx);

        useEffect(() => {
            if (barEl) {
                barEl.style.setProperty('--progress', `${(activeIdx / (steps.length - 1)) * 100}%`);
            }
        }, [barEl, activeIdx, steps.length]);

        return (
            <div className="w-full py-6">
                <div className="flex items-center justify-between relative">
                    {/* Progress Bar Background */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
                    {/* Active Progress */}
                    <div
                        ref={setBarEl}
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-500 -z-10 w-[var(--progress)]"
                    />

                    {steps.map((step, idx) => {
                        const isCompleted = idx <= activeIdx;
                        const isCurrent = idx === activeIdx;

                        return (
                            <div key={step.key} className="flex flex-col items-center bg-white px-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted ? 'bg-primary border-primary text-white' : 'bg-white border-gray-300 text-gray-400'
                                    }`}>
                                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-2 h-2 rounded-full bg-gray-300" />}
                                </div>
                                <span className={`text-xs font-medium mt-2 ${isCurrent ? 'text-primary' : 'text-gray-500'}`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };


    const handleDownloadInvoice = async () => {
        if (!shipment) return;
        try {
            const invoiceData = {
                invoiceNumber: shipment.tracking_number,
                date: new Date().toLocaleDateString('fr-FR'),
                dueDate: new Date(new Date().setDate(new Date().getDate() + 15)).toLocaleDateString('fr-FR'), // Mock due date
                status: (shipment.status === 'completed' || shipment.payment?.some(p => p.status === 'completed')) ? 'paid' : 'pending',
                sender: {
                    name: shipment.forwarder?.company_name || shipment.carrier.name,
                    address: [shipment.origin.country, shipment.origin.port], // Mock address
                    email: shipment.forwarder?.email || "contact@forwarder.com",
                    currency: "XOF",
                    phone: "+221 00 000 00 00" // Mock phone
                },
                client: {
                    name: "Client", // Should fetch user name if available
                    address: [shipment.destination.country, shipment.destination.port],
                },
                items: [
                    {
                        description: `Transport ${shipment.transport_mode === 'air' ? 'Aérien' : 'Maritime'} - ${shipment.origin.port} vers ${shipment.destination.port}`,
                        quantity: 1,
                        price: shipment.price,
                        total: shipment.price
                    }
                ],
                subtotal: shipment.price,
                tax: 0, // Mock tax
                total: shipment.price,
                currency: "XOF",
                notes: `Ref Colis: ${shipment.tracking_number}`
            };

            // @ts-ignore
            await invoiceService.generateInvoice(invoiceData);
            success("Facture téléchargée !");
        } catch (e) {
            console.error("Invoice generation failed:", e);
            error("Erreur lors de la génération de la facture");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!shipment) return null;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <button
                        onClick={() => navigate("/dashboard/client/shipments")}
                        className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-2 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Retour aux expéditions
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        {shipment.tracking_number}
                        <StatusBadge status={shipment.status} />
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Expédié le {new Date(shipment.created_at || "").toLocaleDateString()}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleDownloadInvoice}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <FileText className="w-4 h-4" />
                        Facture
                    </button>
                    {(shipment.status === 'pending_payment' ||
                        (shipment.status === 'pending' &&
                            shipment.price > 0 &&
                            !shipment.payment?.some(p => p.status === 'completed' || p.status === 'paid' || p.status === 'pending_offline')
                        )
                    ) && (
                            <button
                                onClick={() => setIsPaymentModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm animate-pulse"
                            >
                                <CreditCard className="w-4 h-4" />
                                Payer maintenant
                            </button>
                        )}
                    {shipment.status === 'delivered' && (
                        <button
                            onClick={() => setIsConfirmModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors shadow-sm"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            Confirmer la Réception
                        </button>
                    )}

                    {shipment.status === 'completed' && !hasReviewed && (
                        <button
                            onClick={() => setIsReviewModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 transition-colors shadow-sm animate-bounce"
                        >
                            <ShieldCheck className="w-4 h-4" />
                            Laisser un avis
                        </button>
                    )}
                </div>
            </div>

            {/* Tracking Visualization */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Suivi du Colis</h3>
                <TrackingProgress status={shipment.status} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    {/* Route */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            Itinéraire
                        </h3>
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1 text-center md:text-left">
                                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Origine</span>
                                <div className="text-xl font-bold text-gray-900 mt-1">{shipment.origin.port}</div>
                                <div className="text-sm text-gray-500">{shipment.origin.country}</div>
                            </div>
                            <div className="hidden md:flex flex-col items-center flex-1">
                                <div className="w-full h-px bg-gray-200 border-t border-dashed border-gray-300" />
                                <div className="mt-2 text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600">
                                    {shipment.transport_mode === 'air' ? '✈️ Aérien' : '🚢 Maritime'}
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-right">
                                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Destination</span>
                                <div className="text-xl font-bold text-gray-900 mt-1">{shipment.destination.port}</div>
                                <div className="text-sm text-gray-500">{shipment.destination.country}</div>
                            </div>
                        </div>
                    </div>

                    {/* Cargo Details */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-gray-400" />
                            Votre Marchandise
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <div className="text-xs text-gray-500 font-medium">Poids Total</div>
                                <div className="text-lg font-bold text-gray-900">{shipment.cargo.weight} kg</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <div className="text-xs text-gray-500 font-medium">Volume Total</div>
                                <div className="text-lg font-bold text-gray-900">{shipment.cargo.volume} m³</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <div className="text-xs text-gray-500 font-medium">Colis</div>
                                <div className="text-lg font-bold text-gray-900">{shipment.cargo.packages}</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl">
                                <div className="text-xs text-gray-500 font-medium">Nature</div>
                                <div className="text-lg font-bold text-gray-900 capitalize">{shipment.cargo.type || 'Standard'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Carrier Info */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                            Effectué par
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center overflow-hidden">
                                {shipment.carrier.logo ? (
                                    <img src={shipment.carrier.logo} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <Truck className="w-6 h-6 text-blue-600" />
                                )}
                            </div>
                            <div>
                                <div className="font-bold text-gray-900">{shipment.carrier.name}</div>
                                <div className="text-xs text-gray-500">{shipment.service_type === 'express' ? 'Service Express' : 'Service Standard'}</div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                            <span className="text-sm text-gray-500">Coût Estimé</span>
                            <span className="font-bold text-gray-900">{formatPrice(shipment.price)}</span>
                        </div>
                    </div>

                    {/* Forwarder Addresses (New Feature) */}
                    {shipment.forwarder && (
                        <ForwarderAddressesDisplay forwarderId={shipment.forwarder.id} originCountry={shipment.origin.country} destCountry={shipment.destination.country} />
                    )}

                    {/* Dates */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-2">Dates Clés</h3>
                        <div className="flex items-start gap-3">
                            <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                                <div className="text-sm text-gray-500">Départ</div>
                                <div className="font-medium text-gray-900">
                                    {shipment.dates.departure ? new Date(shipment.dates.departure).toLocaleDateString() : 'Non défini'}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                            <div>
                                <div className="text-sm text-gray-500">Arrivée Estimée</div>
                                <div className="font-medium text-gray-900">
                                    {shipment.dates.arrival_estimated ? new Date(shipment.dates.arrival_estimated).toLocaleDateString() : 'Non défini'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelivery}
                title="Confirmer la réception"
                message="Avez-vous bien reçu la marchandise en bon état ? Cette action clôturera l'expédition."
            />

            {shipment && (
                <>
                    <PaymentModal
                        isOpen={isPaymentModalOpen}
                        onClose={() => setIsPaymentModalOpen(false)}
                        onSuccess={handlePaymentSuccess}
                        planName={`Expédition ${shipment.tracking_number}`}
                        amount={shipment.price}
                        currency={shipment.service_type === 'express' ? 'XOF' : 'XOF'}
                        allowedMethods={['wave', 'wallet', 'cash']}
                        shipmentId={shipment.id}
                    />

                    {shipment.forwarder && (
                        <ReviewModal
                            isOpen={isReviewModalOpen}
                            onClose={() => setIsReviewModalOpen(false)}
                            shipment={{
                                id: shipment.id,
                                tracking_number: shipment.tracking_number,
                                forwarder_id: shipment.forwarder.id,
                                forwarder: {
                                    company_name: shipment.forwarder.company_name || "",
                                    full_name: shipment.forwarder.full_name || ""
                                }
                            }}
                            onSuccess={() => {
                                setHasReviewed(true);
                                loadShipment(shipment.id);
                            }}
                        />
                    )}
                </>
            )}
        </div>
    );
}
