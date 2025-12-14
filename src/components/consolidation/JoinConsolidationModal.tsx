import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useForm } from "react-hook-form";
import {
    X,
    Loader2,
    Package,
    Scale,
    DollarSign,
    FileText,
    AlertCircle,
} from "lucide-react";
import { Consolidation, ConsolidationBookingData } from "../../types/consolidation";
import { consolidationService } from "../../services/consolidationService";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/currencyFormatter";

interface JoinConsolidationModalProps {
    isOpen: boolean;
    onClose: () => void;
    consolidation?: Consolidation | null;
    onSuccess: () => void;
}

export default function JoinConsolidationModal({
    isOpen,
    onClose,
    consolidation,
    onSuccess,
}: JoinConsolidationModalProps) {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<ConsolidationBookingData>();

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen && consolidation) {
            reset({
                consolidation_id: consolidation.id,
            });
        }
    }, [isOpen, consolidation, reset]);

    const weight = watch("weight_kg");
    const volume = watch("volume_cbm");

    // Calculate estimated cost
    const estimatedCost = (() => {
        if (!consolidation) return 0;
        if (consolidation.transport_mode === "sea" && volume && consolidation.price_per_cbm) {
            return volume * consolidation.price_per_cbm;
        }
        if (consolidation.transport_mode === "air" && weight && consolidation.price_per_kg) {
            return weight * consolidation.price_per_kg;
        }
        return 0;
    })();

    const onSubmit = async (data: ConsolidationBookingData) => {
        if (!consolidation) return;
        setLoading(true);
        try {
            await consolidationService.bookConsolidationSlot({
                ...data,
                consolidation_id: consolidation.id,
                // Ensure numbers
                weight_kg: Number(data.weight_kg),
                volume_cbm: Number(data.volume_cbm),
                cargo_value: data.cargo_value ? Number(data.cargo_value) : undefined,
            });
            onSuccess();
            onClose();
            // Optional: Navigate to shipments to see the new pending shipment
            navigate("/dashboard/client/shipments");
        } catch (error) {
            console.error("Booking error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !consolidation) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative z-[10000]">
                <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        Réserver une place
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        aria-label="Fermer"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    {/* Summary of Consolidation */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                        <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-2">
                            {consolidation.title || `Groupage ${consolidation.origin_port} → ${consolidation.destination_port}`}
                        </h3>
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                            <p>Mode: {consolidation.transport_mode === "sea" ? "Maritime" : "Aérien"}</p>
                            <p>Tarif: {formatCurrency(consolidation.price_per_cbm || consolidation.price_per_kg || 0, consolidation.currency)} / {consolidation.transport_mode === "sea" ? "CBM" : "kg"}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Poids (kg) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.1"
                                        {...register("weight_kg", { required: "Requis" })}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0.0"
                                    />
                                    <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                </div>
                                {errors.weight_kg && <span className="text-red-500 text-xs">{errors.weight_kg.message}</span>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Volume (CBM) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        {...register("volume_cbm", { required: "Requis" })}
                                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0.00"
                                    />
                                    {/* Using Cube explicitly imported from lucide-react if available or Package as fallback if Cube is not valid, but Cube should be valid. If uncertain, verify Lucide icons. Cube is standard. */}
                                    {/* Actually, let's stick to Package if Cube is unsure, but Cube is likely fine. Wait, I didn't verify Cube in import. Let's list icons in import above. I used Cube. */}
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 flex items-center justify-center font-bold text-[10px]">m³</div>
                                </div>
                                {errors.volume_cbm && <span className="text-red-500 text-xs">{errors.volume_cbm.message}</span>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Nature de la marchandise <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    {...register("goods_nature", { required: "Requis" })}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="ex: Vêtements, Electronique..."
                                />
                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Valeur déclarée (Optionnel)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    {...register("cargo_value")}
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="0.00"
                                />
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Description / Notes
                            </label>
                            <textarea
                                {...register("description")}
                                rows={3}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder="Détails supplémentaires..."
                            />
                        </div>

                        {estimatedCost > 0 && (
                            <div className="flex justify-between items-center bg-slate-50 dark:bg-gray-800 p-4 rounded-xl border border-slate-200 dark:border-gray-700">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Total Estimé</span>
                                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                    {formatCurrency(estimatedCost, consolidation.currency)}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-gray-700 flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/30 flex items-center"
                        >
                            {loading && <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />}
                            Confirmer la réservation
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
