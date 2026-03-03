import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
    ShieldCheck,
    Search,
    CheckCircle,
    XCircle,
    FileText,
    Clock,
    ExternalLink,
    Building2,
} from "lucide-react";
import { forwarderService, ForwarderProfile } from "../../../services/forwarderService";
import { supabase } from "../../../lib/supabase";
import { useToast } from "../../../contexts/ToastContext";
import { notificationService } from "../../../services/notificationService";

export default function AdminForwarderKYC() {
    const [forwarders, setForwarders] = useState<ForwarderProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedForwarder, setSelectedForwarder] = useState<ForwarderProfile | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [processing, setProcessing] = useState(false);
    const { success, error: toastError } = useToast();

    const fetchForwarders = async () => {
        setLoading(true);
        try {
            const data = await forwarderService.getForwarders();
            // Filter those who have pending documents or unverified status, or we can just show all with any documents.
            // Let's show all that have at least one document for review, or status pending/rejected.
            const kycForwarders = data.filter(
                (f) =>
                    f.kyc_status === "pending" ||
                    f.documents?.some((doc) => doc.status === "pending" || doc.status === "rejected")
            );
            setForwarders(kycForwarders || []);
        } catch (err) {
            console.error("Error fetching forwarders KYC:", err);
            toastError("Erreur lors du chargement des dossiers Prestataires");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForwarders();
    }, []);

    const handleSelectForwarder = (f: ForwarderProfile) => {
        setSelectedForwarder(f);
        setRejectionReason("");
    };

    const handleApproveDocument = async (docId: string) => {
        try {
            const { error } = await supabase
                .from("forwarder_documents")
                .update({ status: "approved" })
                .eq("id", docId);

            if (error) throw error;

            success("Document approuvé avec succès");
            // Update local state temporarily so we don't need to refetch everything immediately
            if (selectedForwarder) {
                setSelectedForwarder({
                    ...selectedForwarder,
                    documents: selectedForwarder.documents.map(d => d.id === docId ? { ...d, status: "approved" } : d)
                });
            }
        } catch (err) {
            console.error(err);
            toastError("Erreur lors de l'approbation du document");
        }
    };

    const handleRejectDocument = async (docId: string, reason: string) => {
        if (!reason) {
            toastError("Le motif de rejet est obligatoire");
            return;
        }
        try {
            const { error } = await supabase
                .from("forwarder_documents")
                .update({ status: "rejected" }) // We might need a rejection_reason column but sticking to status
                .eq("id", docId);

            if (error) throw error;

            success("Document rejeté");
            if (selectedForwarder) {
                setSelectedForwarder({
                    ...selectedForwarder,
                    documents: selectedForwarder.documents.map(d => d.id === docId ? { ...d, status: "rejected" } : d)
                });
            }
        } catch (err) {
            console.error(err);
            toastError("Erreur lors du rejet du document");
        }
    };

    const handleFinalDecision = async (status: "verified" | "rejected") => {
        if (!selectedForwarder) return;
        if (status === "rejected" && !rejectionReason) {
            toastError("Veuillez indiquer un motif de rejet global");
            return;
        }

        setProcessing(true);
        try {
            // 1. Update Profile KYC Status
            await supabase
                .from("profiles")
                .update({
                    kyc_status: status,
                    kyc_rejection_reason: status === 'rejected' ? rejectionReason : null
                })
                .eq("id", selectedForwarder.id);

            // 2. Notify User
            const title = status === 'verified' ? "🎉 Compte Prestataire Vérifié" : "⚠️ Documents Rejetés";
            const message = status === 'verified'
                ? "Félicitations ! Vos documents ont été validés. Votre profil est maintenant public et vous pouvez soumettre des offres sur les RFQs."
                : `Votre dossier KYC a été rejeté. Motif : ${rejectionReason}. Veuillez mettre à jour vos documents.`;

            await notificationService.sendNotification(
                selectedForwarder.id,
                title,
                message,
                status === 'verified' ? "success" : "error",
                "/dashboard/forwarder/kyc"
            );

            success(`Prestataire ${status === 'verified' ? 'approuvé' : 'rejeté'} avec succès`);
            setSelectedForwarder(null);
            fetchForwarders();
        } catch (err) {
            console.error("Error updating forwarder KYC status:", err);
            toastError("Une erreur est survenue");
        } finally {
            setProcessing(false);
        }
    };

    const filtered = forwarders.filter((f) => {
        const company = (f.company_name || "").toLowerCase();
        const email = (f.email || "").toLowerCase();
        return company.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Validation KYC Prestataires"
                subtitle="Vérifiez les documents légaux des transitaires (CNI, RCCM, NINEA...)"
            />

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-2 w-full sm:w-80">
                    <Search className="w-4 h-4 text-gray-400 ml-3" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher une entreprise..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2"
                    />
                </div>

                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Clock className="w-4 h-4" /> {forwarders.length} dossier(s) à traiter
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Entreprise</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut Profil</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Documents</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filtered.map((f) => (
                                    <tr key={f.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 font-bold">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">
                                                        {f.company_name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{f.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-bold uppercase py-1 px-3 rounded-md inline-block w-max ${f.kyc_status === 'verified' ? 'bg-green-100 text-green-700' :
                                                f.kyc_status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    f.kyc_status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-slate-100 text-slate-700'
                                                }`}>
                                                {f.kyc_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <FileText className="w-4 h-4" />
                                                {f.documents?.length || 0} uploadé(s) ({(f.documents?.filter(d => d.status === 'pending') || []).length} en attente)
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleSelectForwarder(f)}
                                                className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                            >
                                                Traiter
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl mb-3">
                                                    <CheckCircle className="w-10 h-10 text-gray-300" />
                                                </div>
                                                <p className="font-medium">Aucun dossier prestataire en attente</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {selectedForwarder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-gray-800">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-600 text-white rounded-xl shadow-lg shadow-orange-500/20">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Dossier KYC: {selectedForwarder.company_name}</h3>
                                    <p className="text-sm text-slate-500">{selectedForwarder.email} • {selectedForwarder.country}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedForwarder(null)}
                                aria-label="Fermer la modale"
                                className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <XCircle className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
                            <h4 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                                <FileText className="w-4 h-4" /> Documents fournis
                            </h4>

                            {/* Document Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                                {selectedForwarder.documents?.map((doc) => (
                                    <div key={doc.id} className="bg-slate-50 dark:bg-gray-800 rounded-2xl p-4 border border-slate-200 dark:border-gray-700 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="font-bold text-slate-800 dark:text-white uppercase text-sm">{doc.name.replace(/_/g, " ")}</span>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                                                doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                                    'bg-orange-100 text-orange-700'
                                                }`}>
                                                {doc.status}
                                            </span>
                                        </div>

                                        <div className="flex-1 bg-slate-200 dark:bg-gray-900 rounded-xl mb-4 overflow-hidden relative group aspect-video flex items-center justify-center">
                                            {doc.url.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)/) ? (
                                                <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-center text-slate-400">
                                                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                                    <span className="text-xs">Format PDF/Doc</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="bg-white text-slate-900 p-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-xl">
                                                    <ExternalLink className="w-4 h-4" /> Voir
                                                </a>
                                            </div>
                                        </div>

                                        {doc.status === 'pending' && (
                                            <div className="flex gap-2 mt-auto">
                                                <button onClick={() => handleApproveDocument(doc.id)} className="flex-1 py-2 bg-green-100 text-green-700 hover:bg-green-600 hover:text-white rounded-lg text-sm font-bold transition-colors">
                                                    Valider
                                                </button>
                                                <button onClick={() => {
                                                    const reason = prompt("Motif du rejet pour ce document ?");
                                                    if (reason) handleRejectDocument(doc.id, reason);
                                                }} className="flex-1 py-2 bg-red-100 text-red-700 hover:bg-red-600 hover:text-white rounded-lg text-sm font-bold transition-colors">
                                                    Rejeter
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {(!selectedForwarder.documents || selectedForwarder.documents.length === 0) && (
                                    <p className="text-slate-500 col-span-full">Aucun document uploadé pour le moment.</p>
                                )}
                            </div>

                            <hr className="border-slate-200 dark:border-gray-800 my-8" />

                            {/* Global Decision */}
                            <div>
                                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                                    <ShieldCheck className="w-4 h-4" /> Décision Finale sur le Profil
                                </h4>
                                <div className="flex flex-col gap-4 max-w-xl">
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        placeholder="Motif (obligatoire si rejet du profil)..."
                                        className="w-full bg-slate-50 dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-2xl p-4 text-sm min-h-[100px] focus:ring-2 focus:ring-orange-500/20"
                                    />
                                    <div className="flex gap-4">
                                        <button
                                            disabled={processing}
                                            onClick={() => handleFinalDecision('rejected')}
                                            className="flex-1 bg-red-100 hover:bg-red-600 text-red-600 hover:text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <XCircle className="w-5 h-5" /> Rejeter Profil
                                        </button>
                                        <button
                                            disabled={processing}
                                            onClick={() => handleFinalDecision('verified')}
                                            className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <CheckCircle className="w-5 h-5" /> Vérifier le Prestataire (Activer)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
