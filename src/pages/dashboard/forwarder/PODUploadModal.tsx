import { useState } from "react";
import { X, Upload, FileText, CheckCircle } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../contexts/ToastContext";
import { shipmentService } from "../../../services/shipmentService";

interface PODUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    shipmentId: string;
    onSuccess: () => void;
}

export default function PODUploadModal({
    isOpen,
    onClose,
    shipmentId,
    onSuccess,
}: PODUploadModalProps) {
    const { success, error } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [recipientName, setRecipientName] = useState("");
    const [notes, setNotes] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            error("Veuillez sélectionner un fichier");
            return;
        }

        setIsUploading(true);
        try {
            // 1. Upload to Supabase Storage Storage
            const fileExt = file.name.split(".").pop();
            const filePath = `pods/${shipmentId}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from("documents")
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const {
                data: { publicUrl },
            } = supabase.storage.from("documents").getPublicUrl(filePath);

            // 2. Insert into shipment_pods table
            const { error: podError } = await supabase.from("shipment_pods").insert({
                shipment_id: shipmentId,
                recipient_name: recipientName || "Client (Non spécifié)",
                notes: notes,
                photo_urls: [publicUrl],
                status: "pending", // Waiting for admin/client validation
                submitted_at: new Date().toISOString(),
            });

            if (podError) throw podError;

            // 3. Update shipment status to pending_confirmation
            await shipmentService.updateShipment(shipmentId, {
                status: "pending_confirmation" as any,
            });

            success("Preuve de livraison envoyée avec succès");
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Erreur upload POD:", err);
            error(err.message || "Erreur lors de l'envoi du POD");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/5">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                        Preuve de Livraison (POD)
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Document / Photo (Requis)
                        </label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 dark:border-slate-700 border-dashed rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer relative">
                            <div className="space-y-1 text-center">
                                {file ? (
                                    <div className="flex flex-col items-center">
                                        <FileText className="mx-auto h-12 w-12 text-blue-500" />
                                        <span className="mt-2 block text-sm font-medium text-slate-900 dark:text-white">
                                            {file.name}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setFile(null);
                                            }}
                                            className="mt-1 text-xs text-rose-500 hover:text-rose-600 font-medium"
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <Upload className="mx-auto h-12 w-12 text-slate-400" />
                                        <div className="flex text-sm text-slate-600 dark:text-slate-400 justify-center">
                                            <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                                                <span>Sélectionner un fichier</span>
                                                <input
                                                    type="file"
                                                    className="sr-only"
                                                    accept="image/*,application/pdf"
                                                    onChange={(e) =>
                                                        setFile(e.target.files?.[0] || null)
                                                    }
                                                />
                                            </label>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            PNG, JPG, PDF jusqu'à 5MB
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Nom du Réceptionnaire
                        </label>
                        <input
                            type="text"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                            placeholder="Ex: Jean Dupont"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Notes additionnelles (Optionnel)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                            rows={3}
                            placeholder="Informations supplémentaires sur la livraison..."
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isUploading}
                            className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={isUploading || !file}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                        >
                            {isUploading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Envoi...
                                </>
                            ) : (
                                "Confirmer la livraison"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
