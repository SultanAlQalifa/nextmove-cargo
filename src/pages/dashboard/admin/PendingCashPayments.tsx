import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../contexts/ToastContext";
import { Check, X, FileText, Tag } from "lucide-react";

export default function PendingCashPayments() {
    const [pendingPayments, setPendingPayments] = useState<any[]>([]);
    const { success: showSuccess, error: showError } = useToast();
    const [loading, setLoading] = useState(true);

    // Charger les paiements en attente
    useEffect(() => {
        loadPendingCashPayments();
    }, []);

    async function loadPendingCashPayments() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("transactions")
                .select(`
            *,
            user:profiles(full_name, email, company_name)
        `)
                .eq("status", "pending_cash")
                .order("created_at", { ascending: false });

            if (error) throw error;
            setPendingPayments(data || []);
        } catch (err: any) {
            console.error("Error loading pending cash payments:", err);
            showError("Erreur lors du chargement des paiements");
        } finally {
            setLoading(false);
        }
    }

    async function validateCashPayment(transactionId: string, shipmentId?: string) {
        if (!window.confirm("Confirmer la réception des fonds pour ce paiement ?")) return;

        try {
            // 1. Mettre à jour le statut de la transaction
            const { error: txnError } = await supabase
                .from("transactions")
                .update({ status: "completed" })
                .eq("id", transactionId);

            if (txnError) throw txnError;

            // 2. Mettre à jour le statut de l'expédition (si applicable)
            if (shipmentId) {
                const { error: shipError } = await supabase
                    .from("shipments")
                    .update({
                        // On considère que si le paiement est validé, l'expédition est "confirmed" (payée)
                        payment_status: "paid",
                        status: "pending" // ou confirmed, selon workflow. "pending" est le state par défaut après paiement.
                    })
                    .eq("id", shipmentId);

                if (shipError) throw shipError;
            }

            // 3. Notifier le client (Simulé ici, idéalement via Edge Function ou Trigger)
            // L'utilisateur verra son statut changer.

            showSuccess("Paiement validé avec succès");
            loadPendingCashPayments(); // Recharger la liste
        } catch (error: any) {
            console.error("Validation failed:", error);
            showError("Erreur de validation");
        }
    }

    async function rejectCashPayment(transactionId: string) {
        const reason = window.prompt("Raison du rejet :");
        if (!reason) return;

        try {
            const { error: txnError } = await supabase
                .from("transactions")
                .update({
                    status: "failed",
                    description: `Rejeté: ${reason}`
                })
                .eq("id", transactionId);

            if (txnError) throw txnError;

            showSuccess("Paiement rejeté");
            loadPendingCashPayments();
        } catch (error) {
            console.error("Rejection failed:", error);
            showError("Erreur lors du rejet");
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">
                    Paiements Espèces en Attente
                </h1>
                <button
                    onClick={loadPendingCashPayments}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-sm font-medium"
                >
                    Actualiser
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : pendingPayments.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
                    <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Tout est à jour</h3>
                    <p className="text-gray-500">Aucun paiement en attente de validation.</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Client
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Montant
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Détails
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {pendingPayments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(payment.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {payment.user?.full_name || "Utilisateur Inconnu"}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {payment.user?.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900">
                                            {payment.amount.toLocaleString()} {payment.currency}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex flex-col gap-1">
                                            <span className="flex items-center gap-1">
                                                <Tag className="w-3 h-3" />
                                                Ref: {payment.reference}
                                            </span>
                                            {payment.metadata?.shipment_id && (
                                                <span className="flex items-center gap-1 text-blue-600">
                                                    <FileText className="w-3 h-3" />
                                                    Expédition {payment.metadata.shipment_id.slice(0, 8)}...
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => validateCashPayment(payment.id, payment.metadata?.shipment_id)}
                                                className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                                title="Valider le paiement"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => rejectCashPayment(payment.id)}
                                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                                title="Rejeter"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
