import { useState, useEffect } from "react";
import PageHeader from "../../../components/common/PageHeader";
import {
    ShieldCheck,
    Search,
    Calendar,
    Eye,
    CheckCircle,
    XCircle,
    FileText,
    AlertCircle,
    Clock,
    ExternalLink,
} from "lucide-react";
import { kycService } from "../../../services/kycService";
import { useToast } from "../../../contexts/ToastContext";

export default function AdminKYCReview() {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [processing, setProcessing] = useState(false);
    const [documentUrls, setDocumentUrls] = useState<Record<string, string>>({});
    const { success, error: toastError } = useToast();

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const data = await kycService.getPendingSubmissions();
            setSubmissions(data || []);
        } catch (err) {
            console.error("Error fetching KYC submissions:", err);
            toastError("Erreur lors du chargement des dossiers KYC");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubmissions();
    }, []);

    const handleSelectSubmission = async (sub: any) => {
        setSelectedSubmission(sub);
        setRejectionReason("");
        // Fetch signed URLs for documents
        if (sub.document_urls) {
            const urls: Record<string, string> = {};
            for (const path of sub.document_urls) {
                try {
                    urls[path] = await kycService.getSignedUrl(path);
                } catch (e) {
                    console.error("Error fetching signed URL for", path, e);
                }
            }
            setDocumentUrls(urls);
        }
    };

    const handleAction = async (status: "verified" | "rejected") => {
        if (status === "rejected" && !rejectionReason) {
            toastError("Veuillez indiquer un motif de rejet");
            return;
        }

        setProcessing(true);
        try {
            await kycService.updateKYCStatus(
                selectedSubmission.id,
                selectedSubmission.user_id,
                status,
                status === "rejected" ? rejectionReason : undefined
            );

            success(
                status === "verified"
                    ? "Dossier KYC approuvé avec succès"
                    : "Dossier KYC rejeté"
            );
            setSelectedSubmission(null);
            fetchSubmissions();
        } catch (err) {
            console.error("Error updating KYC status:", err);
            toastError("Une erreur est survenue");
        } finally {
            setProcessing(false);
        }
    };

    const filteredSubmissions = submissions.filter((s) => {
        const fullName = `${s.submitted_data?.first_name} ${s.submitted_data?.last_name}`.toLowerCase();
        const email = s.profiles?.email?.toLowerCase() || "";
        const idNumber = s.submitted_data?.id_number?.toLowerCase() || "";

        return (
            fullName.includes(searchQuery.toLowerCase()) ||
            email.includes(searchQuery.toLowerCase()) ||
            idNumber.includes(searchQuery.toLowerCase())
        );
    });

    return (
        <div className="space-y-6">
            <PageHeader
                title="Revue KYC & Conformité"
                subtitle="Validez les documents d'identité pour les transactions à haut volume"
            />

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="bg-white dark:bg-gray-900 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-2 w-full sm:w-80">
                    <Search className="w-4 h-4 text-gray-400 ml-3" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher un dossier..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2"
                    />
                </div>

                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                    <Clock className="w-4 h-4" /> {submissions.length} dossier(s) en attente
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
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client / Identité</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Document</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date de soumission</th>
                                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredSubmissions.map((s) => (
                                    <tr key={s.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold">
                                                    {s.submitted_data?.first_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900 dark:text-white">
                                                        {s.submitted_data?.first_name} {s.submitted_data?.last_name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">{s.profiles?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-bold uppercase py-0.5 px-2 bg-slate-100 dark:bg-gray-800 rounded-md inline-block w-max">
                                                    {s.document_type?.replace('_', ' ')}
                                                </span>
                                                <span className="text-xs text-slate-500">N° {s.submitted_data?.id_number}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {new Date(s.created_at).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleSelectSubmission(s)}
                                                aria-label={`Voir le dossier de ${s.submitted_data?.first_name} ${s.submitted_data?.last_name}`}
                                                title={`Détails du dossier de ${s.submitted_data?.first_name} ${s.submitted_data?.last_name}`}
                                                className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredSubmissions.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl mb-3">
                                                    <CheckCircle className="w-10 h-10 text-gray-300" />
                                                </div>
                                                <p className="font-medium">Aucun dossier en attente</p>
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
            {selectedSubmission && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-gray-800">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Validation du dossier KYC</h3>
                                    <p className="text-sm text-slate-500">ID Soumission: {selectedSubmission.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedSubmission(null)}
                                aria-label="Fermer la revue"
                                className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            >
                                <XCircle className="w-6 h-6 text-slate-400" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Left Side: Info */}
                                <div className="space-y-8">
                                    <div>
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                                            <FileText className="w-4 h-4" /> Informations Déclatées
                                        </h4>
                                        <div className="bg-slate-50 dark:bg-gray-800/50 rounded-3xl p-6 grid grid-cols-2 gap-y-4 border border-slate-100 dark:border-gray-800">
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Prénom & Nom</p>
                                                <p className="font-bold text-slate-900 dark:text-white uppercase">{selectedSubmission.submitted_data?.first_name} {selectedSubmission.submitted_data?.last_name}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Date de naissance</p>
                                                <p className="font-bold text-slate-900 dark:text-white">{selectedSubmission.submitted_data?.dob}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Type de Document</p>
                                                <p className="font-bold text-slate-900 dark:text-white uppercase">{selectedSubmission.document_type?.replace('_', ' ')}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">N° de Document</p>
                                                <p className="font-bold text-slate-900 dark:text-white">{selectedSubmission.submitted_data?.id_number}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                                            <AlertCircle className="w-4 h-4" /> Décision Administrative
                                        </h4>
                                        <div className="space-y-4">
                                            <textarea
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                placeholder="Motif de rejet (obligatoire si rejeté)..."
                                                className="w-full bg-slate-50 dark:bg-gray-800 border-none rounded-3xl p-5 text-sm min-h-[120px] focus:ring-2 focus:ring-red-500/20"
                                            />
                                            <div className="flex gap-4">
                                                <button
                                                    disabled={processing}
                                                    onClick={() => handleAction('rejected')}
                                                    className="flex-1 bg-red-100 hover:bg-red-600 text-red-600 hover:text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    <XCircle className="w-5 h-5" /> Rejeter le dossier
                                                </button>
                                                <button
                                                    disabled={processing}
                                                    onClick={() => handleAction('verified')}
                                                    className="flex-[2] bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    <CheckCircle className="w-5 h-5" /> Approuver l'Identité
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Documents */}
                                <div>
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                                        <Eye className="w-4 h-4" /> Documents Justificatifs
                                    </h4>
                                    <div className="space-y-4">
                                        {selectedSubmission.document_urls?.map((path: string, i: number) => (
                                            <div key={i} className="group relative bg-slate-100 dark:bg-gray-800 rounded-3xl overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all aspect-video">
                                                {documentUrls[path]?.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)/) || documentUrls[path]?.includes('signedUrl') ? (
                                                    <img
                                                        src={documentUrls[path]}
                                                        alt={`Doc ${i + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full gap-2">
                                                        <FileText className="w-12 h-12 text-slate-400" />
                                                        <span className="text-xs font-bold text-slate-500">Fichier PDF ou Document</span>
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                    <a
                                                        href={documentUrls[path]}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="bg-white text-slate-900 p-3 rounded-2xl shadow-xl hover:scale-110 transition-transform flex items-center gap-2 text-sm font-bold"
                                                    >
                                                        <ExternalLink className="w-4 h-4" /> Ouvrir en grand
                                                    </a>
                                                </div>
                                                <div className="absolute bottom-4 left-4">
                                                    <span className="bg-slate-900/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                                        Pièce n°{i + 1}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
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
