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
    CreditCard,
    Zap,
    Anchor,
    MapPin as MapPinIcon,
    Box
} from "lucide-react";
import { motion } from "framer-motion";
import { shipmentService, Shipment } from "../../../services/shipmentService";
import { useToast } from "../../../contexts/ToastContext";
import { useCurrency } from "../../../contexts/CurrencyContext";
import ConfirmationModal from "../../../components/common/ConfirmationModal";
import { generateInvoicePDF } from "../../../utils/invoiceGenerator";
import PaymentModal from "../../../components/payment/PaymentModal";
import { addressService, ForwarderAddress } from "../../../services/addressService";
import { useAuth } from "../../../contexts/AuthContext";
import { documentService } from "../../../services/documentService";
import ReviewModal from "../../../components/shipments/ReviewModal";
import { reviewService } from "../../../services/reviewService";
import TrackingMap from "../../../components/shipment/TrackingMap";


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

    if (loading) return <div className="p-4 text-center text-xs text-slate-500 animate-pulse">Chargement des adresses...</div>;
    if (!originAddr && !destAddr) return null;

    return (
        <div className="space-y-4">
            {originAddr && (
                <div className="bg-white/60 dark:bg-slate-800/40 backdrop-blur-md p-5 rounded-2xl border border-white/50 dark:border-white/5 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50 transition-all group">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                        <div className="p-1.5 bg-orange-50 dark:bg-orange-500/20 rounded-lg text-orange-500">
                            <Package className="w-3.5 h-3.5" />
                        </div>
                        Adresse de Dépôt ({originAddr.country})
                    </h4>
                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors uppercase tracking-tight">{originAddr.name}</p>
                    <p className="text-xs text-slate-500 mt-1 whitespace-pre-line leading-relaxed">{originAddr.address_line1} {originAddr.city}</p>
                    {originAddr.contact_phone && <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-2 flex items-center gap-1.5"><Zap className="w-3 h-3 text-orange-400" /> Tel: {originAddr.contact_phone}</p>}
                </div>
            )}
            {destAddr && (
                <div className="bg-white/60 dark:bg-emerald-900/10 backdrop-blur-md p-5 rounded-2xl border border-white/50 dark:border-emerald-500/10 shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all group">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-500/20 rounded-lg text-emerald-500">
                            <MapPin className="w-3.5 h-3.5" />
                        </div>
                        Lieu de Retrait ({destAddr.country})
                    </h4>
                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{destAddr.name}</p>
                    <p className="text-xs text-slate-500 mt-1 whitespace-pre-line leading-relaxed">{destAddr.address_line1} {destAddr.city}</p>
                    {destAddr.instructions && <p className="text-[10px] font-medium text-emerald-600/80 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-xl mt-3 italic border border-emerald-100 dark:border-emerald-500/20">Note: {destAddr.instructions}</p>}
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
    const { user } = useAuth();

    const [shipment, setShipment] = useState<Shipment | null>(null);
    const [loading, setLoading] = useState(true);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
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
            await shipmentService.updateShipment(shipment.id, { status: "completed" });
            success("Réception confirmée ! Les fonds vont être libérés au prestataire.");
            setIsConfirmModalOpen(false);
            loadShipment(shipment.id);
            // Prompt for review
            setIsReviewModalOpen(true);
        } catch (e) {
            console.error("Confirmation failed:", e);
            error("Erreur lors de la confirmation");
        }
    };

    const handleDispute = async () => {
        if (!shipment) return;
        try {
            await shipmentService.updateShipment(shipment.id, { status: "disputed" as any });
            success("Litige ouvert. Les fonds sont bloqués et notre équipe vous contactera.");
            setIsDisputeModalOpen(false);
            loadShipment(shipment.id);
        } catch (e) {
            console.error("Dispute failed:", e);
            error("Erreur lors de l'ouverture du litige");
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
            case "delivered":
            case "completed": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 glow-emerald-sm";
            case "cancelled": return "bg-rose-500/10 text-rose-600 border-rose-500/20";
            case "disputed": return "bg-rose-500/10 text-rose-600 border-rose-500/20 glow-rose-sm";
            case "pending": return "bg-orange-500/10 text-orange-600 border-orange-500/20 glow-orange-sm";
            case "pending_payment": return "bg-amber-500/10 text-amber-600 border-amber-500/20 glow-amber-sm";
            case "pending_confirmation": return "bg-purple-500/10 text-purple-600 border-purple-500/20 glow-purple-sm";
            case "picked_up":
            case "in_transit":
            case "customs": return "bg-orange-500/10 text-orange-600 border-orange-500/20 glow-orange-sm";
            default: return "bg-slate-500/10 text-slate-600 border-slate-500/20";
        }
    };

    const StatusBadge = ({ status }: { status: string }) => (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${getStatusColor(status)}`}>
            {status === 'pending' && 'En Attente'}
            {status === 'pending_payment' && 'Paiement Requis'}
            {status === 'picked_up' && 'Ramassé'}
            {status === 'in_transit' && 'En Transit'}
            {status === 'customs' && 'Douane'}
            {status === 'delivered' && 'Livré'}
            {status === 'pending_confirmation' && 'Confirmation Requise'}
            {status === 'completed' && 'Terminé'}
            {status === 'disputed' && 'Litige'}
            {status === 'cancelled' && 'Annulé'}
        </span>
    );

    const TrackingProgress = ({ status }: { status: string }) => {
        const steps = [
            { key: 'pending', label: 'Attente', icon: Clock },
            { key: 'picked_up', label: 'Ramassé', icon: Box },
            { key: 'in_transit', label: 'Transit', icon: Truck },
            { key: 'customs', label: 'Douane', icon: ShieldCheck },
            { key: 'delivered', label: 'Livré', icon: CheckCircle2 }
        ];

        const currentIdx = steps.findIndex(s => s.key === status);
        const activeIdx = status === 'completed' ? 4 : (currentIdx === -1 ? 0 : currentIdx);

        return (
            <div className="w-full py-10 relative">
                {/* Lueur de fond globale */}
                <div className="absolute inset-0 bg-orange-500/5 blur-3xl opacity-50 rounded-full pointer-events-none" />

                <div className="relative flex justify-between items-center px-4 md:px-8">
                    {/* Ligne de fond (Grisée) */}
                    <div className="absolute left-0 right-0 h-1.5 bg-slate-200/50 dark:bg-slate-800/50 rounded-full mx-10 md:mx-16 backdrop-blur-sm" />

                    {/* Ligne de progression animée */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(activeIdx / (steps.length - 1)) * 100}%` }}
                        className="absolute left-0 h-1.5 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-400 rounded-full mx-10 md:mx-16 shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                        transition={{ duration: 1.2, ease: "circOut" }}
                    />

                    {steps.map((step, idx) => {
                        const isCompleted = idx <= activeIdx;
                        const isCurrent = idx === activeIdx;
                        const StepIcon = step.icon;

                        return (
                            <div key={step.key} className="flex flex-col items-center relative gap-4">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: isCurrent ? 1.25 : 1,
                                        backgroundColor: isCompleted ? "rgb(234 88 12)" : "rgba(255, 255, 255, 0.8)",
                                        borderColor: isCompleted ? "rgba(234, 88, 12, 0.5)" : "rgba(226, 232, 240, 0.5)"
                                    }}
                                    className={`w-12 h-12 rounded-2xl md:rounded-full flex items-center justify-center border hover:scale-110 transition-transform cursor-default relative z-10 backdrop-blur-md shadow-lg
                                        ${isCompleted ? 'text-white shadow-orange-500/30' : 'text-slate-400 dark:bg-slate-900/80 dark:border-slate-700'}
                                        ${isCurrent ? 'ring-4 ring-orange-500/30 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''}
                                    `}
                                >
                                    <StepIcon className={`w-5 h-5 ${isCurrent ? 'animate-pulse' : ''}`} />
                                    {isCurrent && (
                                        <motion.div
                                            layoutId="pulse"
                                            className="absolute -inset-3 rounded-[2rem] md:rounded-full border border-orange-400/50"
                                            animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                                        />
                                    )}
                                </motion.div>
                                <motion.span
                                    animate={{ y: isCurrent ? 5 : 0 }}
                                    className={`text-[10px] md:text-xs font-black uppercase tracking-widest absolute -bottom-8 whitespace-nowrap px-3 py-1 rounded-full ${isCurrent ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 shadow-sm border border-orange-100 dark:border-orange-800/50' : 'text-slate-400'}`}>
                                    {step.label}
                                </motion.span>
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
            const createdAt = new Date(shipment.created_at || new Date());
            const dueDate = new Date(createdAt);
            dueDate.setDate(dueDate.getDate() + 3);

            const blob = generateInvoicePDF({
                invoiceNumber: `INV-${shipment.tracking_number}`,
                date: createdAt,
                dueDate: dueDate,
                status: (shipment.status === 'completed' || shipment.payment?.some(p => p.status === 'completed')) ? 'PAID' : 'UNPAID',
                client: {
                    name: shipment.client?.full_name || "Client",
                    address: `${shipment.destination.port}, ${shipment.destination.country}`,
                    email: shipment.client?.email || "",
                    phone: shipment.client?.phone || ""
                },
                shipment: {
                    trackingNumber: shipment.tracking_number,
                    origin: `${shipment.origin.port}, ${shipment.origin.country}`,
                    destination: `${shipment.destination.port}, ${shipment.destination.country}`,
                    weight: `${shipment.cargo.weight} kg`,
                    packages: shipment.cargo.packages
                },
                items: [
                    {
                        description: `Transport ${shipment.transport_mode === 'air' ? 'Aérien' : 'Maritime'} - ${shipment.origin.port} vers ${shipment.destination.port}`,
                        amount: shipment.price
                    }
                ],
                total: shipment.price,
                currency: shipment.currency || "XOF"
            }, true);

            // Upload to Document Center if user is logged in
            if (blob && user?.id) {
                const file = new File([blob], `Facture_INV-${shipment.tracking_number}.pdf`, { type: 'application/pdf' });
                // We use a simple try-catch here so download succeeds even if upload fails
                try {
                    await documentService.uploadDocument(user.id, file, 'invoice', shipment.id);
                } catch (uploadError) {
                    console.error("Failed to save invoice to document center:", uploadError);
                }
            }

            success("Facture téléchargée et sauvegardée !");
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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 max-w-6xl mx-auto pb-20 relative"
        >
            <div className="grain-overlay opacity-[0.02]" />
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
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm min-h-[44px]"
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
                    {(shipment.status === 'delivered' || shipment.status === 'pending_confirmation') && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsDisputeModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 font-medium rounded-xl hover:bg-rose-100 transition-colors shadow-sm"
                            >
                                Disputer
                            </button>
                            <button
                                onClick={() => setIsConfirmModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm animate-pulse"
                            >
                                <ShieldCheck className="w-4 h-4" />
                                Confirmer la Réception
                            </button>
                        </div>
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

            {/* Tracking Map Integration */}
            <TrackingMap
                shipmentId={shipment.id}
                origin={shipment.origin.port}
                destination={shipment.destination.port}
                progress={shipment.progress || 0}
                status={shipment.status}
            />

            {/* Tracking Visualization */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="glass-card-premium p-8 rounded-[2rem] border-white/10 relative overflow-hidden group shadow-2xl shadow-orange-500/5"
            >
                <div className="grain-overlay opacity-[0.03]" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <Zap className="w-3 h-3 text-orange-500" /> Suivi Temps Réel
                </h3>
                <TrackingProgress status={shipment.status} />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-6">
                    {/* Route */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card-premium p-8 rounded-[2rem] border-white/10 relative overflow-hidden"
                    >
                        <div className="grain-overlay opacity-[0.02]" />
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-8 flex items-center gap-3">
                            <MapPinIcon className="w-5 h-5 text-orange-500" />
                            Détails de l'Itinéraire
                        </h3>
                        <div className="flex flex-col md:flex-row items-center gap-10 relative">
                            <div className="flex-1 text-center md:text-left group/loc relative">
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block mb-2">Départ</span>
                                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 group-hover:text-orange-500 transition-colors drop-shadow-sm">{shipment.origin.port}</div>
                                <div className="text-sm font-medium text-slate-500 mt-1 flex items-center justify-center md:justify-start gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {shipment.origin.country}
                                </div>
                            </div>

                            <div className="hidden md:flex flex-col items-center flex-1 relative px-8">
                                <div className="w-full h-[3px] bg-slate-100 dark:bg-slate-800 rounded-full relative overflow-hidden">
                                    <motion.div
                                        animate={{ x: ["-100%", "100%"] }}
                                        transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                                        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-80"
                                    />
                                    <div className="absolute inset-0 bg-orange-400/20 blur-sm"></div>
                                </div>
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className="mt-6 text-[10px] font-black uppercase tracking-widest bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-5 py-2.5 rounded-2xl border border-orange-200 dark:border-orange-800/50 shadow-sm backdrop-blur-md flex items-center gap-2">
                                    {shipment.transport_mode === 'air' ? '✈️ Air Cargo' : '🚢 Sea Freight'}
                                </motion.div>
                            </div>

                            <div className="flex-1 text-center md:text-right group/loc relative">
                                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black block mb-2">Arrivée</span>
                                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1 group-hover:text-orange-500 transition-colors drop-shadow-sm">{shipment.destination.port}</div>
                                <div className="text-sm font-medium text-slate-500 mt-1 flex items-center justify-center md:justify-end gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {shipment.destination.country}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Cargo Details */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card-premium p-8 rounded-[2rem] border-white/10 relative overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-none"
                    >
                        <div className="grain-overlay opacity-[0.02]" />
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3">
                            <div className="p-2 bg-orange-50 dark:bg-orange-500/20 rounded-xl">
                                <Package className="w-5 h-5 text-orange-500" />
                            </div>
                            Détails de la Cargaison
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md rounded-[1.5rem] border border-white/50 dark:border-white/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-200 dark:hover:border-orange-800 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-100 to-transparent dark:from-orange-900/40 rounded-bl-[2rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 relative z-10">Poids</div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors relative z-10 flex items-baseline gap-1">{shipment.cargo.weight} <span className="text-xs font-bold text-slate-400">KG</span></div>
                            </div>
                            <div className="p-5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md rounded-[1.5rem] border border-white/50 dark:border-white/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-200 dark:hover:border-orange-800 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-100 to-transparent dark:from-orange-900/40 rounded-bl-[2rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 relative z-10">Volume</div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors relative z-10 flex items-baseline gap-1">{shipment.cargo.volume} <span className="text-xs font-bold text-slate-400">M³</span></div>
                            </div>
                            <div className="p-5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md rounded-[1.5rem] border border-white/50 dark:border-white/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-200 dark:hover:border-orange-800 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-100 to-transparent dark:from-orange-900/40 rounded-bl-[2rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 relative z-10">Colis</div>
                                <div className="text-2xl font-black text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors relative z-10 flex items-baseline gap-1">{shipment.cargo.packages} <span className="text-xs font-bold text-slate-400">Unités</span></div>
                            </div>
                            <div className="p-5 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md rounded-[1.5rem] border border-white/50 dark:border-white/5 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-200 dark:hover:border-orange-800 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-100 to-transparent dark:from-orange-900/40 rounded-bl-[2rem] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 relative z-10">Type</div>
                                <div className="text-sm font-black text-slate-900 dark:text-white group-hover:text-orange-500 transition-colors mt-2 uppercase tracking-wide relative z-10">{shipment.cargo.type}</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Carrier Info */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="glass-card-premium p-6 rounded-[2rem] border-white/10 relative overflow-hidden group shadow-xl shadow-slate-200/50 dark:shadow-none"
                    >
                        <div className="grain-overlay opacity-[0.02]" />
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
                            <Truck className="w-3 h-3 text-orange-500" /> Opérateur Logistique
                        </h3>
                        <div className="flex items-center gap-4 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md p-4 rounded-2xl border border-white/50 dark:border-white/5 shadow-sm transition-all hover:bg-white dark:hover:bg-slate-800 hover:shadow-md hover:border-orange-200 dark:hover:border-orange-800">
                            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-400 p-[2px] rounded-2xl shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
                                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center overflow-hidden">
                                    {shipment.carrier.logo ? (
                                        <img src={shipment.carrier.logo} alt="Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <Truck className="w-6 h-6 text-orange-500 group-hover:animate-pulse" />
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className="font-black text-slate-900 dark:text-white group-hover:text-orange-600 transition-colors uppercase tracking-tight text-lg">{shipment.carrier.name}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5 mt-0.5">
                                    <Zap className="w-3 h-3 text-amber-500" />
                                    {shipment.service_type === 'express' ? 'Prioritaire' : 'Standard'}
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center px-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Investissement Total</span>
                            <span className="text-xl font-black text-orange-600 dark:text-orange-400">{formatPrice(shipment.price)}</span>
                        </div>
                    </motion.div>

                    {/* Forwarder Addresses (New Feature) */}
                    {shipment.forwarder && (
                        <ForwarderAddressesDisplay forwarderId={shipment.forwarder.id} originCountry={shipment.origin.country} destCountry={shipment.destination.country} />
                    )}

                    {/* Dates */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="glass-card-premium p-6 rounded-[2rem] border-white/10 relative overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none"
                    >
                        <div className="grain-overlay opacity-[0.02]" />
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-orange-500" /> Calendrier
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 group p-3 rounded-2xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-orange-100 dark:hover:border-orange-900/30">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex flex-shrink-0 items-center justify-center border border-orange-100 dark:border-orange-800/50 group-hover:bg-orange-500 group-hover:border-transparent transition-all text-orange-600 group-hover:text-white shadow-sm">
                                    <Anchor className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Départ Effectif</div>
                                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                                        {shipment.dates.departure ? new Date(shipment.dates.departure).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'À confirmer'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 group p-3 rounded-2xl hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-emerald-100 dark:hover:border-emerald-900/30">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex flex-shrink-0 items-center justify-center border border-emerald-100 dark:border-emerald-800/50 group-hover:bg-emerald-500 group-hover:border-transparent transition-all text-emerald-600 group-hover:text-white shadow-sm">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arrivée Estimée</div>
                                    <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                                        {shipment.dates.arrival_estimated ? new Date(shipment.dates.arrival_estimated).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'À confirmer'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelivery}
                title="Confirmer la réception"
                message="Avez-vous bien reçu la marchandise en bon état ? Cette action libérera les fonds au prestataire de façon irréversible."
            />

            <ConfirmationModal
                isOpen={isDisputeModalOpen}
                onClose={() => setIsDisputeModalOpen(false)}
                onConfirm={handleDispute}
                title="Ouvrir un litige"
                message="Êtes-vous sûr de vouloir ouvrir un litige ? Les fonds resteront bloqués et l'équipe NextMove interviendra."
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
        </motion.div>
    );
}
